// Auth Logic - DuoDuels (Firebase'siz, sadece localStorage)
// Kullanıcı isim + cinsiyet girer, localStorage'da UUID + profil tutulur.

let currentUser = null;        // { uid }
let userProfile = null;        // { username, gender, photoURL }
let authIdToken = null;        // Eski client.js ile uyum için her zaman null
let _isGuestLocal = false;     // Eski client.js ile uyum için sabit false

window._currentUser = null;

function syncCurrentUserGlobal() {
  window._currentUser = currentUser;
}

const PROFILE_STORAGE_KEY = 'dd_profile';
const PLAYER_ID_KEY = 'dd_player_id';

function _generatePlayerId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function _getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = _generatePlayerId();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

function getMyPlayerId() {
  return currentUser ? currentUser.uid : null;
}

function _loadStoredProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.username || !parsed.gender) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function _persistProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

function showScreenSafe(name) {
  if (typeof showScreen === 'function') {
    showScreen(name);
    return true;
  }
  const aliasMap = { profileSetup: 'profile-setup' };
  const alias = aliasMap[name] || name;
  const candidates = [
    document.getElementById(name + '-screen'),
    document.getElementById(name),
    document.getElementById(alias + '-screen'),
    document.getElementById(alias),
  ].filter(Boolean);
  if (!candidates.length) return false;
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  candidates[0].classList.add('active');
  return true;
}

function waitForClientReady(callback, attempts = 40) {
  const hasTheme = typeof applyGenderTheme === 'function';
  const hasSocket = typeof connectSocket === 'function';
  if (hasTheme && hasSocket) { callback(); return; }
  if (attempts <= 0) { callback(); return; }
  setTimeout(() => waitForClientReady(callback, attempts - 1), 100);
}

function dismissSplash(splash) {
  if (!splash) return;
  splash.classList.add('splash-hide');
  setTimeout(() => {
    splash.remove();
    document.body.style.backgroundColor = '#0B0E14';
  }, 600);
}

function _anonymousAvatarSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill="#2c3e50"/>
    <circle cx="32" cy="24" r="11" fill="#7f8c8d"/>
    <ellipse cx="32" cy="54" rx="18" ry="12" fill="#7f8c8d"/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// --- PROFILE SAVE ---
let _pendingProfileCallback = null;

async function saveProfile() {
  const usernameInput = document.getElementById('setup-username');
  const genderEl = document.querySelector('input[name="setup-gender"]:checked');

  const username = (usernameInput && usernameInput.value || '').trim();
  if (!username) {
    Swal.fire({ title: t('warning'), text: t('warn_username_empty'), icon: 'warning' });
    return;
  }
  if (username.length > 12) {
    Swal.fire({ title: t('warning'), text: t('warn_username_long'), icon: 'warning' });
    return;
  }
  if (!genderEl) {
    Swal.fire({ title: t('warning'), text: t('warn_gender'), icon: 'warning' });
    return;
  }

  const uid = _getOrCreatePlayerId();
  currentUser = { uid };
  syncCurrentUserGlobal();
  userProfile = {
    username,
    gender: genderEl.value,
    photoURL: (userProfile && userProfile.photoURL) || '',
  };
  _persistProfile(userProfile);

  if (typeof applyGenderTheme === 'function') applyGenderTheme(userProfile.gender);

  if (_pendingProfileCallback) {
    const cb = _pendingProfileCallback;
    _pendingProfileCallback = null;
    try { cb(); } catch (e) { console.error(e); enterLobby(); }
  } else {
    enterLobby();
  }
}

function requireProfile(callback) {
  if (userProfile) {
    callback();
    return;
  }
  _pendingProfileCallback = callback;
  showScreenSafe('profileSetup');
}

