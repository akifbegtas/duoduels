// Auth Logic - DuoDuels
// firebase-config.js'den sonra, client.js'den önce yüklenir

let currentUser = null;
let userProfile = null;
let authIdToken = null;
let _tokenRefreshTimer = null;
let _enabledProviders = new Set(["google", "facebook", "guest"]);

function detectAuthPlatform() {
  if (window.Capacitor && typeof window.Capacitor.getPlatform === "function") {
    const p = window.Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
  }
  return "web";
}

function configureAuthProviderVisibility() {
  const platform = detectAuthPlatform();
  if (platform === "ios") {
    _enabledProviders = new Set(["google", "facebook", "apple", "guest"]);
  } else if (platform === "android") {
    _enabledProviders = new Set(["google", "facebook", "guest"]);
  } else {
    // web
    _enabledProviders = new Set(["google", "facebook", "guest"]);
  }

  const map = [
    { key: "google", selector: ".auth-btn-google" },
    { key: "facebook", selector: ".auth-btn-facebook" },
    { key: "apple", selector: ".auth-btn-apple" },
    { key: "guest", selector: ".auth-btn-guest" }
  ];

  map.forEach(({ key, selector }) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.display = _enabledProviders.has(key) ? "" : "none";
  });
}

// --- SIGN IN METHODS ---
async function signInWithGoogle() {
  if (!_enabledProviders.has("google")) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await auth.signInWithRedirect(provider);
    } else {
      console.error("Google sign-in error:", err);
      Swal.fire({ title: "Giriş Hatası", text: err.message, icon: "error" });
    }
  }
}

async function signInWithFacebook() {
  if (!_enabledProviders.has("facebook")) return;
  const provider = new firebase.auth.FacebookAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await auth.signInWithRedirect(provider);
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      Swal.fire({
        title: "Hesap Mevcut",
        text: "Bu e-posta ile daha önce farklı bir yöntemle giriş yapılmış. Lütfen o yöntemi kullanın.",
        icon: "warning"
      });
    } else {
      console.error("Facebook sign-in error:", err);
      Swal.fire({ title: "Giriş Hatası", text: err.message, icon: "error" });
    }
  }
}

async function signInWithApple() {
  if (!_enabledProviders.has("apple")) {
    Swal.fire({
      title: "Bu platformda kapalı",
      text: "Apple ile giriş sadece iOS'ta aktif.",
      icon: "info"
    });
    return;
  }
  const provider = new firebase.auth.OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  try {
    await auth.signInWithPopup(provider);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await auth.signInWithRedirect(provider);
    } else {
      console.error("Apple sign-in error:", err);
      Swal.fire({ title: "Giriş Hatası", text: err.message, icon: "error" });
    }
  }
}

async function signInAsGuest() {
  if (!_enabledProviders.has("guest")) return;
  try {
    await auth.signInAnonymously();
  } catch (err) {
    console.error("Guest sign-in error:", err);
    Swal.fire({
      title: "Giriş Hatası",
      text: "Misafir girişi başarısız. Firebase Authentication > Anonymous provider'ı açın.",
      icon: "error"
    });
  }
}

// --- AUTH STATE OBSERVER ---
auth.onAuthStateChanged(async (user) => {
  const splash = document.getElementById('app-splash');

  if (user) {
    currentUser = user;
    // Token al
    authIdToken = await user.getIdToken();
    startTokenRefresh();

    // Firestore'dan profil çek
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        userProfile = doc.data();
        // lastLogin güncelle
        db.collection('users').doc(user.uid).update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
        enterLobby();
      } else {
        // İlk kez giriş - profil oluştur ekranı
        dismissSplash(splash);
        showScreen('profileSetup');
      }
    } catch (err) {
      console.error("Profil çekme hatası:", err);
      dismissSplash(splash);
      showScreen('profileSetup');
    }
  } else {
    // Kullanıcı yok - auth ekranı
    currentUser = null;
    userProfile = null;
    authIdToken = null;
    stopTokenRefresh();
    dismissSplash(splash);
    showScreen('auth');
  }
});

// --- SPLASH DISMISS ---
function dismissSplash(splash) {
  if (!splash) return;
  splash.classList.add('splash-hide');
  setTimeout(() => {
    splash.remove();
    document.body.style.backgroundColor = '#f5f0e8';
  }, 600);
}

// --- PROFILE SAVE ---
async function saveProfile() {
  const usernameInput = document.getElementById('setup-username');
  const genderEl = document.querySelector('input[name="setup-gender"]:checked');

  const username = usernameInput.value.trim();
  if (!username) {
    Swal.fire({ title: "Uyarı", text: "Kullanıcı adı giriniz", icon: "warning" });
    return;
  }
  if (username.length > 12) {
    Swal.fire({ title: "Uyarı", text: "Kullanıcı adı en fazla 12 karakter olabilir", icon: "warning" });
    return;
  }
  if (!genderEl) {
    Swal.fire({ title: "Uyarı", text: "Cinsiyet seçiniz", icon: "warning" });
    return;
  }

  const profileData = {
    username: username,
    gender: genderEl.value,
    email: currentUser.email || '',
    photoURL: currentUser.photoURL || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('users').doc(currentUser.uid).set(profileData);
    userProfile = { ...profileData };
    enterLobby();
  } catch (err) {
    console.error("Profil kaydetme hatası:", err);
    Swal.fire({ title: "Hata", text: "Profil kaydedilemedi: " + err.message, icon: "error" });
  }
}

// --- ENTER LOBBY ---
function enterLobby() {
  if (!userProfile || !currentUser) return;

  // Tema uygula
  applyGenderTheme(userProfile.gender);

  // Splash dismiss
  const splash = document.getElementById('app-splash');
  dismissSplash(splash);

  // Lobby ekranına geç
  showScreen('lobby');

  // Lobby'deki kullanıcı adı greeting
  const greetEl = document.getElementById('lobby-username-greeting');
  if (greetEl) greetEl.textContent = userProfile.username;

  // Socket bağlantısını başlat
  connectSocket();
}

// --- SIGN OUT ---
async function signOut() {
  try {
    if (typeof socket !== 'undefined' && socket && socket.connected) {
      socket.disconnect();
    }
    currentRoom = null;
    sessionStorage.removeItem("duoduels_room");
    await auth.signOut();
    // onAuthStateChanged auth ekranına yönlendirecek
  } catch (err) {
    console.error("Çıkış hatası:", err);
  }
}

// --- TOKEN REFRESH (50 dakikada bir) ---
function startTokenRefresh() {
  stopTokenRefresh();
  _tokenRefreshTimer = setInterval(async () => {
    if (currentUser) {
      try {
        authIdToken = await currentUser.getIdToken(true);
        // Socket varsa token'ı güncelle
        if (typeof socket !== 'undefined' && socket && socket.connected) {
          socket.auth.token = authIdToken;
        }
      } catch (err) {
        console.error("Token yenileme hatası:", err);
      }
    }
  }, 50 * 60 * 1000); // 50 dakika
}

function stopTokenRefresh() {
  if (_tokenRefreshTimer) {
    clearInterval(_tokenRefreshTimer);
    _tokenRefreshTimer = null;
  }
}

// --- GET PLAYER ID (currentUser.uid wrapper) ---
function getMyPlayerId() {
  return currentUser ? currentUser.uid : null;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", configureAuthProviderVisibility);
} else {
  configureAuthProviderVisibility();
}
