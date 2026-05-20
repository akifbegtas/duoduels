// Auth Logic - DuoDuels
// firebase-config.js'den sonra, client.js'den önce yüklenir

let currentUser = null;
let userProfile = null;
let authIdToken = null;
let _tokenRefreshTimer = null;
let _enabledProviders = new Set(["google", "facebook", "guest"]);
let _isGuestLocal = false; // Giriş yapmadan oynayan kullanıcı
let _authBootstrapPromise = null;
let _authBootstrapUid = null;
let _hydratedAuthUid = null;

window._currentUser = null;

function syncCurrentUserGlobal() {
  window._currentUser = currentUser;
}

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

function shouldUseRedirectAuth() {
  if (detectAuthPlatform() !== "web") return false;
  const ua = navigator.userAgent || '';
  const isMobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true;
  const isHostedWeb = window.location.hostname === 'duoduels.com'
    || window.location.hostname === 'www.duoduels.com'
    || window.location.hostname.endsWith('.run.app');
  return isMobileBrowser || isStandalone || isHostedWeb;
}

function showScreenSafe(name) {
  if (typeof showScreen === 'function') {
    showScreen(name);
    return true;
  }

  const aliasMap = {
    profileSetup: 'profile-setup'
  };
  const alias = aliasMap[name] || name;
  const candidates = [
    document.getElementById(name + '-screen'),
    document.getElementById(name),
    document.getElementById(alias + '-screen'),
    document.getElementById(alias)
  ].filter(Boolean);

  if (!candidates.length) return false;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  candidates[0].classList.add('active');
  return true;
}

function waitForClientReady(callback, attempts = 40) {
  const hasTheme = typeof applyGenderTheme === 'function';
  const hasSocket = typeof connectSocket === 'function';
  if (hasTheme && hasSocket) {
    callback();
    return;
  }

  if (attempts <= 0) {
    callback();
    return;
  }

  setTimeout(() => waitForClientReady(callback, attempts - 1), 100);
}

async function getIdTokenWithRetry(user, attempts = 3) {
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await user.getIdToken(attempt > 0);
    } catch (err) {
      lastError = err;
      console.warn(`Token alma denemesi ${attempt + 1}/${attempts} başarısız:`, err.message);
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error('Firebase token alınamadı');
}

async function completeFirebaseSignIn(user, source = 'unknown') {
  if (!user || _devModeActive) return false;

  if (_authBootstrapPromise && _authBootstrapUid === user.uid) {
    return _authBootstrapPromise;
  }

  const alreadyHydrated = _hydratedAuthUid === user.uid
    && currentUser
    && currentUser.uid === user.uid
    && userProfile;
  if (alreadyHydrated) {
    enterLobby();
    return true;
  }

  _authBootstrapUid = user.uid;
  _authBootstrapPromise = (async () => {
    const splash = document.getElementById('app-splash');

    try {
      currentUser = user;
      syncCurrentUserGlobal();

      if (!user.isAnonymous) {
        _isGuestLocal = false;
      }

      if (user.isAnonymous) {
        authIdToken = await getIdTokenWithRetry(user);
        startTokenRefresh();
        dismissSplash(splash);
        showScreenSafe('profileSetup');
        _hydratedAuthUid = user.uid;
        return true;
      }

      authIdToken = await getIdTokenWithRetry(user);
      startTokenRefresh();

      const profile = await runWithLegacyProfileFallback(
        () => fetchOwnProfileFromServer(),
        () => fetchOwnProfileFromFirestore(),
        'Profile load'
      );

      if (profile) {
        userProfile = profile;
        _hydratedAuthUid = user.uid;
        enterLobby();
      } else {
        dismissSplash(splash);
        showScreenSafe('profileSetup');
        _hydratedAuthUid = user.uid;
      }

      return true;
    } catch (err) {
      console.error(`Auth bootstrap error (${source}):`, err);
      dismissSplash(splash);
      showScreenSafe('auth');
      Swal.fire({
        title: t('auth_error'),
        text: err.message || 'Giriş tamamlanamadı',
        icon: 'error'
      });
      return false;
    } finally {
      _authBootstrapPromise = null;
      _authBootstrapUid = null;
    }
  })();

  return _authBootstrapPromise;
}