// --- ENTER LOBBY ---
function enterLobby() {
  waitForClientReady(() => {
    try {
      if (userProfile && typeof applyGenderTheme === 'function') {
        applyGenderTheme(userProfile.gender);
      }

      const splash = document.getElementById('app-splash');
      dismissSplash(splash);

      showScreenSafe('lobby');

      // Greeting & avatar — profil yoksa gizle
      const greetEl = document.getElementById('lobby-username-greeting');
      const welcomeEl = document.getElementById('lobby-welcome-text');
      const avatarEl = document.getElementById('lobby-avatar');
      const signOutBtn = document.querySelector('.btn-signout');

      if (userProfile) {
        if (greetEl) greetEl.textContent = userProfile.username;
        if (welcomeEl) welcomeEl.style.display = '';
        if (avatarEl) {
          const photo = userProfile.photoURL || '';
          if (photo && (photo.startsWith('https://') || photo.startsWith('data:image/'))) {
            avatarEl.src = photo;
            avatarEl.onerror = () => { avatarEl.onerror = null; avatarEl.src = _anonymousAvatarSvg(); };
          } else {
            avatarEl.src = _anonymousAvatarSvg();
          }
          avatarEl.style.display = '';
        }
        if (signOutBtn) signOutBtn.style.display = '';
      } else {
        if (greetEl) greetEl.textContent = '';
        if (welcomeEl) welcomeEl.style.display = 'none';
        if (avatarEl) avatarEl.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'none';
      }

      if (typeof connectSocket === 'function') {
        connectSocket();
      }
    } catch (err) {
      console.error('enterLobby error:', err);
      showScreenSafe('profileSetup');
    }
  });
}

// --- SIGN OUT ---
async function signOut() {
  // Onay iste — yanlışlıkla profil silinmesin
  const result = await Swal.fire({
    title: 'Profili sıfırla?',
    text: 'Kullanıcı adın ve cinsiyet seçimin silinir. Devam edilsin mi?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sıfırla',
    cancelButtonText: 'Vazgeç',
  });
  if (!result.isConfirmed) return;

  try {
    if (typeof leaveCurrentRoom === 'function') {
      try { await leaveCurrentRoom(); } catch (e) {}
    }
    if (typeof socket !== 'undefined' && socket && socket.connected) {
      socket.disconnect();
    }
    currentRoom = null;
    sessionStorage.removeItem('duoduels_room');
    if (typeof resetPassPlayState === 'function') resetPassPlayState();

    document.body.classList.remove('theme-male', 'theme-female');
    if (typeof updateSvgColors === 'function') updateSvgColors(null);
    if (typeof window.updateBgTheme === 'function') window.updateBgTheme(null);

    localStorage.removeItem(PROFILE_STORAGE_KEY);
    userProfile = null;
    // currentUser kalıyor (uid sabit), sadece profil silindi
    enterLobby();
  } catch (err) {
    console.error('signOut error:', err);
    enterLobby();
  }
}

// --- SETTINGS ---
function openSettings() {
  showScreenSafe('settings');
  const photo = (userProfile && userProfile.photoURL) || '';
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
    const settingsAv = document.getElementById('settings-avatar');
    if (settingsAv) settingsAv.src = dataUrl;
    const lobbyAv = document.getElementById('lobby-avatar');
    if (lobbyAv) lobbyAv.src = dataUrl;

    if (userProfile) {
      userProfile.photoURL = dataUrl;
      _persistProfile(userProfile);
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
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- BOOTSTRAP: profil var → lobby, yok → profile-setup ---
function _bootstrap() {
  // Her zaman bir kullanıcı kimliği oluştur (oda bağlantısı için gerekli)
  const uid = _getOrCreatePlayerId();
  currentUser = { uid };
  syncCurrentUserGlobal();
  // Profil varsa yükle, yoksa null (lobby boş profille de çalışır)
  const saved = _loadStoredProfile();
  if (saved) userProfile = saved;
  enterLobby();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _bootstrap);
} else {
  _bootstrap();
}
