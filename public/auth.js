// Auth Logic - DuoDuels
// firebase-config.js'den sonra, client.js'den önce yüklenir

let currentUser = null;
let userProfile = null;
let authIdToken = null;
let _tokenRefreshTimer = null;
let _enabledProviders = new Set(["google", "facebook", "guest"]);

// Local dev bypass — Firebase olmadan çalışır
const _isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

function _getOrCreateDevUid() {
  let uid = localStorage.getItem('dd_dev_uid');
  if (!uid) {
    uid = 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('dd_dev_uid', uid);
  }
  return uid;
}

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

  // Local dev'de Firebase olmadan direkt geç
  if (_isLocalDev) {
    _devSignIn();
    return;
  }

  try {
    await auth.signInAnonymously();
  } catch (err) {
    console.error("Guest sign-in error:", err);
    // Firebase Anonymous auth açık değilse local bypass'a düş
    if (_isLocalDev) {
      _devSignIn();
    } else {
      Swal.fire({
        title: "Giriş Hatası",
        text: "Misafir girişi başarısız. Firebase Authentication > Anonymous provider'ı açın.",
        icon: "error"
      });
    }
  }
}

let _devModeActive = false;

function _devShowScreen(name) {
  // showScreen() setupSocketListeners içinde olduğu için global değil.
  // Ekranları direkt DOM'dan geçiş yap.
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(name + '-screen') || document.getElementById(name);
  if (el) el.classList.add('active');
}

function _devSignIn() {
  _devModeActive = true;
  const uid = _getOrCreateDevUid();
  currentUser = { uid, email: null, photoURL: null, displayName: 'DevUser' };
  authIdToken = null; // Sunucu fallbackUserId kullanacak

  const splash = document.getElementById('app-splash');
  dismissSplash(splash);

  // Daha önce kaydedilmiş profil var mı?
  const saved = localStorage.getItem('dd_dev_profile');
  if (saved) {
    try {
      userProfile = JSON.parse(saved);
      enterLobby();
      return;
    } catch(e) {}
  }
  _devShowScreen('profile-setup');
}

// --- LOCAL DEV: Cache'teki Firebase oturumunu temizle, splash'ı garantiye al ---
if (_isLocalDev) {
  // Önceden cache'lenmiş Firebase kullanıcısı varsa sign out yap
  // (getIdToken() takılmasın diye)
  if (auth) auth.signOut().catch(() => {});

  // 2 saniye içinde splash hâlâ ekrandaysa zorla kaldır
  setTimeout(function() {
    const splash = document.getElementById('app-splash');
    if (splash) {
      dismissSplash(splash);
      showScreen('auth');
    }
  }, 2000);
}

// --- AUTH STATE OBSERVER ---
auth && auth.onAuthStateChanged && auth.onAuthStateChanged(async (user) => {
  // Dev modda Firebase observer'ı yok say
  if (_devModeActive) return;

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

// --- ANONYMOUS AVATAR ---
function _anonymousAvatarSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#2c3e50"/>
    <circle cx="32" cy="24" r="11" fill="#7f8c8d"/>
    <ellipse cx="32" cy="54" rx="18" ry="12" fill="#7f8c8d"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

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
  };

  // Local dev — Firestore yerine localStorage kullan
  if (_isLocalDev && !authIdToken) {
    userProfile = { ...profileData };
    localStorage.setItem('dd_dev_profile', JSON.stringify(profileData));
    enterLobby();
    return;
  }

  const profileDataWithTimestamps = {
    ...profileData,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('users').doc(currentUser.uid).set(profileDataWithTimestamps);
    userProfile = { ...profileDataWithTimestamps };
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

  // Lobby ekranına geç (showScreen global değilse _devShowScreen kullan)
  if (typeof showScreen === 'function') {
    showScreen('lobby');
  } else {
    _devShowScreen('lobby');
  }

  // Lobby'deki kullanıcı adı greeting
  const greetEl = document.getElementById('lobby-username-greeting');
  if (greetEl) greetEl.textContent = userProfile.username;

  // Avatar
  const avatarEl = document.getElementById('lobby-avatar');
  if (avatarEl) {
    const photo = userProfile.photoURL || currentUser.photoURL || '';
    if (photo) {
      avatarEl.src = photo;
      avatarEl.onerror = () => { avatarEl.src = _anonymousAvatarSvg(); };
    } else {
      avatarEl.src = _anonymousAvatarSvg();
    }
  }

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

// --- SETTINGS ---
function openSettings() {
  if (typeof showScreen === 'function') showScreen('settings');
  else _devShowScreen('settings');

  // Sync avatar in settings
  const photo = (userProfile && userProfile.photoURL) || (currentUser && currentUser.photoURL) || '';
  const settingsAv = document.getElementById('settings-avatar');
  if (settingsAv) settingsAv.src = photo || _anonymousAvatarSvg();
}

async function handleAvatarChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('settings-save-status');
  if (statusEl) statusEl.textContent = typeof t === 'function' ? t('saving') : 'Kaydediliyor...';

  try {
    const dataUrl = await _compressImage(file, 240, 0.82);

    // Update UI immediately
    const settingsAv = document.getElementById('settings-avatar');
    if (settingsAv) settingsAv.src = dataUrl;
    const lobbyAv = document.getElementById('lobby-avatar');
    if (lobbyAv) lobbyAv.src = dataUrl;

    // Persist to Firestore (or localStorage for dev)
    if (userProfile) userProfile.photoURL = dataUrl;
    if (_isLocalDev && !authIdToken) {
      const saved = JSON.parse(localStorage.getItem('dd_dev_profile') || '{}');
      saved.photoURL = dataUrl;
      localStorage.setItem('dd_dev_profile', JSON.stringify(saved));
    } else if (currentUser) {
      await db.collection('users').doc(currentUser.uid).update({ photoURL: dataUrl });
    }

    if (statusEl) statusEl.textContent = typeof t === 'function' ? t('saved') : 'Kaydedildi ✓';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2500);
  } catch (err) {
    console.error('Avatar kaydetme hatası:', err);
    if (statusEl) statusEl.textContent = '❌ ' + (err.message || 'Hata');
  }
  input.value = '';
}

function _compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
        else        { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", configureAuthProviderVisibility);
} else {
  configureAuthProviderVisibility();
}