async function getApiAuthToken(forceRefresh = false) {
  if (_isGuestLocal || _devModeActive || !currentUser) return null;
  if (forceRefresh || !authIdToken) {
    authIdToken = await getIdTokenWithRetry(currentUser, forceRefresh ? 2 : 3);
  }
  return authIdToken;
}

async function apiRequest(path, options = {}) {
  const token = await getApiAuthToken(options.forceRefresh === true);
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      payload = { raw };
    }
  }

  if (!response.ok) {
    const error = new Error((payload && (payload.error || payload.message)) || response.statusText || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function fetchOwnProfileFromServer() {
  const data = await apiRequest('/api/me/profile');
  return data && data.profile ? data.profile : null;
}

async function saveOwnProfileToServer(profileData) {
  const data = await apiRequest('/api/me/profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
  return data && data.profile ? data.profile : null;
}

async function saveOwnAvatarToServer(photoURL) {
  const data = await apiRequest('/api/me/profile/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ photoURL }),
  });
  return data && data.photoURL ? data.photoURL : photoURL;
}

function shouldUseLegacyProfileFallback(err) {
  if (!db || !currentUser || _isGuestLocal || _devModeActive) return false;
  if (!err) return false;

  if ([401, 403, 404, 429, 500, 502, 503, 504].includes(err.status)) {
    return true;
  }

  const message = String(err.message || '').toLowerCase();
  return message.includes('failed to fetch')
    || message.includes('networkerror')
    || message.includes('authentication service unavailable')
    || message.includes('invalid auth token')
    || message.includes('missing auth token');
}

async function runWithLegacyProfileFallback(primaryTask, fallbackTask, contextLabel) {
  try {
    return await primaryTask();
  } catch (err) {
    if (!shouldUseLegacyProfileFallback(err)) {
      throw err;
    }

    console.warn(`${contextLabel}: profile API kullanılamadı, Firestore fallback devreye alınıyor.`, err.message);
    return fallbackTask();
  }
}

async function fetchOwnProfileFromFirestore() {
  if (!db || !currentUser) return null;

  const userRef = db.collection('users').doc(currentUser.uid);
  const profileDoc = await userRef.get();

  if (!profileDoc.exists) {
    return null;
  }

  const profileData = profileDoc.data() || {};
  const updateData = {
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    onlineStatus: 'online',
  };

  if (!profileData.friendCode) {
    const friendCode = await _getUniqueFriendCode();
    updateData.friendCode = friendCode;
    profileData.friendCode = friendCode;
  }

  if (!profileData.email && currentUser.email) {
    updateData.email = currentUser.email;
    profileData.email = currentUser.email;
  }

  if (!profileData.photoURL && currentUser.photoURL) {
    updateData.photoURL = currentUser.photoURL;
    profileData.photoURL = currentUser.photoURL;
  }

  await userRef.set(updateData, { merge: true });

  return {
    ...profileData,
    email: profileData.email || currentUser.email || '',
    photoURL: profileData.photoURL || currentUser.photoURL || '',
    onlineStatus: 'online',
  };
}

async function saveOwnProfileToFirestore(profileData) {
  if (!db || !currentUser) {
    throw new Error('Firestore unavailable');
  }

  const userRef = db.collection('users').doc(currentUser.uid);
  const existingDoc = await userRef.get();
  const existingData = existingDoc.exists ? (existingDoc.data() || {}) : {};
  const friendCode = existingData.friendCode || await _getUniqueFriendCode();

  const payload = {
    username: profileData.username,
    gender: profileData.gender,
    email: profileData.email || currentUser.email || existingData.email || '',
    photoURL: profileData.photoURL || currentUser.photoURL || existingData.photoURL || '',
    friendCode,
    friendCount: Number.isFinite(existingData.friendCount) ? existingData.friendCount : 0,
    onlineStatus: 'online',
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (!existingDoc.exists) {
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.stats = existingData.stats || {};
    payload.achievements = existingData.achievements || {};
    payload.blockedUsers = Array.isArray(existingData.blockedUsers) ? existingData.blockedUsers : [];
  }

  await userRef.set(payload, { merge: true });

  return {
    ...existingData,
    ...payload,
    friendCode,
    stats: existingData.stats || payload.stats || {},
    achievements: existingData.achievements || payload.achievements || {},
    blockedUsers: Array.isArray(existingData.blockedUsers) ? existingData.blockedUsers : (payload.blockedUsers || []),
  };
}

async function saveOwnAvatarToFirestore(photoURL) {
  if (!db || !currentUser) {
    throw new Error('Firestore unavailable');
  }

  await db.collection('users').doc(currentUser.uid).set({
    photoURL,
    onlineStatus: 'online',
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return photoURL;
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
  const platform = detectAuthPlatform();

  // iOS/Android: Capacitor Google Auth plugin (native)
  if (platform === 'ios' || platform === 'android') {
    try {
      // GoogleAuth plugin'den import
      const { GoogleAuth } = window.Capacitor.Plugins;
      if (!GoogleAuth) throw new Error('GoogleAuth plugin not available');

      const googleUser = await GoogleAuth.signIn();
      // idToken ile Firebase'e giriş yap
      const idToken = googleUser.authentication.idToken;
      const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
      await auth.signInWithCredential(credential);
    } catch (err) {
      // Kullanıcı iptal ettiyse sessizce dön
      if (err.message && (err.message.includes('canceled') || err.message.includes('cancelled') || err.message.includes('12501'))) return;
      console.error("Native Google sign-in error:", err);
      Swal.fire({ title: t('auth_error'), text: err.message || 'Google giriş hatası', icon: "error" });
    }
    return;
  }

  // Web: masaüstünde popup, mobil/PWA'da redirect daha güvenilir
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (shouldUseRedirectAuth()) {
    try {
      await auth.signInWithRedirect(provider);
    } catch (err) {
      console.error("Google redirect sign-in error:", err.code, err.message);
      Swal.fire({ title: t('auth_error'), text: err.message || 'Google giriş hatası', icon: "error" });
    }
    return;
  }

  try {
    const result = await auth.signInWithPopup(provider);
    console.log("Google popup login başarılı:", result.user?.uid);
    if (result && result.user) {
      await completeFirebaseSignIn(result.user, 'google-popup');
    }
  } catch (err) {
    console.error("Google sign-in error:", err.code, err.message);
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      // Popup dönüşü güvenilir değilse redirect'e düş
      await auth.signInWithRedirect(provider);
    } else if (err.code === 'auth/unauthorized-domain') {
      Swal.fire({ title: t('auth_error'), text: 'Bu domain Firebase\'de yetkilendirilmemiş. Firebase Console > Authentication > Settings > Authorized domains\'e "duoduels.com" ekleyin.', icon: "error" });
    } else {
      Swal.fire({ title: t('auth_error'), text: err.message, icon: "error" });
    }
  }
}

async function signInWithFacebook() {
  if (!_enabledProviders.has("facebook")) return;
  const provider = new firebase.auth.FacebookAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    console.log("Facebook popup login başarılı:", result.user?.uid);
  } catch (err) {
    console.error("Facebook sign-in error:", err.code, err.message);
    if (err.code === 'auth/popup-blocked') {
      await auth.signInWithRedirect(provider);
    } else if (err.code === 'auth/popup-closed-by-user') {
      // Kullanıcı popup'ı kapattı - sessiz kal
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      Swal.fire({
        title: t('auth_account_exists'),
        text: t('auth_account_exists_text'),
        icon: "warning"
      });
    } else {
      console.error("Facebook sign-in error:", err);
      Swal.fire({ title: t('auth_error'), text: err.message, icon: "error" });
    }
  }
}

async function signInWithApple() {
  if (!_enabledProviders.has("apple")) {
    Swal.fire({
      title: t('auth_apple_disabled'),
      text: t('auth_apple_disabled_text'),
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
      Swal.fire({ title: t('auth_error'), text: err.message, icon: "error" });
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

  // Hemen loading göster — kullanıcı bekletilmesin
  const guestBtn = document.querySelector('.auth-skip-btn');
  const navPlayBtn = document.getElementById('nav-play-btn');
  if (guestBtn) { guestBtn.disabled = true; guestBtn.style.opacity = '0.6'; }
  if (navPlayBtn) { navPlayBtn.disabled = true; navPlayBtn.style.opacity = '0.6'; }

  try {
    await auth.signInAnonymously();
  } catch (err) {
    console.error("Guest sign-in error:", err);
    if (guestBtn) { guestBtn.disabled = false; guestBtn.style.opacity = ''; }
    if (navPlayBtn) { navPlayBtn.disabled = false; navPlayBtn.style.opacity = ''; }
    Swal.fire({
      title: t('auth_error'),
      text: t('auth_guest_failed'),
      icon: "error"
    });
  }
}

let _devModeActive = false;

function _devShowScreen(name) {
  // showScreen() setupSocketListeners içinde olduğu için global değil.
  // Ekranları direkt DOM'dan geçiş yap.
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(name + '-screen') || document.getElementById(name);
  if (el) el.classList.add('active');
  // Explicitly hide animated title when leaving auth screen
  const animTitle = document.getElementById('auth-title-animated');
  if (animTitle) {
    if (name === 'auth' || name === 'auth-screen') {
      animTitle.style.removeProperty('display');
      animTitle.style.removeProperty('visibility');
    } else {
      animTitle.style.setProperty('display', 'none', 'important');
      animTitle.style.setProperty('visibility', 'hidden', 'important');
    }
  }
}

function _devSignIn() {
  _devModeActive = true;
  const uid = _getOrCreateDevUid();
  currentUser = { uid, email: null, photoURL: null, displayName: 'DevUser' };
  syncCurrentUserGlobal();
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
    if (_devModeActive) return; // Dev modda auth ekranına dönme
    const splash = document.getElementById('app-splash');
    if (splash) {
      dismissSplash(splash);
      showScreenSafe('auth');
    }
  }, 2000);
}

// --- REDIRECT RESULT HANDLER ---
// signInWithRedirect sonrasında sayfaya dönünce sonucu yakala
if (auth && auth.getRedirectResult) {
  auth.getRedirectResult().then((result) => {
    if (result && result.user) {
      console.log("Redirect login başarılı:", result.user.uid);
      return completeFirebaseSignIn(result.user, 'google-redirect');
    }
  }).catch((err) => {
    console.error("Redirect login hatası:", err);
    if (err.code === 'auth/account-exists-with-different-credential') {
      Swal.fire({
        title: t('auth_account_exists'),
        text: t('auth_account_exists_text'),
        icon: "warning"
      });
    } else if (err.code !== 'auth/popup-closed-by-user') {
      Swal.fire({ title: t('auth_error'), text: err.message, icon: "error" });
    }
  });
}

// --- AUTH STATE OBSERVER ---
auth && auth.onAuthStateChanged && auth.onAuthStateChanged(async (user) => {
  // Dev modda Firebase observer'ı yok say
  if (_devModeActive) return;

  const splash = document.getElementById('app-splash');

  if (user) {
    await completeFirebaseSignIn(user, 'auth-state');
  } else {
    // Kullanıcı yok - auth ekranı
    currentUser = null;
    syncCurrentUserGlobal();
    userProfile = null;
    authIdToken = null;
    _hydratedAuthUid = null;
    stopTokenRefresh();
    // Temayı sıfırla (önceki oturumdan kalan mavi/pembe arka plan)
    document.body.classList.remove('theme-male', 'theme-female');
    if (typeof updateSvgColors === 'function') updateSvgColors(null);
    dismissSplash(splash);
    showScreenSafe('auth');
  }
});

if (auth) {
  setTimeout(() => {
    if (auth.currentUser && (!currentUser || currentUser.uid !== auth.currentUser.uid || !userProfile)) {
      completeFirebaseSignIn(auth.currentUser, 'current-user-fallback');
    }
  }, 1500);
}

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
    document.body.style.backgroundColor = '#0B0E14';
  }, 600);
}

// --- FRIEND CODE GENERATION ---
function _generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function _getUniqueFriendCode() {
  // Local/dev mode - generate without uniqueness check
  if ((_isGuestLocal || (_isLocalDev && !authIdToken)) && !authIdToken) {
    return _generateFriendCode();
  }
  // Firestore uniqueness check (max 5 attempts)
  for (let i = 0; i < 5; i++) {
    const code = _generateFriendCode();
    const snap = await db.collection('users').where('friendCode', '==', code).limit(1).get();
    if (snap.empty) return code;
  }
  return _generateFriendCode(); // fallback
}

// --- PROFILE SAVE ---
async function saveProfile() {
  const usernameInput = document.getElementById('setup-username');
  const genderEl = document.querySelector('input[name="setup-gender"]:checked');

  const username = usernameInput.value.trim();
  if (!username) {
    Swal.fire({ title: t('warning'), text: t('warn_username_empty'), icon: "warning" });
    return;
  }
  if (username.length > 12) {
    Swal.fire({ title: t('warning'), text: t('warn_username_long'), icon: "warning" });
    return;
  }
  if (!genderEl) {
    Swal.fire({ title: t('warning'), text: t('warn_gender'), icon: "warning" });
    return;
  }

  // Devam Et butonunu disable et
  const continueBtn = document.getElementById('btn-continue-profile');
  if (continueBtn) { continueBtn.disabled = true; continueBtn.textContent = 'Kaydediliyor...'; }

  try {
    const profileData = {
      username: username,
      gender: genderEl.value,
      email: (currentUser && currentUser.email) || '',
      photoURL: (currentUser && currentUser.photoURL) || '',
    };

    // Local guest veya dev — localStorage kullan
    if ((_isGuestLocal || (_isLocalDev && !authIdToken)) && !authIdToken) {
      const friendCode = await _getUniqueFriendCode();
      userProfile = { ...profileData, friendCode };
      const storageKey = _isGuestLocal ? 'dd_guest_profile' : 'dd_dev_profile';
      localStorage.setItem(storageKey, JSON.stringify(userProfile));
      enterLobby();
      return;
    }

    userProfile = await runWithLegacyProfileFallback(
      () => saveOwnProfileToServer(profileData),
      () => saveOwnProfileToFirestore(profileData),
      'Profile save'
    );
    enterLobby();
  } catch (err) {
    console.error("Profil kaydetme hatası:", err);
    Swal.fire({ title: t('error'), text: 'Profil kaydedilemedi: ' + err.message, icon: "error" });
  } finally {
    if (continueBtn) { continueBtn.disabled = false; continueBtn.textContent = t('btn_continue') || 'Devam Et'; }
  }
}

// --- GUEST LOCAL (giriş yapmadan Pass & Play) ---
function skipToLobbyAsGuest() {
  _isGuestLocal = true;
  const uid = _getOrCreateDevUid();
  currentUser = { uid, email: null, photoURL: null, displayName: null };
  syncCurrentUserGlobal();
  authIdToken = null;

  const splash = document.getElementById('app-splash');
  dismissSplash(splash);

  // Daha önce kaydedilmiş profil var mı?
  const saved = localStorage.getItem('dd_guest_profile');
  if (saved) {
    try {
      userProfile = JSON.parse(saved);
      enterLobby();
      return;
    } catch(e) {}
  }
  if (typeof showScreen === 'function') showScreenSafe('profileSetup');
  else _devShowScreen('profile-setup');
}

// Kullanıcı Firebase ile giriş yapmış mı? (Google/Facebook/Apple — anonymous değil)
function isFullyAuthenticated() {
  if (_isGuestLocal) return false;
  if (_devModeActive) return false;
  if (!currentUser) return false;
  // Firebase anonymous users have isAnonymous === true
  if (currentUser.isAnonymous) return false;
  return !!authIdToken;
}

// Multiplayer için giriş gerektiğinde çağrılır
function requireAuthForMultiplayer(callback) {
  if (isFullyAuthenticated()) {
    callback();
    return;
  }
  Swal.fire({
    title: t('auth_required_title'),
    text: t('auth_required_text'),
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: t('auth_required_login'),
    cancelButtonText: t('cancel'),
  }).then((result) => {
    if (result.isConfirmed) {
      // Auth ekranına yönlendir, giriş sonrası lobby'ye dönecek
      _pendingMultiplayerCallback = callback;
      showScreenSafe('auth');
    }
  });
}

let _pendingMultiplayerCallback = null;

// --- ENTER LOBBY ---
function enterLobby() {
  if (!userProfile || !currentUser) return;

  waitForClientReady(() => {
    try {
      // Tema uygula
      if (typeof applyGenderTheme === 'function') {
        applyGenderTheme(userProfile.gender);
      }

      // Splash dismiss
      const splash = document.getElementById('app-splash');
      dismissSplash(splash);

      // Lobby ekranına geç (showScreen global değilse _devShowScreen kullan)
      if (typeof showScreen === 'function') {
        showScreenSafe('lobby');
      } else {
        _devShowScreen('lobby');
      }

      // Lobby'deki kullanıcı adı greeting
      const greetEl = document.getElementById('lobby-username-greeting');
      if (greetEl) greetEl.textContent = userProfile.username;

      // Avatar — Bug 17 fix: validate URL starts with https:// before assigning
      const avatarEl = document.getElementById('lobby-avatar');
      if (avatarEl) {
        const photo = userProfile.photoURL || currentUser.photoURL || '';
        if (photo && (photo.startsWith('https://') || photo.startsWith('data:image/'))) {
          avatarEl.src = photo;
          avatarEl.onerror = () => { avatarEl.src = _anonymousAvatarSvg(); };
        } else {
          avatarEl.src = _anonymousAvatarSvg();
        }
      }

      // Anonymous guest'leri lobby'de eski oda kalıntısı yüzünden sokete bağlama.
      const hasJoinParam = !!new URLSearchParams(window.location.search).get('join');
      if (currentUser && currentUser.isAnonymous && !hasJoinParam) {
        sessionStorage.removeItem('duoduels_room');
      }
      const hasSavedRoom = !!sessionStorage.getItem('duoduels_room');
      const shouldAutoConnect = !_isGuestLocal
        && (!currentUser || !currentUser.isAnonymous || hasSavedRoom || hasJoinParam);

      if (shouldAutoConnect && typeof connectSocket === 'function') {
        connectSocket();
      }

      // Auth sonrası bekleyen multiplayer callback varsa çalıştır
      if (_pendingMultiplayerCallback && isFullyAuthenticated()) {
        const cb = _pendingMultiplayerCallback;
        _pendingMultiplayerCallback = null;
        cb();
      }
    } catch (err) {
      console.error('enterLobby error:', err);
      showScreenSafe('auth');
      Swal.fire({ title: t('auth_error'), text: err.message || 'Giriş sonrası ekran yüklenemedi', icon: 'error' });
    }
  });
}

// --- SIGN OUT ---
async function signOut() {
  try {
    const wasGuestLocal = _isGuestLocal;
    const wasAnonymous = currentUser && currentUser.isAnonymous;
    const userRef = auth ? auth.currentUser : null;

    if (typeof leaveCurrentRoom === 'function') {
      try {
        await leaveCurrentRoom();
      } catch (leaveErr) {
        console.warn("Odadan ayrılma isteği tamamlanamadı:", leaveErr);
      }
    }
    if (typeof socket !== 'undefined' && socket && socket.connected) {
      socket.disconnect();
    }
    currentRoom = null;
    _isGuestLocal = false;
    sessionStorage.removeItem("duoduels_room");
    // Tüm guest profillerini temizle
    localStorage.removeItem('dd_guest_profile');
    localStorage.removeItem('dd_dev_profile');
    if (typeof resetPassPlayState === 'function') resetPassPlayState();
    // Temayı sıfırla
    document.body.classList.remove('theme-male', 'theme-female');
    if (typeof updateSvgColors === 'function') updateSvgColors(null);
    if (typeof window.updateBgTheme === 'function') window.updateBgTheme(null);

    // State'i temizle
    currentUser = null;
    syncCurrentUserGlobal();
    userProfile = null;
    authIdToken = null;
    _hydratedAuthUid = null;
    stopTokenRefresh();

    if (wasGuestLocal || !auth) {
      showScreenSafe('auth');
      return;
    }

    // Anonim kullanıcıyı tamamen sil (persistence'ın geri getirmemesi için)
    if (wasAnonymous && userRef) {
      try {
        await userRef.delete();
      } catch (delErr) {
        console.warn("Anonim kullanıcı silinemedi, signOut yapılıyor:", delErr);
        await auth.signOut();
      }
    } else {
      await auth.signOut();
    }

    // Garanti: auth ekranına geç
    showScreenSafe('auth');
  } catch (err) {
    console.error("Çıkış hatası:", err);
    // Her halükarda auth ekranına dön
    currentUser = null;
    syncCurrentUserGlobal();
    userProfile = null;
    authIdToken = null;
    _hydratedAuthUid = null;
    showScreenSafe('auth');
  }
}

// --- TOKEN REFRESH (45 dakikada bir — Bug 6 fix: 50 yerine 45 dk, token 60dk'da expire) ---
function startTokenRefresh() {
  stopTokenRefresh();
  _tokenRefreshTimer = setInterval(async () => {
    if (currentUser) {
      try {
        authIdToken = await currentUser.getIdToken(true);
        // Socket varsa token'ı güncelle
        if (typeof socket !== 'undefined' && socket && socket.connected) {
          socket.auth.token = authIdToken;
          if (currentUser && currentUser.uid) {
            socket.auth.fallbackUserId = currentUser.uid;
          }
        }
      } catch (err) {
        console.error("Token yenileme hatası:", err);
      }
    }
  }, 45 * 60 * 1000); // 45 dakika (Bug 6 fix)
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
  if (typeof showScreen === 'function') showScreenSafe('settings');
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

    // Persist to backend (or localStorage for dev)
    if (userProfile) userProfile.photoURL = dataUrl;
    if (_isLocalDev && !authIdToken) {
      const saved = JSON.parse(localStorage.getItem('dd_dev_profile') || '{}');
      saved.photoURL = dataUrl;
      localStorage.setItem('dd_dev_profile', JSON.stringify(saved));
    } else if (currentUser) {
      const savedPhotoUrl = await runWithLegacyProfileFallback(
        () => saveOwnAvatarToServer(dataUrl),
        () => saveOwnAvatarToFirestore(dataUrl),
        'Avatar save'
      );
      if (userProfile) userProfile.photoURL = savedPhotoUrl;
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

// --- INITIALIZE CAPACITOR GOOGLE AUTH PLUGIN ---
function _initGoogleAuthPlugin() {
  const platform = detectAuthPlatform();
  if (platform === 'ios' || platform === 'android') {
    try {
      const { GoogleAuth } = window.Capacitor.Plugins;
      if (GoogleAuth && typeof GoogleAuth.initialize === 'function') {
        GoogleAuth.initialize({
          clientId: '694845091148-ovbmiqcunpc5de2ng2rafue2lt6dcdhf.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true
        });
        console.log('GoogleAuth plugin initialized');
      }
    } catch (e) {
      console.warn('GoogleAuth plugin init failed:', e);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    configureAuthProviderVisibility();
    _initGoogleAuthPlugin();
  });
} else {
  configureAuthProviderVisibility();
  _initGoogleAuthPlugin();
}
