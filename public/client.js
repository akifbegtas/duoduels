// --- PREMIUM SWAL DEFAULTS ---
const SwalPremium = Swal.mixin({
  background: 'linear-gradient(145deg, rgba(20, 18, 50, 0.97), rgba(10, 8, 35, 0.98))',
  color: '#fff',
  backdrop: 'rgba(0,0,0,0.6)',
  showClass: { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
  hideClass: { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' },
  customClass: { popup: 'swal-premium', confirmButton: 'swal-premium-btn', timerProgressBar: 'swal-premium-timer' },
});
// Override global Swal.fire
const _origSwalFire = Swal.fire.bind(Swal);
Swal.fire = function(opts) {
  if (typeof opts === 'object' && opts !== null) {
    // Merge premium defaults, keep explicit overrides
    const merged = {
      background: 'linear-gradient(145deg, rgba(20, 18, 50, 0.97), rgba(10, 8, 35, 0.98))',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.6)',
      customClass: { popup: 'swal-premium', confirmButton: 'swal-premium-btn', timerProgressBar: 'swal-premium-timer' },
      ...opts,
    };
    return _origSwalFire(merged);
  }
  return _origSwalFire(opts);
};

// Tüm ortamlarda sunucuya bağlan
const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
const isLocalDev = !isNative && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const PRODUCTION_URL = 'https://duoduels-599689373205.europe-west1.run.app';
const SERVER_URL = isLocalDev
  ? window.location.origin
  : isNative
    ? PRODUCTION_URL
    : (window.location.hostname === 'duoduels.com' || window.location.hostname === 'www.duoduels.com' || window.location.hostname.endsWith('.run.app'))
      ? window.location.origin
      : PRODUCTION_URL;

// Lazy socket - auth sonrası connectSocket() ile bağlanır
let socket = null;
let _socketListenersAttached = false;

function connectSocket() {
  if (socket && socket.connected) return;

  // Dev veya guest local modda Firebase token olmadan fallbackUserId ile bağlan
  const useLocalFallback = (isLocalDev || (typeof _isGuestLocal !== 'undefined' && _isGuestLocal)) && !authIdToken;
  const devUid = useLocalFallback && typeof _getOrCreateDevUid === 'function'
    ? _getOrCreateDevUid()
    : null;

  if (!authIdToken && !devUid) {
    console.warn("connectSocket: authIdToken yok, bağlanılamıyor");
    return;
  }

  const authPayload = authIdToken
    ? { token: authIdToken, lang: currentLang || 'tr' }
    : { fallbackUserId: devUid, lang: currentLang || 'tr' };

  if (socket) {
    // Mevcut socket varsa auth güncelle ve yeniden bağlan
    socket.auth = authPayload;
    socket.connect();
    return;
  }

  socket = io(SERVER_URL, {
    auth: authPayload,
    autoConnect: true
  });

  setupSocketListeners();
}

// --- ROUND TRANSITION TOAST ---
function showRoundToast(roundNum) {
  // Remove existing toast if any
  const existing = document.getElementById('round-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'round-toast';
  toast.innerHTML = `<span style="font-size:1.3rem;margin-right:8px">⚡</span><span>${roundNum}. ${t('round_transition')}</span>`;
  toast.style.cssText = `
    position:fixed;bottom:-60px;left:50%;transform:translateX(-50%);z-index:99999;
    background:var(--theme-gradient,linear-gradient(135deg,#3ABFBF,#4A90D9));
    color:#fff;padding:12px 28px;border-radius:16px;
    font-family:'Poppins',sans-serif;font-weight:700;font-size:1rem;
    display:flex;align-items:center;gap:4px;
    box-shadow:0 8px 32px rgba(0,0,0,0.3),0 0 20px var(--theme-glow,rgba(58,191,191,0.35));
    border:1px solid rgba(255,255,255,0.15);
    backdrop-filter:blur(12px);
    transition:bottom 0.5s cubic-bezier(0.34,1.56,0.64,1);
    white-space:nowrap;
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { toast.style.bottom = '24px'; });
  });

  // Animate out after 2s
  setTimeout(() => {
    toast.style.bottom = '-60px';
    setTimeout(() => toast.remove(), 500);
  }, 2000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let currentRoom = null;
let isHost = false;
// myPlayerId artık Firebase Auth UID'si (auth.js'deki getMyPlayerId() fonksiyonu)
let myPlayerId = null; // connectSocket sonrası set edilir
let amIPlaying = false;
let timerInterval = null;
let pendingRoomData = null;
let letterAnimationDone = true;
let pendingCategoryData = null;
let currentTargetLetter = null;
let selectedMode = "cift";
let _listenersAttached = {};

// --- EKRANLAR (global — auth.js de kullanır) ---
const screens = {
  auth: document.getElementById("auth-screen"),
  profileSetup: document.getElementById("profile-setup-screen"),
  lobby: document.getElementById("lobby-screen"),
  settings: document.getElementById("settings-screen"),
  passplaySetup: document.getElementById("passplay-setup-screen"),
  waiting: document.getElementById("waiting-screen"),
  "matchmaking-screen": document.getElementById("matchmaking-screen"),
  game: document.getElementById("game-screen"),
  gameSelect: document.getElementById("game-select-screen"),
  gameSettings: document.getElementById("game-settings-screen"),
  isimSehir: document.getElementById("isimSehir-screen"),
  pictionary: document.getElementById("pictionary-screen"),
  tabu: document.getElementById("tabu-screen"),
  imposter: document.getElementById("imposter-screen"),
  sayiTahmin: document.getElementById("sayiTahmin-screen"),
  bilBakalim: document.getElementById("bilBakalim-screen"),
};
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
  const gameScreens = ["game", "isimSehir", "pictionary", "tabu", "imposter", "sayiTahmin", "bilBakalim"];
  if (gameScreens.includes(name)) {
    document.body.classList.add("game-active");
  } else {
    document.body.classList.remove("game-active");
  }
  // Toggle auth navbar & header visibility
  var authNav = document.getElementById('auth-navbar');
  var mainHeader = document.getElementById('main-header');
  if (authNav) authNav.style.display = (name === 'auth') ? 'flex' : 'none';
  if (mainHeader) mainHeader.style.display = (name === 'auth') ? 'none' : '';
}

// --- TEMA DEĞİŞTİRME (cinsiyet seçimine göre) ---
function applyGenderTheme(gender) {
  document.body.classList.remove("theme-male", "theme-female");
  if (gender === "male") {
    document.body.classList.add("theme-male");
  } else if (gender === "female") {
    document.body.classList.add("theme-female");
  }
  // Username input'a cinsiyet bazlı border
  const usernameInput = document.getElementById("username");
  if (usernameInput) {
    usernameInput.classList.remove("gender-border-male", "gender-border-female");
    if (gender === "male") usernameInput.classList.add("gender-border-male");
    else if (gender === "female") usernameInput.classList.add("gender-border-female");
  }
  // SVG arka plan renklerini güncelle
  updateSvgColors(gender);
  // Canvas arka plan renklerini güncelle
  if (typeof window.updateBgTheme === 'function') window.updateBgTheme(gender);
}

function updateSvgColors(gender) {
  const svg = document.getElementById("bg-svg");
  if (!svg) return;
  let c1, c2, c3;
  if (gender === "male") {
    c1 = "#4A90D9"; c2 = "#3ABFBF"; c3 = "#5CB88A";
  } else if (gender === "female") {
    c1 = "#e84393"; c2 = "#a855f7"; c3 = "#f78fb3";
  } else {
    c1 = "#95a5a6"; c2 = "#7f8c8d"; c3 = "#b2bec3";
  }
  const shapes = svg.querySelectorAll("circle, rect, polygon, path");
  shapes.forEach((s, i) => {
    const colors = [c1, c2, c3];
    s.setAttribute("stroke", colors[i % 3]);
  });
}

// Sayfa yüklendiğinde cinsiyet seçim listener'ı ekle
document.addEventListener("DOMContentLoaded", () => {
  // Başlangıçta nötr tema (gri) - body'de hiç class yok
  updateSvgColors(null);

  // Profile setup ekranındaki cinsiyet seçimi
  const genderRadios = document.querySelectorAll('input[name="setup-gender"]');
  genderRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      applyGenderTheme(e.target.value);
    });
  });
});

// --- INPUT UYARI ---
function showHint(msg, target) {
  const ih = document.getElementById("input-hint");
  const gh = document.getElementById("gender-hint");
  // Önce ikisini de gizle
  if (ih) ih.classList.add("hidden");
  if (gh) gh.classList.add("hidden");
  // Kırmızı border + hint text
  if (target === "gender") {
    if (gh) { gh.textContent = msg; gh.classList.remove("hidden"); }
    const gs = document.querySelector(".gender-selection");
    if (gs) gs.classList.add("gender-error");
  } else {
    if (ih) { ih.textContent = msg; ih.classList.remove("hidden"); }
    const inp = document.getElementById("username");
    if (inp) inp.classList.add("input-error");
  }
}
function hideHint() {
  const ih = document.getElementById("input-hint");
  const gh = document.getElementById("gender-hint");
  if (ih) ih.classList.add("hidden");
  if (gh) gh.classList.add("hidden");
  const inp = document.getElementById("username");
  if (inp) inp.classList.remove("input-error");
  const gs = document.querySelector(".gender-selection");
  if (gs) gs.classList.remove("gender-error");
}
// Eski fonksiyon isimleri uyumluluk için
function showBearBubble(msg) { showHint(msg); }
function hideBearBubble() { hideHint(); }
function showWarning(msg) { showHint(msg); }
function hideWarning() { hideHint(); }

// --- GİRİŞ ---

// Pass & Play state
let passPlayActive = false;
let passPlayP1Name = '';
let passPlayP2Name = '';
let passPlayP2Id = null;
let _ppCurrentPlayer = 'p1'; // 'p1' | 'p2'
let _ppSecretDoneP1 = false;

function goToPassPlay() {
  if (!userProfile) return;
  showScreen('passplaySetup');
}

function goToPrivateRoom() {
  if (!userProfile) return;
  pendingRoomData = { username: userProfile.username, gender: userProfile.gender };
  showScreen("gameSelect");
  selectMode("duo");
}

function selectPassPlayGame(gameType) {
  if (!userProfile) return;
  const p1Name = (document.getElementById('pp-p1-name').value || '').trim() || userProfile.username;
  const p2Name = (document.getElementById('pp-p2-name').value || '').trim() || t('pp_player2');
  if (p1Name.length > 12 || p2Name.length > 12) {
    Swal.fire({ title: t('warning'), text: t('warn_name_long'), icon: 'warning' });
    return;
  }
  const p1Gender = document.querySelector('input[name="pp-p1-gender"]:checked')?.value || userProfile.gender;
  const p2Gender = document.querySelector('input[name="pp-p2-gender"]:checked')?.value || 'female';
  const rounds = parseInt(document.getElementById('pp-round-count').value) || 5;

  passPlayP1Name = p1Name;
  passPlayP2Name = p2Name;
  passPlayActive = true;
  _ppCurrentPlayer = 'p1';
  _ppSecretDoneP1 = false;

  const data = {
    username: p1Name, gender: p1Gender,
    gameType: gameType, gameMode: 'duo',
    coupleCount: 1, roundCount: rounds, roundTime: 30,
    passPlay: true, p2Username: p2Name, p2Gender: p2Gender
  };
  passPlayP2Id = 'passplay_' + (typeof getMyPlayerId === 'function' ? getMyPlayerId() : (socket && socket.userId ? socket.userId : ''));

  function doEmit() {
    socket.emit('createRoom', data);
  }
  if (!socket || !socket.connected) {
    connectSocket();
    socket.once('connect', doEmit);
    return;
  }
  doEmit();
}

function passPlaySwitch(nextPlayerName, onUnlock) {
  document.getElementById('pp-lock-title').textContent = t('pp_give_phone').replace('{name}', nextPlayerName);
  document.getElementById('passplay-lock').style.display = 'flex';
  window._ppUnlockCallback = onUnlock;
}

function passPlayUnlock() {
  document.getElementById('passplay-lock').style.display = 'none';
  if (window._ppUnlockCallback) window._ppUnlockCallback();
}

function openQrScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    Swal.fire({ title: t('qr_scanner_failed'), text: t('qr_scanner_failed_text'), icon: 'error' });
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'qr-scanner-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
  modal.innerHTML = '<div id="qr-reader" style="width:280px;border-radius:12px;overflow:hidden"></div><button style="background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:10px 28px;font-size:1rem;cursor:pointer" onclick="closeQrScanner()">' + t('qr_cancel') + '</button>';
  document.body.appendChild(modal);

  const html5Qrcode = new Html5Qrcode('qr-reader');
  window._html5QrcodeInstance = html5Qrcode;

  html5Qrcode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    (decodedText) => {
      html5Qrcode.stop().catch(() => {});
      closeQrScanner();
      // Extract join param from URL
      try {
        const url = new URL(decodedText);
        const joinCode = url.searchParams.get('join');
        if (joinCode) {
          document.getElementById('roomCodeInput').value = joinCode.toUpperCase();
          joinRoom();
        } else {
          document.getElementById('roomCodeInput').value = decodedText.toUpperCase().trim().substring(0, 6);
          joinRoom();
        }
      } catch (e) {
        document.getElementById('roomCodeInput').value = decodedText.toUpperCase().trim().substring(0, 6);
        joinRoom();
      }
    },
    () => {}
  ).catch((err) => {
    closeQrScanner();
    Swal.fire({ title: t('qr_camera_failed'), text: err, icon: 'error' });
  });
}

function closeQrScanner() {
  if (window._html5QrcodeInstance) {
    window._html5QrcodeInstance.stop().catch(() => {});
    window._html5QrcodeInstance = null;
  }
  const modal = document.getElementById('qr-scanner-modal');
  if (modal) modal.remove();
}

function createRoom() {
  if (!userProfile) return;
  pendingRoomData = { username: userProfile.username, gender: userProfile.gender };
  showScreen("gameSelect");
  selectMode("cift");
}

var _modeIndex = { cift: 0, duo: 1, tek: 2 };

function selectMode(mode) {
  selectedMode = mode;
  document.getElementById("mode-btn-cift").classList.toggle("active", mode === "cift");
  document.getElementById("mode-btn-duo").classList.toggle("active", mode === "duo");
  document.getElementById("mode-btn-tek").classList.toggle("active", mode === "tek");

  var track = document.getElementById("modeTrack");
  var offset = (_modeIndex[mode] || 0) * (100 / 3);
  track.style.transform = "translateX(-" + offset + "%)";
}

function selectGame(type) {
  if (!pendingRoomData) return;

  if (selectedMode === "cift") {
    const ciftVal = document.getElementById("ciftCountSelect").value;
    if (!ciftVal) {
      Swal.fire({
        html: `<div style="font-size:3.5rem;margin-bottom:10px">👆</div>
               <div style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:6px">${t('pp_wait')}</div>
               <div style="font-size:0.95rem;color:rgba(255,255,255,0.7)">${t('pp_select_couples')}</div>`,
        background: 'linear-gradient(135deg, #1a1a2e, #2d3436)',
        color: '#fff',
        showConfirmButton: true,
        confirmButtonText: t('pp_got_it'),
        confirmButtonColor: '#ff6b6b',
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: 'animate__animated animate__shakeX' },
      });
      return;
    }
    pendingRoomData.coupleCount = ciftVal;
  } else if (selectedMode === "duo") {
    pendingRoomData.coupleCount = 1;
  } else {
    const tekVal = document.getElementById("tekCountSelect").value;
    if (!tekVal) {
      Swal.fire({
        html: `<div style="font-size:3.5rem;margin-bottom:10px">👆</div>
               <div style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:6px">${t('pp_wait')}</div>
               <div style="font-size:0.95rem;color:rgba(255,255,255,0.7)">${t('pp_select_players')}</div>`,
        background: 'linear-gradient(135deg, #1a1a2e, #2d3436)',
        color: '#fff',
        showConfirmButton: true,
        confirmButtonText: t('pp_got_it'),
        confirmButtonColor: '#ff6b6b',
        timer: 3000,
        timerProgressBar: true,
        showClass: { popup: 'animate__animated animate__shakeX' },
      });
      return;
    }
    pendingRoomData.maxPlayers = tekVal;
  }

  // Imposter en az 3 kişi gerektirir - 2 kişi seçiliyse sıfırla
  const tekCount2 = document.getElementById("tekCount2");
  if (tekCount2) {
    if (type === "imposter") {
      tekCount2.disabled = true;
      tekCount2.style.display = "none";
      const sel = document.getElementById("tekCountSelect");
      if (sel && sel.value === "2") {
        sel.value = "";
        Swal.fire({
          html: `<div style="font-size:3rem;margin-bottom:10px">🕵️</div>
                 <div style="font-size:1.2rem;font-weight:700;color:#fff;margin-bottom:6px">${t('pp_imp_min3')}</div>
                 <div style="font-size:0.9rem;color:rgba(255,255,255,0.7)">${t('pp_imp_min3_text')}</div>`,
          confirmButtonText: t('btn_ok'),
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }
    } else {
      tekCount2.disabled = false;
      tekCount2.style.display = "";
    }
  }

  pendingRoomData.gameType = type;
  pendingRoomData.gameMode = selectedMode;

  // Oyun adını göster
  const names = {
    telepati: t('game_telepati'),
    isimSehir: t('game_isim_sehir'),
    pictionary: t('game_pictionary'),
    tabu: t('game_tabu'),
    imposter: t('game_imposter'),
    sayiTahmin: t('game_sayi_tahmin'),
    bilBakalim: t('game_bil_bakalim'),
  };
  document.getElementById("settings-game-title").innerText =
    names[type] + t('game_settings');

  // Resim Çiz için süre sabit 45sn, gizle
  const timeInput = document.getElementById("roundTimeInput");
  const timeLabel = timeInput.parentElement;
  // Basamak ve hedef puan satırlarını varsayılan gizle
  document.getElementById("digitCountRow").style.display = "none";
  document.getElementById("targetScoreRow").style.display = "none";
  // roundCount satırını varsayılan göster
  var roundCountRow = document.getElementById("roundCountInput").closest(".half-input");
  if (roundCountRow) roundCountRow.style.display = "";

  if (type === "pictionary") {
    timeLabel.style.display = "none";
    timeInput.value = 45;
  } else if (type === "tabu") {
    timeLabel.style.display = "";
    timeInput.value = 60;
  } else if (type === "imposter") {
    timeLabel.style.display = "";
    timeInput.value = 60;
  } else if (type === "isimSehir") {
    timeLabel.style.display = "";
    timeInput.value = 20;
  } else if (type === "sayiTahmin") {
    timeLabel.style.display = "none";
    timeInput.value = 60;
    document.getElementById("digitCountRow").style.display = "";
  } else if (type === "bilBakalim") {
    // Tur sayısı yerine hedef puan, süre de var
    if (roundCountRow) roundCountRow.style.display = "none";
    timeLabel.style.display = "";
    timeInput.value = 20;
    document.getElementById("targetScoreRow").style.display = "";
  } else {
    timeLabel.style.display = "";
    timeInput.value = 10;
  }

  showScreen("gameSettings");
}

function goBackToGameSelect() {
  showScreen("gameSelect");
}

function confirmGameSettings() {
  if (!pendingRoomData) return;
  pendingRoomData.roundCount = document.getElementById("roundCountInput").value;
  pendingRoomData.roundTime = document.getElementById("roundTimeInput").value;
  pendingRoomData.digitCount = document.getElementById("digitCountInput").value;
  pendingRoomData.targetScore = document.getElementById("targetScoreInput").value;

  function doEmit() {
    if (currentRoom) {
      socket.emit("updateRoom", {
        roomId: currentRoom,
        gameType: pendingRoomData.gameType,
        gameMode: pendingRoomData.gameMode,
        roundCount: pendingRoomData.roundCount,
        roundTime: pendingRoomData.roundTime,
        digitCount: pendingRoomData.digitCount,
        targetScore: pendingRoomData.targetScore,
      });
      pendingRoomData = null;
    } else {
      socket.emit("createRoom", pendingRoomData);
      pendingRoomData = null;
    }
  }

  if (!socket || !socket.connected) {
    connectSocket();
    socket.once("connect", doEmit);
    return;
  }
  doEmit();
}

function joinRoom() {
  if (!userProfile) return;
  const code = document.getElementById("roomCodeInput").value.trim();
  if (!code) {
    Swal.fire({ title: t('warning'), text: t('warn_room_code'), icon: "warning" });
    return;
  }
  if (!socket || !socket.connected) {
    connectSocket();
    socket.once("connect", () => {
      socket.emit("joinRoom", { roomId: code.toUpperCase(), username: userProfile.username, gender: userProfile.gender });
    });
    return;
  }
  socket.emit("joinRoom", { roomId: code.toUpperCase(), username: userProfile.username, gender: userProfile.gender });
}

function goToMatchmaking() {
  if (!userProfile) return;
  if (typeof requireAuthForMultiplayer === 'function') {
    requireAuthForMultiplayer(function() {
      var selectPhase = document.getElementById("mm-select-phase");
      var waitingPhase = document.getElementById("mm-waiting-phase");
      if (selectPhase) selectPhase.style.display = "";
      if (waitingPhase) waitingPhase.style.display = "none";
      showScreen("matchmaking-screen");
    });
    return;
  }
  var selectPhase = document.getElementById("mm-select-phase");
  var waitingPhase = document.getElementById("mm-waiting-phase");
  if (selectPhase) selectPhase.style.display = "";
  if (waitingPhase) waitingPhase.style.display = "none";
  showScreen("matchmaking-screen");
}

// --- MATCHMAKING ---
let selectedMMMode = "duo";

function selectMMMode(mode) {
  selectedMMMode = mode;
  document.querySelectorAll(".mm-mode-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('.mm-mode-btn[data-mode="' + mode + '"]').classList.add("active");
}

function toggleMMGame(checkbox) {
  const chip = checkbox.closest(".mm-game-chip");
  if (checkbox.checked) {
    chip.classList.add("selected");
  } else {
    chip.classList.remove("selected");
  }
}

function findMatch() {
  if (!userProfile) return;
  const username = userProfile.username;
  const gender = userProfile.gender;
  const selectedGames = [];
  document.querySelectorAll("#mm-game-grid input[type='checkbox']:checked").forEach(cb => {
    selectedGames.push(cb.value);
  });
  if (selectedGames.length === 0) {
    Swal.fire({ title: t('mm_select_game'), icon: "warning", customClass: { popup: "swal-premium" }, background: "rgba(15,12,40,0.95)", color: "#fff" });
    return;
  }
  socket.emit("findMatch", {
    username: username,
    gender: gender,
    mode: selectedMMMode,
    selectedGames: selectedGames
  });
  // Seçim aşamasını gizle, bekleme aşamasını göster
  var selectPhase = document.getElementById("mm-select-phase");
  var waitingPhase = document.getElementById("mm-waiting-phase");
  if (selectPhase) selectPhase.style.display = "none";
  if (waitingPhase) waitingPhase.style.display = "";
}

function cancelMatchmaking() {
  if (socket) socket.emit("cancelMatchmaking");
  resetMatchmakingScreen();
  // Seçim aşamasına geri dön
  var selectPhase = document.getElementById("mm-select-phase");
  var waitingPhase = document.getElementById("mm-waiting-phase");
  if (selectPhase) selectPhase.style.display = "";
  if (waitingPhase) waitingPhase.style.display = "none";
}

function resetMatchmakingScreen() {
  var wtitle = document.querySelector(".mm-waiting-title");
  var wsub = document.getElementById("mm-waiting-text");
  var wcancelBtn = document.querySelector(".mm-cancel-btn");
  if (wtitle) wtitle.textContent = t('mm_searching');
  if (wsub) wsub.textContent = t('mm_waiting_gender');
  if (wcancelBtn) wcancelBtn.style.display = "";
}

// Matchmaking socket listeners - tüm listener'lar setupSocketListeners() içinde

function setupSocketListeners() {
  if (_socketListenersAttached) return;
  _socketListenersAttached = true;

socket.on("matchSearching", function(data) {
  const txt = document.getElementById("mm-waiting-text");
  if (txt && data.message) txt.textContent = data.message;
});

socket.on("matchFound", function(data) {
  // Eşleşme bulundu — odaya katıl
  currentRoom = data.roomId;
  sessionStorage.setItem("duoduels_room", data.roomId);
  isHost = data.isHost || false;
  window._currentGameType = data.gameType;
  // Bekleme ekranında "Eşleşme bulundu!" göster
  var wtitle = document.querySelector(".mm-waiting-title");
  var wsub = document.getElementById("mm-waiting-text");
  var wcancelBtn = document.querySelector(".mm-cancel-btn");
  if (wtitle) wtitle.textContent = t('mm_match_found');
  if (wsub) wsub.textContent = data.players.map(function(p) { return p.username; }).join(" vs ") + " — " + data.gameType;
  if (wcancelBtn) wcancelBtn.style.display = "none";
});

socket.on("matchCancelled", function() {
  showScreen("lobby");
});

socket.on("autoStartGame", function(roomId) {
  // Matchmaking sonrası otomatik oyun başlat
  socket.emit("startGame", roomId);
});

function copyRoomCode() {
  const el = document.getElementById("displayRoomCode");
  const code = el.innerText;
  navigator.clipboard.writeText(code).then(() => {
    el.classList.add("code-copied");
    el.dataset.originalText = code;
    el.innerText = t('conn_copied');
    setTimeout(() => {
      el.innerText = code;
      el.classList.remove("code-copied");
    }, 1200);
  });
}

async function shareWhatsApp() {
  const code = document.getElementById("displayRoomCode").innerText;
  const url = 'https://www.duoduels.com';
  const message = t('share_msg').replace('{code}', code).replace('{url}', url);

  // Capacitor native share varsa onu kullan
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Share } = window.Capacitor.Plugins;
      await Share.share({
        title: 'DuoDuels',
        text: message,
        dialogTitle: t('share_title')
      });
      return;
    } catch (e) {
      // fallback to WhatsApp URL
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

function goToMainMenu() {
  if (currentRoom && socket) {
    socket.emit("leaveRoom", currentRoom);
  }
  currentRoom = null;
  sessionStorage.removeItem("duoduels_room");
  pendingRoomData = null;
  showScreen("lobby");
}

function joinTeamSlot(idx, slot) {
  socket.emit("selectTeam", { roomId: currentRoom, teamIndex: idx, slot });
}

function startGame() {
  socket.emit("startGame", currentRoom);
}

// --- OYUN (TELEPATİ) ---
function sendWord(auto) {
  const inp = document.getElementById("wordInput");
  let val = inp.value;
  if (auto && !val) val = "⏰";
  if (val) {
    const payload = { roomId: currentRoom, word: val };
    if (passPlayActive && _ppCurrentPlayer === 'p2') payload.passPlayActingAs = passPlayP2Id;
    socket.emit("submitWord", payload);
    inp.value = "";
    inp.disabled = true;
    document.getElementById("sendWordBtn").disabled = true;
    document.getElementById("left-status").innerText = t('conn_sent');
    clearInterval(timerInterval);
  }
}

function startTimer(sec, timerElId) {
  const elId = timerElId || "timer-countdown";
  const el = document.getElementById(elId);
  if (timerInterval) clearInterval(timerInterval);
  let t = sec || window._roundTime || 10;
  el.innerText = t;
  el.style.color = "#27ae60";

  timerInterval = setInterval(() => {
    t--;
    el.innerText = t;
    if (t <= 3) el.style.color = "#e74c3c";
    if (t <= 0) {
      clearInterval(timerInterval);
      if (amIPlaying) {
        if (window._currentGameType === "isimSehir") {
          sendIsimSehirWord(true);
        } else if (window._currentGameType === "pictionary") {
          // Server handles timeout
        } else if (window._currentGameType === "tabu") {
          // Server handles timeout
        } else if (window._currentGameType === "imposter") {
          sendImposterWord(true);
        } else {
          sendWord(true);
        }
      }
    }
  }, 1000);
}

// --- İSİM ŞEHİR ---
let _isimSehirSubmitted = false;

function sendAllIsimSehir(auto) {
  // Çift gönderim koruması
  if (_isimSehirSubmitted) return;

  const answers = {};
  const cats = ["isim", "sehir", "hayvan"];
  const catMap = { isim: "İSİM", sehir: "ŞEHİR", hayvan: "HAYVAN" };

  cats.forEach((c) => {
    const inp = document.getElementById("isInput-" + c);
    let val = inp.value.trim();
    // Yanlış harfle başlayan cevabı sil (auto'da da temizle)
    if (val && currentTargetLetter && val.toLocaleUpperCase("tr-TR").charAt(0) !== currentTargetLetter) {
      val = "";
      inp.value = "";
    }
    if (!val) val = "⏰";
    answers[catMap[c]] = val;
    inp.disabled = true;
  });

  _isimSehirSubmitted = true;
  const payload = { roomId: currentRoom, answers: answers };
  if (passPlayActive && _ppCurrentPlayer === 'p2') payload.passPlayActingAs = passPlayP2Id;
  socket.emit("submitAllIsimSehir", payload);
  document.getElementById("isSendAllBtn").disabled = true;
  document.getElementById("is-left-status").innerText = t('conn_sent');
  clearInterval(timerInterval);
}

// Eski fonksiyon uyumluluk için
function sendIsimSehirWord(auto) {
  sendAllIsimSehir(auto);
}

function animateLetter(targetLetter, callback) {
  const el = document.getElementById("spinning-letter");
  const letters = "ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ";
  let speed = 50;
  let iteration = 0;
  const totalIterations = 25;

  function spin() {
    el.innerText = letters[Math.floor(Math.random() * letters.length)];
    el.classList.add("letter-spinning");
    iteration++;

    if (iteration < totalIterations) {
      speed += 15;
      setTimeout(spin, speed);
    } else {
      el.innerText = targetLetter;
      el.classList.remove("letter-spinning");
      el.classList.add("letter-final");
      setTimeout(() => {
        el.classList.remove("letter-final");
        if (callback) callback();
      }, 1000);
    }
  }
  spin();
}

function updateCategoryTabs(activeCategory) {
  const cats = ["isim", "sehir", "hayvan"];
  const map = { İSİM: "isim", ŞEHİR: "sehir", HAYVAN: "hayvan" };
  const key = map[activeCategory] || activeCategory;
  cats.forEach((c) => {
    const tab = document.getElementById("cat-" + c);
    tab.classList.toggle("cat-active", c === key);
  });
}

// --- CONNECTION STATUS ---
function showConnectionStatus(status) {
  let el = document.getElementById("connection-status");
  if (!el) return;
  el.className = "connection-status " + status;
  el.innerText = status === "disconnected" ? t('conn_lost') : t('conn_reconnecting');
  el.style.display = "block";
}
function hideConnectionStatus() {
  const el = document.getElementById("connection-status");
  if (el) el.style.display = "none";
}

// --- KLAVYE YÖNETİMİ (iOS / Android) ---
(function initKeyboardHandling() {
  let keyboardVisible = false;

  function onKeyboardShow(keyboardHeight) {
    keyboardVisible = true;
    document.body.classList.add("keyboard-open");
    document.documentElement.classList.add("keyboard-open");
    document.documentElement.style.setProperty("--keyboard-height", keyboardHeight + "px");
    // Klavye açıkken visible alanı zorla ayarla
    const visibleHeight = window.innerHeight;
    document.body.style.height = visibleHeight + "px";
    document.body.style.maxHeight = visibleHeight + "px";
    document.querySelector(".main-container").style.minHeight = visibleHeight + "px";
    document.querySelector(".main-container").style.maxHeight = visibleHeight + "px";
    scrollToActiveInput();
  }

  function onKeyboardHide() {
    keyboardVisible = false;
    document.body.classList.remove("keyboard-open");
    document.documentElement.classList.remove("keyboard-open");
    document.documentElement.style.removeProperty("--keyboard-height");
    // Yükseklik override'larını temizle
    document.body.style.height = "";
    document.body.style.maxHeight = "";
    document.querySelector(".main-container").style.minHeight = "";
    document.querySelector(".main-container").style.maxHeight = "";
    // iOS'ta blur sonrası viewport fix
    window.scrollTo(0, 0);
  }

  // Capacitor Keyboard plugin (native iOS/Android)
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
    const Keyboard = window.Capacitor.Plugins.Keyboard;
    Keyboard.addListener("keyboardWillShow", (info) => onKeyboardShow(info.keyboardHeight));
    Keyboard.addListener("keyboardWillHide", () => onKeyboardHide());
  }

  // visualViewport fallback (Web/PWA - Capacitor olmadığında)
  if (!isNative && window.visualViewport) {
    let initialHeight = window.visualViewport.height;

    window.visualViewport.addEventListener("resize", () => {
      const diff = initialHeight - window.visualViewport.height;
      if (diff > 100 && !keyboardVisible) {
        onKeyboardShow(diff);
      } else if (diff <= 100 && keyboardVisible) {
        onKeyboardHide();
      }
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => { initialHeight = window.visualViewport.height; }, 300);
    });
  }

  function scrollToActiveInput() {
    setTimeout(() => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }

  // Focus olduğunda input'u görünür alana kaydır
  document.addEventListener("focusin", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      // Keyboard event'inden sonra ikinci bir deneme
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }
  });

  // Blur olduğunda scroll reset
  document.addEventListener("focusout", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")) {
          window.scrollTo(0, 0);
        }
      }, 100);
    }
  });
})();

// --- SOCKET ---
socket.on("connect", () => {
  myPlayerId = getMyPlayerId();
  // Saved room varsa recover et
  const savedRoom = sessionStorage.getItem("duoduels_room");
  if (!currentRoom && savedRoom) currentRoom = savedRoom;
  if (currentRoom) {
    socket.emit("rejoinRoom", { roomId: currentRoom });
    showConnectionStatus("reconnecting");
  } else {
    hideConnectionStatus();
    // URL ?join= parametresi ile auto-join
    const joinParam = new URLSearchParams(location.search).get('join');
    if (joinParam && userProfile) {
      const code = joinParam.toUpperCase().trim().substring(0, 6);
      const codeInput = document.getElementById('roomCodeInput');
      if (codeInput) codeInput.value = code;
      setTimeout(() => joinRoom(), 300);
    }
  }
});
socket.on("disconnect", () => {
  if (currentRoom) {
    showConnectionStatus("disconnected");
  }
});
socket.on("connect_error", async (err) => {
  console.error("Socket connect_error:", err.message);
  if (err.message === 'Invalid auth token' && currentUser) {
    // Token expired - yenile ve tekrar bağlan
    try {
      authIdToken = await currentUser.getIdToken(true);
      socket.auth.token = authIdToken;
      socket.connect();
    } catch (e) {
      console.error("Token refresh failed:", e);
    }
  }
});
socket.on("rejoinSuccess", (data) => {
  hideConnectionStatus();
  currentRoom = data.roomId;
  sessionStorage.setItem("duoduels_room", data.roomId);
  // Restore game screen if game is in progress
  if (data.gameStatus === "playing" && data.gameType) {
    const screenMap = {
      telepati: "game",
      isimSehir: "isimSehir",
      pictionary: "pictionary",
      tabu: "tabu",
      imposter: "imposter",
      sayiTahmin: "sayiTahmin",
    };
    const screen = screenMap[data.gameType];
    if (screen) {
      window._currentGameType = data.gameType;
      window._roundTime = data.roundTime || 10;
      window._totalRounds = data.roundCount || 5;
      showScreen(screen);
    }
  } else if (data.gameStatus === "waiting") {
    showScreen("waiting");
    document.getElementById("displayRoomCode").innerText = data.roomId;
  }
});
socket.on("rejoinFailed", () => {
  hideConnectionStatus();
  currentRoom = null;
  sessionStorage.removeItem("duoduels_room");
  showScreen("lobby");
  Swal.fire({ title: t('conn_room_gone'), text: t('conn_room_gone_text'), icon: "warning" });
});
socket.on("gameError", (msg) => {
  Swal.fire({ title: t('error'), text: msg, icon: "error" });
});
socket.on("roomCreated", (id) => {
  currentRoom = id;
  sessionStorage.setItem("duoduels_room", id);
  showScreen("waiting");
  document.getElementById("displayRoomCode").innerText = id;

  // Oda kurulunca 1 kez interstitial reklam göster
  showInterstitialAd();

  // Generate QR code for the room join URL
  const qrCanvas = document.getElementById('room-qr-canvas');
  const qrSection = document.getElementById('room-qr-section');
  if (qrCanvas && typeof QRCode !== 'undefined') {
    const joinUrl = location.origin + '?join=' + id;
    QRCode.toCanvas(qrCanvas, joinUrl, { width: 160, margin: 1 }, (err) => {
      if (!err && qrSection) qrSection.style.display = '';
    });
  }

  // Pass & Play: auto-start game since both players are ready
  if (passPlayActive) {
    // Update passPlayP2Id with the actual socket userId
    const myId = typeof getMyPlayerId === 'function' ? getMyPlayerId() : socket.userId;
    passPlayP2Id = 'passplay_' + myId;
    // Host can start immediately
    setTimeout(() => {
      if (currentRoom) socket.emit('startGame', currentRoom);
    }, 500);
  }
});
socket.on("joinedRoom", (id) => {
  currentRoom = id;
  sessionStorage.setItem("duoduels_room", id);
  showScreen("waiting");
  document.getElementById("displayRoomCode").innerText = id;
});

socket.on("hostChanged", (data) => {
  Swal.fire({
    title: t('host_changed'),
    text: data.newHostName + " " + t('new_host'),
    icon: "info",
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
});
socket.on("playerDisconnected", (data) => {
  document.querySelectorAll(".slot.filled").forEach((el) => {
    if (el.textContent.includes(data.username)) {
      el.classList.add("player-disconnected");
    }
  });
});
socket.on("playerReconnected", (data) => {
  document.querySelectorAll(".slot.filled.player-disconnected").forEach((el) => {
    if (el.textContent.includes(data.username)) {
      el.classList.remove("player-disconnected");
    }
  });
});

socket.on("hostLeft", () => {
  clearInterval(timerInterval);
  currentRoom = null;
  sessionStorage.removeItem("duoduels_room");
  amIPlaying = false;
  document.getElementById("scoreboard-panel").style.display = "none";
  Swal.close();
  document.querySelectorAll(".match-overlay").forEach((el) => el.remove());
  Swal.fire({ title: t('conn_room_closed'), text: t('conn_room_closed_text'), icon: "warning" });
  showScreen("lobby");
});

socket.on("updateLobby", (data) => {
  const pid = getMyPlayerId();
  const isHost = pid === data.hostId;
  const hostEl = document.getElementById("host-controls");
  const memberEl = document.getElementById("member-message");

  // Mevcut oyuncu spectator listesinde mi?
  const iAmSpectator = data.spectators && data.spectators.some(s => s.id === pid);
  // Takımda veya oyuncu listesinde mi?
  const iAmPlayer = data.teams
    ? data.teams.some(t => (t.p1 && t.p1.id === pid) || (t.p2 && t.p2.id === pid))
    : (data.players || []).some(p => p.id === pid);
  // Seyirciyse amIPlaying'i sıfırla
  if (iAmSpectator && !iAmPlayer) amIPlaying = false;

  if (isHost) {
    hostEl.classList.remove("hidden");
    memberEl.classList.add("hidden");
  } else {
    hostEl.classList.add("hidden");
    if (iAmSpectator && !iAmPlayer) {
      memberEl.classList.remove("hidden");
      memberEl.innerHTML = '<span style="opacity:0.7;font-size:0.9em">👁 ' + t('spectator_msg') + '</span>';
    } else {
      memberEl.classList.remove("hidden");
      memberEl.innerHTML = memberEl.dataset.defaultText || t('waiting_host');
    }
  }

  const div = document.getElementById("teams-container");
  div.innerHTML = "";

  if (data.gameMode === "tek") {
    // Tek mod: oyuncu listesi
    const playerSlots = data.players
      .map((p) => {
        const icon = p.gender === "female" ? "👩" : "👨";
        const cls = p.gender === "female" ? "slot-female" : "slot-male";
        const hostBadge =
          p.id === data.hostId ? ' <span class="host-badge">' + t('host_label') + '</span>' : "";
        return `<div class="slot filled ${cls}">${icon} ${escapeHtml(p.username)}${hostBadge}</div>`;
      })
      .join("");
    const maxLabel = data.maxPlayers > 0 ? `${data.players.length}/${data.maxPlayers}` : `${data.players.length}`;
    div.innerHTML = `<div class="team-card" style="grid-column:1/-1;">
      <div class="team-title">${t('players_label')} (${maxLabel})</div>
      <div class="tek-players-list">${playerSlots}</div>
    </div>`;
  } else {
    // Çift mod: takım kartları
    data.teams.forEach((t, i) => {
      div.innerHTML += `<div class="team-card">
              <div class="team-title">${t.name}</div>
              <div class="slots-container">
                  ${renderSlot(t.p1, i, "p1", data.hostId)}
                  ${renderSlot(t.p2, i, "p2", data.hostId)}
              </div>
          </div>`;
    });
  }

  // Seyirciler
  const specTitle = document.querySelector(".spectators-area h3");
  if (specTitle) {
    specTitle.innerText =
      data.gameMode === "tek" ? t('spectators') : t('lobby_select_team');
  }
  const specs = data.spectators
    .map((p) => {
      const icon = p.gender === "female" ? "👩" : "👨";
      const cls = p.gender === "female" ? "spec-female" : "spec-male";
      const isMe = p.id === pid ? ' style="outline:2px solid var(--theme-color);border-radius:6px;padding:2px 4px;" title="' + t('you_label') + '"' : '';
      return `<span class="${cls}"${isMe}>${icon} ${escapeHtml(p.username)}</span>`;
    })
    .join("");
  document.getElementById("spectator-list").innerHTML = specs;
});

function renderSlot(p, i, slot, hostId) {
  if (p) {
    const genderClass = p.gender === "female" ? "slot-female" : "slot-male";
    const icon = p.gender === "female" ? "👩" : "👨";
    const hostBadge =
      p.id === hostId ? ' <span class="host-badge">' + t('host_label') + '</span>' : "";
    return `<div class="slot filled ${genderClass}">${icon} ${escapeHtml(p.username)}${hostBadge}</div>`;
  }
  return `<div class="slot empty" onclick="joinTeamSlot(${i}, '${slot}')">${t('join_slot')}</div>`;
}

// --- TELEPATİ SOCKET ---
socket.on("gameInit", (data) => {
  window._currentGameType = "telepati";
  showScreen("game");
  window._roundTime = data.roundTime || 10;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("scoreboard-title").innerText = "📊 " + t('error_count');
  document.getElementById("score-note-text").innerText = "20 " + t('error_eliminate') + " 💀";
  document.getElementById("attempts-display").innerText =
    `${t('round_label')} 1 / ${window._totalRounds}`;

  Swal.fire({ title: t('starting'), timer: 1500, showConfirmButton: false });

  if (!_listenersAttached.wordInput) {
    document.getElementById("wordInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendWord();
    });
    _listenersAttached.wordInput = true;
  }
});

socket.on("turnStarted", (data) => {
  const curR = data.currentRound || 1;
  const totR = data.totalRounds || window._totalRounds || 5;

  // Pass & Play: reset to P1 at start of each telepati turn
  if (passPlayActive) _ppCurrentPlayer = 'p1';

  document.getElementById("attempts-display").innerText =
    `${t('round_label')} ${curR} / ${totR}`;
  document.getElementById("game-log").innerHTML = "";
  startTimer(window._roundTime);

  document.getElementById("leftName").innerText = data.p1.username;
  document.getElementById("rightName").innerText = data.p2.username;

  const p1 = document.getElementById("left-panel");
  const p2 = document.getElementById("right-panel");
  p1.className = `game-panel panel-${data.p1.gender}`;
  p2.className = `game-panel panel-${data.p2.gender}`;

  const iamP1 = myPlayerId === data.p1.id;
  const iamP2 = myPlayerId === data.p2.id;

  amIPlaying = iamP1 || iamP2;
  window._iamP2 = iamP2;

  const infoBar = document.getElementById("turn-info-bar");
  const inpArea = document.getElementById("input-area-left");
  const specL = document.getElementById("spectator-view-left");
  const specR = document.getElementById("spectator-view-right");

  const leftStatus = document.getElementById("left-status");
  const rightStatus = document.getElementById("right-status");

  if (amIPlaying) {
    infoBar.innerText = t('telepati_your_turn');
    infoBar.style.backgroundColor = "#27ae60";
    inpArea.classList.remove("hidden");
    specL.classList.add("hidden");
    specR.classList.add("hidden");
    leftStatus.classList.remove("hidden");
    rightStatus.classList.remove("hidden");
    leftStatus.innerText = "...";
    rightStatus.innerText = t('writing');

    const inp = document.getElementById("wordInput");
    inp.disabled = false;
    document.getElementById("sendWordBtn").disabled = false;
    inp.value = "";
    inp.focus();

    if (iamP2) {
      document.getElementById("leftName").innerText = data.p2.username;
      document.getElementById("rightName").innerText = data.p1.username;
      p1.className = `game-panel panel-${data.p2.gender}`;
      p2.className = `game-panel panel-${data.p1.gender}`;
    }
  } else {
    infoBar.innerText = `${data.p1.username} & ${data.p2.username} ${t('playing')}`;
    infoBar.style.backgroundColor = "#34495e";
    inpArea.classList.add("hidden");
    specL.classList.remove("hidden");
    specR.classList.remove("hidden");
    leftStatus.classList.add("hidden");
    rightStatus.classList.add("hidden");
    specL.innerText = "🤔";
    specR.innerText = "🤔";
  }
});

socket.on("partnerSubmitted", () => {
  // In pass & play, "partnerSubmitted" fires when P1 submits (server notifies P2=same socket).
  // Show lock screen so P2 can write without seeing P1's word.
  if (passPlayActive && _ppCurrentPlayer === 'p1') {
    _ppCurrentPlayer = 'p2';
    const gameType = window._currentGameType;
    passPlaySwitch(passPlayP2Name, () => {
      if (gameType === 'isimSehir') {
        // Re-enable isimSehir inputs for P2
        _isimSehirSubmitted = false;
        ["isim", "sehir", "hayvan"].forEach(c => {
          const inp = document.getElementById("isInput-" + c);
          if (inp) { inp.disabled = false; inp.value = ""; }
        });
        const btn = document.getElementById("isSendAllBtn");
        if (btn) btn.disabled = false;
        document.getElementById("is-left-status").innerText = "...";
        const nameEl = document.getElementById("isLeftName");
        if (nameEl) nameEl.innerText = passPlayP2Name;
        startTimer(window._roundTime, "is-timer");
      } else {
        // Telepati — re-enable word input for P2
        const inp = document.getElementById("wordInput");
        if (inp) { inp.disabled = false; inp.value = ""; inp.focus(); }
        const btn = document.getElementById("sendWordBtn");
        if (btn) btn.disabled = false;
        document.getElementById("left-status").innerText = "...";
        document.getElementById("right-status").innerText = t('writing');
        const nameEl = document.getElementById("leftName");
        if (nameEl) nameEl.innerText = passPlayP2Name;
        startTimer(window._roundTime);
      }
    });
    return;
  }

  if (amIPlaying) {
    if (window._currentGameType === "isimSehir") {
      document.getElementById("is-right-status").innerText = t('submitted');
    } else {
      document.getElementById("right-status").innerText = t('submitted');
    }
  }
});

socket.on("revealOneMove", (data) => {
  if (!amIPlaying) {
    if (window._currentGameType === "isimSehir") {
      const el =
        data.slot === "p1"
          ? document.getElementById("is-spectator-left")
          : document.getElementById("is-spectator-right");
      el.innerText = data.word;
    } else {
      const el =
        data.slot === "p1"
          ? document.getElementById("spectator-view-left")
          : document.getElementById("spectator-view-right");
      el.innerText = data.word;
    }
  }
});

function showMatchOverlay(leftName, rightName, leftWord, rightWord, isMatch, callback, categoryLabel) {
  const overlay = document.createElement("div");
  overlay.className = "match-overlay";
  overlay.innerHTML = `
    ${categoryLabel ? `<div class="match-category-label">${escapeHtml(categoryLabel)}</div>` : ''}
    <div class="match-player-names">
      <span class="match-player-name">${escapeHtml(leftName)}</span>
      <span class="match-player-name">${escapeHtml(rightName)}</span>
    </div>
    <div class="match-words-row">
      <div class="match-word-card word-left">${escapeHtml(leftWord)}</div>
      <div class="match-vs">VS</div>
      <div class="match-word-card word-right">${escapeHtml(rightWord)}</div>
    </div>
    <div class="match-result-badge ${isMatch ? 'result-success' : 'result-fail'}">
      ${isMatch ? t('match_yes') : t('match_no')}
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.remove();
      if (callback) callback();
    }, 400);
  }, 2000);
}

socket.on("spectatorUpdate", (res) => {
  clearInterval(timerInterval);
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  div.innerHTML = `${escapeHtml(res.p1Word)} - ${escapeHtml(res.p2Word)} ${res.match ? "✅" : "❌"}`;

  document.getElementById("game-log").prepend(div);
  const lName = document.getElementById("leftName").innerText;
  const rName = document.getElementById("rightName").innerText;
  const myWord = window._iamP2 ? res.p2Word : res.p1Word;
  const partnerWord = window._iamP2 ? res.p1Word : res.p2Word;
  if (!amIPlaying) {
    document.getElementById("spectator-view-left").innerText = res.p1Word;
    document.getElementById("spectator-view-right").innerText = res.p2Word;
    showMatchOverlay(lName, rName, res.p1Word, res.p2Word, res.match, () => {
      // Restart timer for spectators on mismatch
      if (!res.match) {
        startTimer(window._roundTime);
      }
    });
  } else {
    document.getElementById("left-status").innerText = myWord;
    document.getElementById("right-status").innerText = partnerWord;
    showMatchOverlay(lName, rName, myWord, partnerWord, res.match, () => {
      if (!res.match) {
        const inp = document.getElementById("wordInput");
        inp.value = "";
        inp.disabled = false;
        document.getElementById("sendWordBtn").disabled = false;
        inp.focus();
        document.getElementById("left-status").innerText = t('retry');
        document.getElementById("right-status").innerText = t('writing');
        startTimer(window._roundTime);
      }
    });
  }
});

socket.on("updateScoreboard", (scores) => {
  const list = document.getElementById("scoreboard-list");
  list.innerHTML = "";
  scores.forEach((s) => {
    let style = s.eliminated ? "text-decoration:line-through;opacity:0.6;" : "";
    let icon = s.eliminated ? "💀" : `#${s.rank}`;
    if (s.rank === 1 && !s.eliminated) icon = "🥇";
    else if (s.rank === 2 && !s.eliminated) icon = "🥈";
    else if (s.rank === 3 && !s.eliminated) icon = "🥉";

    list.innerHTML += `<div class="score-item" style="${style}">
            <span>${icon} ${escapeHtml(s.name)}</span>
            <span style="font-weight:bold">${s.score}${window._currentGameType === "telepati" ? "/20" : t('points_suffix')}</span>
        </div>`;
  });
});

socket.on("levelFinished", () =>
  Swal.fire({
    title: t('matched'),
    icon: "success",
    timer: 1000,
    showConfirmButton: false,
  }),
);
socket.on("roundChanged", (r) =>
  Swal.fire({ title: `${r}. ${t('round_n')}`, timer: 1500, showConfirmButton: false }),
);
socket.on("gameOver", (msg) => Swal.fire({ title: t('finished'), text: msg }));

socket.on("telepatiGameOver", (data) => {
  clearInterval(timerInterval);
  const iWon = data.winnerIds && data.winnerIds.includes(myPlayerId);

  if (iWon) {
    // Kazanan takım
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } }), 500);
    Swal.fire({
      title: t('you_won'),
      html: `<div style="font-size:1.2rem;margin:10px 0">
        <strong>${escapeHtml(data.winnerP1)} & ${escapeHtml(data.winnerP2)}</strong>
      </div>
      <div style="font-size:2.5rem;margin:10px 0">🎉🥳🎊</div>
      <div style="color:#27ae60;font-weight:bold">${data.lastStanding ? t('last_standing') : t('least_errors')}</div>`,
      background: "linear-gradient(135deg, #1a1a2e, #2d3436)",
      color: "#fff",
      confirmButtonColor: "#27ae60",
      confirmButtonText: t('great_job'),
    });
  } else {
    // Kaybeden takım
    Swal.fire({
      title: t('you_lost'),
      html: `<div style="font-size:1rem;margin:10px 0">
        ${t('winner_prefix')}<strong>${escapeHtml(data.winnerTeam)}</strong>
      </div>
      <div style="font-size:1rem">${escapeHtml(data.winnerP1)} & ${escapeHtml(data.winnerP2)} ${t('winner_suffix')}</div>
      <div style="font-size:2rem;margin:10px 0">😤</div>
      <div style="color:#e67e22;font-weight:bold">${t('next_time')}</div>`,
      background: "linear-gradient(135deg, #1a1a2e, #3d2020)",
      color: "#fff",
      confirmButtonColor: "#e74c3c",
      confirmButtonText: t('btn_retry'),
    });
  }
});

socket.on("backToSelect", (data) => {
  clearInterval(timerInterval);
  Swal.close();
  document.getElementById("scoreboard-panel").style.display = "none";

  if (data.hostId && myPlayerId === data.hostId) {
    // Kurucu: oyun seçim ekranına git
    showScreen("gameSelect");

    pendingRoomData = {
      username: userProfile ? userProfile.username : "Kurucu",
      gender: userProfile ? userProfile.gender : "male",
    };

    if (data.gameMode) {
      selectMode(data.gameMode);
    }

    // Oyuncu listesini göster
    const container = document.getElementById("select-players-container");
    const box = document.getElementById("select-players-box");
    if (container && box && data.players) {
      box.innerHTML = "";
      data.players.forEach((p) => {
        const icon = p.gender === "female" ? "👩" : "👨";
        const cls = p.gender === "female" ? "spec-female" : "spec-male";
        const span = document.createElement("span");
        span.className = cls;
        span.innerText = `${icon} ${p.username}`;
        box.appendChild(span);
      });
      container.classList.remove("hidden");
    }
  } else {
    // Diğer oyuncular: lobiye git
    showScreen("waiting");
    document.getElementById("displayRoomCode").innerText = currentRoom;
  }
});

// --- İSİM ŞEHİR SOCKET ---
socket.on("isimSehirStart", (data) => {
  window._currentGameType = "isimSehir";
  showScreen("isimSehir");
  window._roundTime = data.roundTime || 10;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("scoreboard-title").innerText = "📊 " + t('scores');
  document.getElementById("score-note-text").innerText =
    t('score_wins');
  document.getElementById("is-round-display").innerText =
    `${t('round_label')} 1 / ${window._totalRounds}`;

  // Panelleri hemen renklendir
  if (data.firstPair) {
    const p1El = document.getElementById("is-left-panel");
    const p2El = document.getElementById("is-right-panel");
    document.getElementById("isLeftName").innerText =
      data.firstPair.p1.username;
    document.getElementById("isRightName").innerText =
      data.firstPair.p2.username;
    p1El.className = `game-panel panel-${data.firstPair.p1.gender}`;
    p2El.className = `game-panel panel-${data.firstPair.p2.gender}`;

    const iamP2 = myPlayerId === data.firstPair.p2.id;
    if (iamP2) {
      document.getElementById("isLeftName").innerText =
        data.firstPair.p2.username;
      document.getElementById("isRightName").innerText =
        data.firstPair.p1.username;
      p1El.className = `game-panel panel-${data.firstPair.p2.gender}`;
      p2El.className = `game-panel panel-${data.firstPair.p1.gender}`;
    }
  }

  Swal.fire({
    title: t('is_starting'),
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.isAllInputs) {
    ["isim", "sehir", "hayvan"].forEach((c) => {
      document.getElementById("isInput-" + c).addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendAllIsimSehir();
      });
    });
    _listenersAttached.isAllInputs = true;
  }
});

socket.on("letterSelected", (data) => {
  letterAnimationDone = false;
  currentTargetLetter = data.letter;
  // Don't clear pendingCategoryData here - it may have arrived before letterSelected

  animateLetter(data.letter, () => {
    letterAnimationDone = true;
    // categoryStart/allCategoriesStart zaten geldiyse timer'ı şimdi başlat
    if (pendingCategoryData) {
      startTimer(window._roundTime, "is-timer");
      pendingCategoryData = null;
    }
  });

  if (data.currentRound) {
    document.getElementById("is-round-display").innerText =
      `${t('round_label')} ${data.currentRound} / ${data.totalRounds || window._totalRounds}`;
  }
});

socket.on("categoryStart", (data) => {
  // Eski uyumluluk - yeni akışta kullanılmıyor
  pendingCategoryData = data;
  if (letterAnimationDone) startTimer(window._roundTime, "is-timer");
});

socket.on("allCategoriesStart", (data) => {
  pendingCategoryData = data;
  _isimSehirSubmitted = false; // yeni tur, tekrar gönderebilir
  // Pass & Play: reset to P1 at start of each isimSehir round
  if (passPlayActive) _ppCurrentPlayer = 'p1';

  const iamP1 = myPlayerId === data.p1.id;
  const iamP2 = myPlayerId === data.p2.id;
  amIPlaying = iamP1 || iamP2;
  window._iamP2 = iamP2;

  // Kategori tab'larını hepsini aktif yap
  document.querySelectorAll(".cat-tab").forEach((t) => t.classList.add("cat-active"));
  document.getElementById("is-game-log").innerHTML = "";

  const infoBar = document.getElementById("isimSehir-turn-info");
  const allInputs = document.getElementById("is-all-inputs");
  const specArea = document.getElementById("is-spectator-area");

  document.getElementById("isLeftName").innerText = data.p1.username;
  document.getElementById("isRightName").innerText = data.p2.username;

  const p1El = document.getElementById("is-left-panel");
  const p2El = document.getElementById("is-right-panel");
  p1El.className = `game-panel panel-${data.p1.gender}`;
  p2El.className = `game-panel panel-${data.p2.gender}`;

  if (amIPlaying) {
    infoBar.innerText = t('is_fill_all');
    infoBar.style.backgroundColor = "#27ae60";
    allInputs.classList.remove("hidden");
    specArea.classList.add("hidden");

    // Inputları sıfırla ve aç
    ["isim", "sehir", "hayvan"].forEach((c) => {
      const inp = document.getElementById("isInput-" + c);
      inp.value = "";
      inp.disabled = false;
      inp.placeholder = data.letter + "...";
      // Her inputa harf doğrulaması ekle - ilk harf her zaman kontrol edilir
      const handler = function() {
        const typed = inp.value.toLocaleUpperCase("tr-TR");
        if (typed.length > 0 && typed.charAt(0) !== currentTargetLetter) {
          inp.value = "";
          inp.classList.add("pic-guess-wrong");
          setTimeout(() => inp.classList.remove("pic-guess-wrong"), 400);
        }
      };
      // Eski handler varsa kaldır
      if (inp._letterHandler) inp.removeEventListener("input", inp._letterHandler);
      inp.addEventListener("input", handler);
      inp._letterHandler = handler;
    });
    document.getElementById("isSendAllBtn").disabled = false;
    document.getElementById("is-left-status").innerText = "...";
    document.getElementById("isInput-isim").focus();

    if (iamP2) {
      document.getElementById("isLeftName").innerText = data.p2.username;
      document.getElementById("isRightName").innerText = data.p1.username;
      p1El.className = `game-panel panel-${data.p2.gender}`;
      p2El.className = `game-panel panel-${data.p1.gender}`;
    }
  } else {
    infoBar.innerText = `${data.p1.username} & ${data.p2.username} ${t('playing')}`;
    infoBar.style.backgroundColor = "#34495e";
    allInputs.classList.add("hidden");
    specArea.classList.remove("hidden");
    document.getElementById("is-spectator-left").innerText = "🤔";
    document.getElementById("is-spectator-right").innerText = "🤔";
    document.getElementById("is-right-status").innerText = t('writing');
  }

  if (letterAnimationDone) startTimer(window._roundTime, "is-timer");
});

socket.on("isimSehirResult", (res) => {
  clearInterval(timerInterval);
  addIsimSehirLogItem(res);
});

socket.on("isimSehirAllResults", (data) => {
  console.log("[IS] isimSehirAllResults received:", data);
  clearInterval(timerInterval);
  const results = data.results;
  const p1 = data.p1;
  const p2 = data.p2;

  // Her sonucu sırayla log'a ekle ve overlay göster
  function showNext(index) {
    if (index >= results.length) return;
    const res = results[index];
    addIsimSehirLogItem(res);

    const leftName = amIPlaying && window._iamP2 ? p2.username : p1.username;
    const rightName = amIPlaying && window._iamP2 ? p1.username : p2.username;
    const leftWord = amIPlaying && window._iamP2 ? res.p2Word : res.p1Word;
    const rightWord = amIPlaying && window._iamP2 ? res.p1Word : res.p2Word;

    showMatchOverlay(
      leftName,
      rightName,
      leftWord,
      rightWord,
      res.match,
      () => { showNext(index + 1); },
      res.category
    );
  }
  showNext(0);
});

function addIsimSehirLogItem(res) {
  const div = document.createElement("div");
  div.className = res.match ? "log-item log-success" : "log-item log-fail";
  let resultText = `${escapeHtml(res.category)}: ${escapeHtml(res.p1Word)} - ${escapeHtml(res.p2Word)} ${res.match ? "✅ +1" : "❌ 0"}`;
  if (res.example) {
    resultText += ` (${t('example_prefix')}${res.example})`;
  }
  div.innerHTML = resultText;
  document.getElementById("is-game-log").prepend(div);
}

socket.on("isimSehirGameOver", (msg) => {
  Swal.fire({ title: t('finished'), text: msg });
});

// --- PICTIONARY ---
let picIsDrawer = false;
let picDrawing = false;
let picLastEmit = 0;
let picColor = "#000000";
let picCtx = null;
let picLastX = 0,
  picLastY = 0;
let picLastEmitX = 0,
  picLastEmitY = 0;
let picCurrentTool = "pen";
let picShapeStartX = 0,
  picShapeStartY = 0;
let picSnapshotData = null; // canvas snapshot for shape preview

let _pictionaryCanvasInitialized = false;
function initPictionaryCanvas() {
  const canvas = document.getElementById("pic-canvas");
  if (!canvas) return;
  picCtx = canvas.getContext("2d");
  picCtx.lineCap = "round";
  picCtx.lineJoin = "round";

  // Only add event listeners once
  if (_pictionaryCanvasInitialized) return;
  _pictionaryCanvasInitialized = true;

  // Color picker
  document.querySelectorAll(".pic-color").forEach((el) => {
    el.addEventListener("click", () => {
      document
        .querySelectorAll(".pic-color")
        .forEach((c) => c.classList.remove("active"));
      el.classList.add("active");
      picColor = el.dataset.color;
      if (picCurrentTool === "eraser") {
        selectTool("pen");
      }
    });
  });

  // Tool picker
  document.querySelectorAll(".pic-tool-icon[data-tool]").forEach((el) => {
    if (el.dataset.tool === "clear") return;
    el.addEventListener("click", () => {
      selectTool(el.dataset.tool);
    });
  });

  // Drawing events
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    if (!picIsDrawer) return;
    e.preventDefault();
    picDrawing = true;
    const pos = getPos(e);
    picLastX = pos.x;
    picLastY = pos.y;
    picLastEmitX = pos.x;
    picLastEmitY = pos.y;

    if (
      picCurrentTool === "square" ||
      picCurrentTool === "rectangle" ||
      picCurrentTool === "triangle" ||
      picCurrentTool === "circle"
    ) {
      picShapeStartX = pos.x;
      picShapeStartY = pos.y;
      picSnapshotData = picCtx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const moveDraw = (e) => {
    if (!picIsDrawer || !picDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const color = picCurrentTool === "eraser" ? "#ffffff" : picColor;
    const thickness = parseInt(document.getElementById("pic-thickness").value);

    if (picCurrentTool === "pen" || picCurrentTool === "eraser") {
      drawLine(picLastX, picLastY, pos.x, pos.y, color, thickness);

      const now = Date.now();
      if (now - picLastEmit > 30) {
        socket.emit("drawData", {
          roomId: currentRoom,
          x1: picLastEmitX,
          y1: picLastEmitY,
          x2: pos.x,
          y2: pos.y,
          color,
          thickness,
        });
        picLastEmitX = pos.x;
        picLastEmitY = pos.y;
        picLastEmit = now;
      }

      picLastX = pos.x;
      picLastY = pos.y;
    } else {
      // Shape preview
      if (picSnapshotData) {
        picCtx.putImageData(picSnapshotData, 0, 0);
      }
      drawShapePreview(
        picShapeStartX,
        picShapeStartY,
        pos.x,
        pos.y,
        color,
        thickness,
      );
    }
  };

  const endDraw = (e) => {
    if (!picIsDrawer || !picDrawing) {
      picDrawing = false;
      return;
    }

    if (
      picCurrentTool === "square" ||
      picCurrentTool === "rectangle" ||
      picCurrentTool === "triangle" ||
      picCurrentTool === "circle"
    ) {
      const pos = e.changedTouches
        ? { x: 0, y: 0 }
        : e.type === "mouseleave"
          ? { x: picLastX, y: picLastY }
          : null;
      let endX, endY;
      if (e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        endX = (e.changedTouches[0].clientX - rect.left) * scaleX;
        endY = (e.changedTouches[0].clientY - rect.top) * scaleY;
      } else {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        endX = (e.clientX - rect.left) * scaleX;
        endY = (e.clientY - rect.top) * scaleY;
      }

      const color = picColor;
      const thickness = parseInt(
        document.getElementById("pic-thickness").value,
      );

      if (picSnapshotData) {
        picCtx.putImageData(picSnapshotData, 0, 0);
      }
      drawShape(
        picCurrentTool,
        picShapeStartX,
        picShapeStartY,
        endX,
        endY,
        color,
        thickness,
      );
      socket.emit("drawData", {
        roomId: currentRoom,
        type: "shape",
        shape: picCurrentTool,
        x1: picShapeStartX,
        y1: picShapeStartY,
        x2: endX,
        y2: endY,
        color,
        thickness,
      });
      picSnapshotData = null;
    }

    picDrawing = false;
  };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", moveDraw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", moveDraw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function selectTool(tool) {
  picCurrentTool = tool;
  document.querySelectorAll(".pic-tool-icon[data-tool]").forEach((el) => {
    if (el.dataset.tool === "clear") return;
    el.classList.toggle("active", el.dataset.tool === tool);
  });
}

function drawLine(x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.beginPath();
  picCtx.moveTo(x1, y1);
  picCtx.lineTo(x2, y2);
  picCtx.stroke();
}

function drawShapePreview(x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.setLineDash([6, 4]);
  drawShapePath(picCurrentTool, x1, y1, x2, y2);
  picCtx.setLineDash([]);
}

function drawShape(shape, x1, y1, x2, y2, color, thickness) {
  picCtx.strokeStyle = color;
  picCtx.lineWidth = thickness;
  picCtx.setLineDash([]);
  drawShapePath(shape, x1, y1, x2, y2);
}

function drawShapePath(shape, x1, y1, x2, y2) {
  picCtx.beginPath();
  if (shape === "square") {
    const size = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const sx = x2 > x1 ? x1 : x1 - size;
    const sy = y2 > y1 ? y1 : y1 - size;
    picCtx.rect(sx, sy, size, size);
  } else if (shape === "rectangle") {
    const w = x2 - x1;
    const h = y2 - y1;
    picCtx.rect(x1, y1, w, h);
  } else if (shape === "triangle") {
    const midX = (x1 + x2) / 2;
    picCtx.moveTo(midX, y1);
    picCtx.lineTo(x2, y2);
    picCtx.lineTo(x1, y2);
    picCtx.closePath();
  } else if (shape === "circle") {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    picCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
  picCtx.stroke();
}

function clearCanvas() {
  if (!picIsDrawer) return;
  const canvas = document.getElementById("pic-canvas");
  picCtx.clearRect(0, 0, canvas.width, canvas.height);
  picCtx.fillStyle = "#ffffff";
  picCtx.fillRect(0, 0, canvas.width, canvas.height);
  socket.emit("drawData", { roomId: currentRoom, clear: true });
}

function sendPictionaryGuess() {
  const inp = document.getElementById("pic-guess-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("pictionaryGuess", { roomId: currentRoom, guess: val });
  inp.value = "";
}

// Pictionary socket events
socket.on("pictionaryStart", (data) => {
  window._currentGameType = "pictionary";
  showScreen("pictionary");
  window._roundTime = 45;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("scoreboard-title").innerText = "📊 " + t('scores');
  document.getElementById("score-note-text").innerText =
    t('pic_first_guess');
  document.getElementById("pic-round-display").innerText =
    `${t('round_label')} 1 / ${window._totalRounds}`;

  initPictionaryCanvas();

  Swal.fire({
    title: t('pic_starting'),
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.picGuessInput) {
    document
      .getElementById("pic-guess-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendPictionaryGuess();
      });
    _listenersAttached.picGuessInput = true;
  }
});

socket.on("pictionaryRound", (data) => {
  document.getElementById("pic-round-display").innerText =
    `${t('round_label')} ${data.round} / ${data.totalRounds}`;
  document.getElementById("pic-game-log").innerHTML = "";

  const canvas = document.getElementById("pic-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const amDrawer = myPlayerId === data.drawerId;
  picIsDrawer = amDrawer;

  const infoBar = document.getElementById("pic-turn-info");
  const wordDisplay = document.getElementById("pic-word-display");
  const leftTools = document.getElementById("pic-left-tools");
  const colorBar = document.getElementById("pic-color-bar");
  const guessArea = document.getElementById("pic-guess-area");

  // Reset tool
  selectTool("pen");

  if (data.gameMode === "tek") {
    // TEK MOD
    const amGuesser = !amDrawer && data.guesserId === myPlayerId;
    amIPlaying = amDrawer || amGuesser;

    if (amDrawer) {
      infoBar.innerText = t('pic_draw_everyone');
      infoBar.style.backgroundColor = "#e67e22";
      wordDisplay.classList.remove("hidden");
      wordDisplay.innerText = `${t('pic_word')} ${data.word}`;
      leftTools.classList.remove("hidden");
      colorBar.classList.remove("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "crosshair";
    } else if (amGuesser) {
      infoBar.innerText = `${t('pic_guess')} ${data.drawerName} ${t('pic_drawing')}`;
      infoBar.style.backgroundColor = "#27ae60";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.remove("hidden");
      canvas.style.cursor = "default";
      const inp = document.getElementById("pic-guess-input");
      inp.disabled = false;
      document.getElementById("pic-guess-btn").disabled = false;
      inp.value = "";
      inp.focus();
    } else {
      infoBar.innerText = `${data.drawerName} ${t('pic_drawing')}`;
      infoBar.style.backgroundColor = "#34495e";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "default";
    }
  } else {
    // ÇİFT MOD
    const amGuesser = myPlayerId === data.guesserId;
    amIPlaying = amDrawer || amGuesser;

    if (amDrawer) {
      infoBar.innerText = `${t('pic_draw')} ${data.drawerName} ${t('pic_you_drawing')}`;
      infoBar.style.backgroundColor = "#e67e22";
      wordDisplay.classList.remove("hidden");
      wordDisplay.innerText = `${t('pic_word')} ${data.word}`;
      leftTools.classList.remove("hidden");
      colorBar.classList.remove("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "crosshair";
    } else if (amGuesser) {
      infoBar.innerText = `${t('pic_guess')} ${data.drawerName} ${t('pic_drawing')}`;
      infoBar.style.backgroundColor = "#27ae60";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.remove("hidden");
      canvas.style.cursor = "default";
      const inp = document.getElementById("pic-guess-input");
      inp.disabled = false;
      document.getElementById("pic-guess-btn").disabled = false;
      inp.value = "";
      inp.focus();
    } else {
      infoBar.innerText = `${data.drawerName} ${t('pic_drawing')}, ${data.guesserName} ${t('pic_guessing')}`;
      infoBar.style.backgroundColor = "#34495e";
      wordDisplay.classList.add("hidden");
      leftTools.classList.add("hidden");
      colorBar.classList.add("hidden");
      guessArea.classList.add("hidden");
      canvas.style.cursor = "default";
    }
  }

  startTimer(45, "pic-timer");
});

socket.on("drawData", (data) => {
  if (data.clear) {
    const canvas = document.getElementById("pic-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  // Ensure picCtx is initialized for spectators
  if (!picCtx) {
    const canvas = document.getElementById("pic-canvas");
    if (!canvas) return;
    picCtx = canvas.getContext("2d");
    picCtx.lineCap = "round";
    picCtx.lineJoin = "round";
  }
  if (data.type === "shape") {
    drawShape(
      data.shape,
      data.x1,
      data.y1,
      data.x2,
      data.y2,
      data.color,
      data.thickness,
    );
  } else {
    drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.thickness);
  }
});

socket.on("pictionaryWrongGuess", (data) => {
  // data: { guess }
  if (amIPlaying && !picIsDrawer) {
    const inp = document.getElementById("pic-guess-input");
    inp.classList.add("pic-guess-wrong");
    setTimeout(() => inp.classList.remove("pic-guess-wrong"), 400);
  }
  const div = document.createElement("div");
  div.className = "log-item log-fail";
  div.innerHTML = `${escapeHtml(data.guesserName)}: "${escapeHtml(data.guess)}" ❌`;
  document.getElementById("pic-game-log").prepend(div);
});

socket.on("pictionaryCorrect", (data) => {
  const div = document.createElement("div");
  div.className = "log-item log-success";
  div.innerHTML = `${escapeHtml(data.teamName)} ${t('pic_correct')} +${data.points}${t('points_suffix')} (${data.order}. ${t('pic_order')})`;
  document.getElementById("pic-game-log").prepend(div);

  if (data.gameMode === "tek") {
    // Tek modda sadece doğru bilen kişinin inputu kapansın
    if (data.guesserId === myPlayerId) {
      document.getElementById("pic-guess-input").disabled = true;
      document.getElementById("pic-guess-btn").disabled = true;
      Swal.fire({
        title: t('pic_correct_title'),
        text: `+${data.points}${t('points_suffix')}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
    // Timer durmasın, tur devam ediyor
  } else {
    clearInterval(timerInterval);
    if (amIPlaying) {
      const guessArea = document.getElementById("pic-guess-area");
      guessArea.classList.add("hidden");
      Swal.fire({
        title: t('pic_correct_title'),
        text: `+${data.points}${t('points_suffix')}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }
});

socket.on("pictionaryRoundEnd", (data) => {
  // data: { word, scores }
  clearInterval(timerInterval);
  const wordDisplay = document.getElementById("pic-word-display");
  wordDisplay.classList.remove("hidden");
  wordDisplay.innerText = `${t('pic_answer')} ${data.word}`;
  document.getElementById("pic-left-tools").classList.add("hidden");
  document.getElementById("pic-color-bar").classList.add("hidden");
  document.getElementById("pic-guess-area").classList.add("hidden");
  picIsDrawer = false;
});

socket.on("pictionaryGameOver", (msg) => {
  Swal.fire({ title: t('finished'), text: msg });
});

// --- TABU ---
let tabuRole = null; // "describer", "guesser", "spectator"

function sendTabuClue() {
  const inp = document.getElementById("tabu-clue-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("tabuClue", { roomId: currentRoom, clue: val });
  inp.value = "";
}

function sendTabuGuess() {
  const inp = document.getElementById("tabu-guess-input");
  const val = inp.value.trim();
  if (!val) return;
  socket.emit("tabuGuess", { roomId: currentRoom, guess: val });
  inp.value = "";
}

function sendTabuPass() {
  socket.emit("tabuPass", { roomId: currentRoom });
}

socket.on("tabuStart", (data) => {
  window._currentGameType = "tabu";
  showScreen("tabu");
  window._roundTime = data.roundTime || 60;
  window._totalRounds = data.roundCount || 5;

  document.getElementById("scoreboard-panel").style.display = "block";
  document.getElementById("scoreboard-title").innerText = "📊 " + t('scores');
  document.getElementById("score-note-text").innerText =
    t('tabu_most_words');
  document.getElementById("tabu-round-display").innerText =
    `${t('round_label')} 1 / ${window._totalRounds}`;

  Swal.fire({ title: t('tabu_starting'), timer: 1500, showConfirmButton: false });

  if (!_listenersAttached.tabuClueInput) {
    document
      .getElementById("tabu-clue-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendTabuClue();
      });
    document
      .getElementById("tabu-guess-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendTabuGuess();
      });
    _listenersAttached.tabuClueInput = true;
  }
});

socket.on("tabuTurn", (data) => {
  document.getElementById("tabu-round-display").innerText =
    `${t('round_label')} ${data.currentRound} / ${data.totalRounds}`;
  document.getElementById("tabu-chat").innerHTML = "";
  document.getElementById("tabu-game-log").innerHTML = "";

  const infoBar = document.getElementById("tabu-turn-info");
  const cardEl = document.getElementById("tabu-card");
  const clueArea = document.getElementById("tabu-clue-area");
  const guessArea = document.getElementById("tabu-guess-area");
  const alertEl = document.getElementById("tabu-forbidden-alert");
  alertEl.classList.add("hidden");

  const amDescriber = myPlayerId === data.describer.id;
  const amGuesser = myPlayerId === data.guesser.id;
  amIPlaying = amDescriber || amGuesser;

  if (amDescriber) {
    tabuRole = "describer";
    infoBar.innerText = `${t('pic_describe')} ${data.guesser.username} ${t('pic_will_guess')}`;
    infoBar.style.backgroundColor = "#e67e22";
    cardEl.classList.remove("hidden");
    clueArea.classList.remove("hidden");
    guessArea.classList.add("hidden");
    const inp = document.getElementById("tabu-clue-input");
    inp.disabled = false;
    document.getElementById("tabu-clue-btn").disabled = false;
    inp.value = "";
    inp.focus();
  } else if (amGuesser) {
    tabuRole = "guesser";
    infoBar.innerText = `${t('pic_guess')} ${data.describer.username} ${t('tabu_describing')}`;
    infoBar.style.backgroundColor = "#27ae60";
    cardEl.classList.add("hidden");
    clueArea.classList.add("hidden");
    guessArea.classList.remove("hidden");
    const inp = document.getElementById("tabu-guess-input");
    inp.disabled = false;
    document.getElementById("tabu-guess-btn").disabled = false;
    inp.value = "";
    inp.focus();
  } else {
    tabuRole = "spectator";
    infoBar.innerText = `${data.describer.username} ${t('tabu_describing')}, ${data.guesser.username} ${t('pic_guessing')}`;
    infoBar.style.backgroundColor = "#34495e";
    cardEl.classList.remove("hidden");
    clueArea.classList.add("hidden");
    guessArea.classList.add("hidden");
  }

  startTimer(data.roundTime, "tabu-timer");
});

socket.on("tabuNewWord", (data) => {
  // Only describer sees this
  document.getElementById("tabu-main-word").innerText = data.word;
  document.getElementById("tabu-f1").innerText = data.forbidden[0];
  document.getElementById("tabu-f2").innerText = data.forbidden[1];
  document.getElementById("tabu-f3").innerText = data.forbidden[2];
  document.getElementById("tabu-f4").innerText = data.forbidden[3];
  document.getElementById("tabu-f5").innerText = data.forbidden[4];
});

socket.on("tabuNewRound", () => {
  // Clear chat for new word
  document.getElementById("tabu-chat").innerHTML = "";
});

socket.on("tabuClue", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item clue";
  div.innerText = `💡 ${data.describerName}: ${data.clue}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuGuessMsg", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item guess";
  div.innerText = `🤔 ${data.guesserName}: ${data.guess}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuCorrect", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item guess correct";
  div.innerText = `✅ ${t('tabu_correct')} "${data.word}" - ${data.teamName} (${data.score}${t('points_suffix')})`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  const logDiv = document.createElement("div");
  logDiv.className = "log-item log-success";
  logDiv.innerHTML = `${escapeHtml(data.teamName)}: "${escapeHtml(data.word)}" ✅ +1`;
  document.getElementById("tabu-game-log").prepend(logDiv);

  if (amIPlaying) {
    Swal.fire({
      title: t('tabu_correct_title'),
      icon: "success",
      timer: 800,
      showConfirmButton: false,
    });
  }
});

socket.on("tabuForbidden", (data) => {
  const alertEl = document.getElementById("tabu-forbidden-alert");
  alertEl.innerText = `${t('tabu_forbidden')} 🚫 "${data.forbiddenWord}"`;
  alertEl.classList.remove("hidden");
  setTimeout(() => alertEl.classList.add("hidden"), 2500);

  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `🚫 ${data.describerName} ${t('tabu_forbidden_used')} "${data.forbiddenWord}" - ${t('tabu_word_skipped')}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuPassed", (data) => {
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `⏭ ${t('tabu_pass')} - "${data.word}" ${t('tabu_skipped')}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

socket.on("tabuTurnEnd", (data) => {
  clearInterval(timerInterval);
  const chat = document.getElementById("tabu-chat");
  const div = document.createElement("div");
  div.className = "tabu-clue-item system";
  div.innerText = `⏰ ${t('tabu_time_up')} ${data.teamName}: ${data.score}${t('points_suffix')}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  document.getElementById("tabu-card").classList.add("hidden");
  document.getElementById("tabu-clue-area").classList.add("hidden");
  document.getElementById("tabu-guess-area").classList.add("hidden");
  // Disable inputs to prevent sending after turn ends
  document.getElementById("tabu-clue-input").disabled = true;
  document.getElementById("tabu-clue-btn").disabled = true;
  document.getElementById("tabu-guess-input").disabled = true;
  document.getElementById("tabu-guess-btn").disabled = true;
});

socket.on("tabuGameOver", (msg) => {
  Swal.fire({ title: t('finished'), text: msg });
});

// --- İMPOSTOR ---
let imposterIsMe = false;

function sendImposterWord(auto) {
  const inp = document.getElementById("imposterWordInput");
  let val = inp.value;
  if (auto && !val) val = "⏰";
  if (val) {
    socket.emit("submitImposterWord", { roomId: currentRoom, word: val });
    inp.value = "";
    inp.disabled = true;
    document.getElementById("imposterSendBtn").disabled = true;
    clearInterval(timerInterval);
  }
}

function sendImposterVote(playerId) {
  socket.emit("submitImposterVote", {
    roomId: currentRoom,
    votedPlayerId: playerId,
  });
  document.querySelectorAll(".imposter-vote-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.pid === playerId) {
      btn.classList.add("voted");
    }
  });
}

socket.on("imposterStart", (data) => {
  window._currentGameType = "imposter";
  showScreen("imposter");
  window._roundTime = data.roundTime || 60;
  window._totalRounds = data.roundCount || 5;
  document.getElementById("scoreboard-panel").style.display = "none";
  document.getElementById("imposter-round-display").innerText =
    `Tur: 1 / ${window._totalRounds}`;

  Swal.fire({
    title: t('imp_starting'),
    timer: 1500,
    showConfirmButton: false,
  });

  if (!_listenersAttached.imposterWordInput) {
    document
      .getElementById("imposterWordInput")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendImposterWord();
      });
    _listenersAttached.imposterWordInput = true;
  }
});

socket.on("imposterRound", (data) => {
  amIPlaying = !data.isSpectator;
  imposterIsMe = data.isImposter;
  document.getElementById("imposter-round-display").innerText =
    `Tur: ${data.currentRound} / ${data.totalRounds}`;
  document.getElementById("imposter-game-log").innerHTML = "";
  document.getElementById("imposter-answers").classList.add("hidden");
  document.getElementById("imposter-answers").innerHTML = "";
  document.getElementById("imposter-vote-area").classList.add("hidden");

  const inp = document.getElementById("imposterWordInput");
  inp.disabled = false;
  inp.value = "";
  document.getElementById("imposterSendBtn").disabled = false;
  document.getElementById("imposter-input-area").classList.remove("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-submitted-list").innerHTML = "";

  const phaseLabel = document.getElementById("imposter-phase-label");
  phaseLabel.classList.remove("hidden");
  phaseLabel.innerText = t('imp_write_round1');

  const hintEl = document.getElementById("imposter-hint");

  if (data.isSpectator) {
    document.getElementById("imposter-turn-info").innerText =
      t('imp_watching');
    document.getElementById("imposter-turn-info").style.backgroundColor = "#34495e";
    document.getElementById("imposter-title").innerText = t('imp_word');
    document.getElementById("imposter-main-word").innerText = data.word || "???";
    document.getElementById("imposter-hint").classList.add("hidden");
    document.getElementById("imposter-input-area").classList.add("hidden");
    document.getElementById("imposter-screen").style.background = "";
    startTimer(data.roundTime, "imposter-timer");
    return;
  }

  if (data.isImposter) {
    document.getElementById("imposter-turn-info").innerText =
      t('imp_you_impostor');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#e74c3c";
    document.getElementById("imposter-screen").style.background =
      "linear-gradient(135deg, #e74c3c22, #c0392b22)";
    document.getElementById("imposter-title").innerText = "🕵️ " + t('imp_impostor');
    document.getElementById("imposter-main-word").innerText = "???";
    hintEl.classList.remove("hidden");
    hintEl.innerText = `${t('imp_hint')} ${data.hint}`;
  } else {
    document.getElementById("imposter-turn-info").innerText =
      t('imp_write_clue');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#27ae60";
    document.getElementById("imposter-screen").style.background = "";
    document.getElementById("imposter-title").innerText = t('imp_word');
    document.getElementById("imposter-main-word").innerText = data.word;
    hintEl.classList.add("hidden");
  }

  inp.focus();
  startTimer(data.roundTime, "imposter-timer");
});

socket.on("imposterPlayerSubmitted", (data) => {
  const list = document.getElementById("imposter-submitted-list");
  list.classList.remove("hidden");
  const span = document.createElement("div");
  span.className = "imposter-submitted-item";
  span.innerText = `✅ ${data.username} ${t('imp_submitted')}`;
  list.appendChild(span);
});

socket.on("imposterPhaseResults", (data) => {
  clearInterval(timerInterval);
  document.getElementById("imposter-input-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-timer").innerText = "";

  const answersEl = document.getElementById("imposter-answers");
  answersEl.classList.remove("hidden");

  if (data.phase === "write1") {
    answersEl.innerHTML = "<h4>" + t('imp_round1') + "</h4>";
    data.results.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });

    document.getElementById("imposter-turn-info").innerText =
      t('imp_answers_revealed') + " " + t('imp_round2_prep');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#8e44ad";
  } else if (data.phase === "write2") {
    answersEl.innerHTML = "<h4>" + t('imp_round1') + "</h4>";
    data.results1.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });
    const h2 = document.createElement("h4");
    h2.innerText = t('imp_round2');
    h2.style.marginTop = "12px";
    answersEl.appendChild(h2);
    data.results2.forEach((r) => {
      const div = document.createElement("div");
      div.className = "imposter-answer-item";
      div.innerText = `${r.username}: "${r.word}"`;
      answersEl.appendChild(div);
    });

    document.getElementById("imposter-turn-info").innerText =
      t('imp_answers_revealed') + " " + t('imp_vote_prep');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#8e44ad";
  }
});

socket.on("imposterPhase2Start", (data) => {
  const phaseLabel = document.getElementById("imposter-phase-label");
  phaseLabel.innerText = t('imp_write_round2');

  const inp = document.getElementById("imposterWordInput");
  inp.disabled = false;
  inp.value = "";
  document.getElementById("imposterSendBtn").disabled = false;
  document.getElementById("imposter-input-area").classList.remove("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-submitted-list").innerHTML = "";

  if (imposterIsMe) {
    document.getElementById("imposter-turn-info").innerText =
      t('imp_round2_impostor');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#e74c3c";
  } else {
    document.getElementById("imposter-turn-info").innerText =
      t('imp_round2_normal');
    document.getElementById("imposter-turn-info").style.backgroundColor =
      "#27ae60";
  }

  inp.focus();
  startTimer(data.roundTime, "imposter-timer");
});

socket.on("imposterVoteStart", (data) => {
  document.getElementById("imposter-input-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-phase-label").innerText = t('imp_vote_phase');
  document.getElementById("imposter-timer").innerText = "";

  document.getElementById("imposter-turn-info").innerText =
    t('imp_vote_prompt');
  document.getElementById("imposter-turn-info").style.backgroundColor =
    "#e67e22";

  const voteArea = document.getElementById("imposter-vote-area");
  const voteList = document.getElementById("imposter-vote-list");
  voteArea.classList.remove("hidden");
  voteList.innerHTML = "";

  data.players.forEach((p) => {
    if (p.playerId === myPlayerId) return;
    const btn = document.createElement("button");
    btn.className = "imposter-vote-btn";
    btn.dataset.pid = p.playerId;
    btn.innerText = p.username;
    btn.onclick = () => sendImposterVote(p.playerId);
    voteList.appendChild(btn);
  });
});

socket.on("imposterPlayerVoted", (data) => {
  const list = document.getElementById("imposter-submitted-list");
  list.classList.remove("hidden");
  const span = document.createElement("div");
  span.className = "imposter-submitted-item";
  span.innerText = `🗳️ ${data.username} ${t('imp_voted')}`;
  list.appendChild(span);
});

socket.on("imposterVoteResult", (data) => {
  document.getElementById("imposter-vote-area").classList.add("hidden");
  document.getElementById("imposter-submitted-list").classList.add("hidden");
  document.getElementById("imposter-phase-label").classList.add("hidden");

  const infoBar = document.getElementById("imposter-turn-info");
  if (data.imposterCaught) {
    infoBar.innerText = `${t('imp_caught')} 🎉 ${data.imposterName} ${t('imp_was')}`;
    infoBar.style.backgroundColor = "#27ae60";
  } else {
    infoBar.innerText = `${t('imp_won')} 🕵️ ${data.imposterName} ${t('imp_was')}`;
    infoBar.style.backgroundColor = "#e74c3c";
  }

  document.getElementById("imposter-title").innerText = t('imp_result');
  document.getElementById("imposter-main-word").innerText = data.secretWord;
  document.getElementById("imposter-hint").classList.add("hidden");
  document.getElementById("imposter-screen").style.background = "";

  const log = document.getElementById("imposter-game-log");
  log.innerHTML = "";

  data.voteDetails.forEach((v) => {
    const div = document.createElement("div");
    const badge = v.isImposter ? " 🕵️" : "";
    const voteBadge = v.votes > 0 ? ` (${v.votes} ${t('imp_votes')})` : "";
    div.className = v.isImposter ? "log-item log-fail" : "log-item log-success";
    div.innerHTML = `${escapeHtml(v.username)}${badge} → ${escapeHtml(v.votedFor)}${voteBadge}`;
    log.appendChild(div);
  });

  if (data.imposterCaught) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
});

socket.on("imposterGameOver", (data) => {
  if (typeof data === 'string') {
    Swal.fire({ title: t('finished'), text: data });
    return;
  }
  let scoresHtml = '';
  if (data.scores) {
    scoresHtml = data.scores.map(s =>
      `<div style="display:flex;justify-content:space-between;padding:6px 12px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:8px">
        <span>${escapeHtml(s.username)}</span>
        <span style="font-weight:bold">${s.score} ${t('points_suffix').trim()}</span>
      </div>`
    ).join('');
  }
  Swal.fire({
    title: t('game_over'),
    html: `<div style="padding:10px 0">
      <div style="font-size:1.1rem;margin-bottom:12px">${escapeHtml(data.message)}</div>
      ${scoresHtml}
    </div>`,
  });
});

// --- SAYI TAHMİN ---
let _stSecretSubmitted = false;
let _stDigitCount = 4;

function sendSecretNumber() {
  if (_stSecretSubmitted) return;
  const dc = _stDigitCount;
  const inp = document.getElementById("st-secret-input");
  const val = inp.value.trim();
  if (!val || val.length !== dc) {
    document.getElementById("st-secret-status").innerText = `${dc} ${t('st_enter_digit')}`;
    return;
  }
  const regex = new RegExp(`^\\d{${dc}}$`);
  if (!regex.test(val)) {
    document.getElementById("st-secret-status").innerText = t('st_only_digits');
    return;
  }
  if (new Set(val.split("")).size === 1) {
    document.getElementById("st-secret-status").innerText = t('st_same_digits');
    return;
  }
  _stSecretSubmitted = true;
  const secretPayload = { roomId: currentRoom, number: val };
  if (passPlayActive && _ppCurrentPlayer === 'p2') secretPayload.passPlayActingAs = passPlayP2Id;
  socket.emit("submitSecretNumber", secretPayload);
  inp.disabled = true;
  document.getElementById("st-secret-btn").disabled = true;
  document.getElementById("st-secret-status").innerHTML = '<div class="st-waiting-spinner"><span class="hourglass">⏳</span> ' + t('st_waiting') + '</div>';
}

function sendNumberGuess() {
  const dc = _stDigitCount;
  const inp = document.getElementById("st-guess-input");
  const val = inp.value.trim();
  if (!val || val.length !== dc) return;
  const regex = new RegExp(`^\\d{${dc}}$`);
  if (!regex.test(val)) return;
  if (new Set(val.split("")).size === 1) return;
  const guessPayload = { roomId: currentRoom, guess: val };
  if (passPlayActive && _ppCurrentPlayer === 'p2') guessPayload.passPlayActingAs = passPlayP2Id;
  socket.emit("submitNumberGuess", guessPayload);
  // Tahmin gönderildi, input'u kapat - rakip bekleniyor
  inp.value = "";
  inp.disabled = true;
  document.getElementById("st-guess-btn").disabled = true;
}

socket.on("sayiTahminError", (msg) => {
  Swal.fire({
    title: t('error'),
    text: msg,
    icon: "error",
    timer: 2000,
    showConfirmButton: false,
  });
});

socket.on("sayiTahminStart", (data) => {
  window._currentGameType = "sayiTahmin";
  _stDigitCount = data.digitCount || 4;
  showScreen("sayiTahmin");
  window._totalRounds = data.roundCount || 5;
  document.getElementById("scoreboard-panel").style.display = "none";
  document.getElementById("st-round-display").innerText = `Tur: 1 / ${window._totalRounds}`;
  document.getElementById("st-game-log").innerHTML = "";

  Swal.fire({ title: `${t('st_title')} (${_stDigitCount} ${t('st_digits')})`, timer: 1500, showConfirmButton: false });

  if (!_listenersAttached.stSecretInput) {
    document.getElementById("st-secret-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendSecretNumber();
    });
    document.getElementById("st-guess-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendNumberGuess();
    });
    _listenersAttached.stSecretInput = true;
  }
});

socket.on("sayiTahminSecretPhase", (data) => {
  _stSecretSubmitted = false;
  const dc = data.digitCount || _stDigitCount;
  _stDigitCount = dc;
  let iamP1 = myPlayerId === data.p1.id;
  let iamP2 = myPlayerId === data.p2.id;
  // Pass & Play: both players on same device
  if (passPlayActive && iamP1) {
    iamP2 = false; // start with P1
    _ppCurrentPlayer = 'p1';
    _ppSecretDoneP1 = false;
  }
  amIPlaying = iamP1 || iamP2;

  // Tur geçiş bildirimi (ilk tur hariç)
  if (data.currentRound > 1) {
    showRoundToast(data.currentRound);
  }

  document.getElementById("st-round-display").innerText = `Tur: ${data.currentRound} / ${data.totalRounds}`;

  const infoBar = document.getElementById("st-turn-info");
  const secretArea = document.getElementById("st-secret-area");
  const guessArea = document.getElementById("st-guess-area");
  const historyArea = document.getElementById("st-history");
  const waitArea = document.getElementById("st-wait-area");
  const phaseLabel = document.getElementById("st-phase-label");

  guessArea.classList.add("hidden");
  historyArea.classList.add("hidden");
  waitArea.classList.add("hidden");
  document.getElementById("st-history-left").innerHTML = "";
  document.getElementById("st-history-right").innerHTML = "";
  document.getElementById("st-game-log").innerHTML = "";

  // Secret area başlığını güncelle
  const secretTitle = secretArea.querySelector("h3");
  if (secretTitle) secretTitle.innerText = `${dc} ${t('st_enter_secret')}`;
  const secretDesc = secretArea.querySelector("p");
  if (secretDesc) secretDesc.innerText = `0-9 ${t('st_pick_digits')} ${dc} ${t('st_pick_number')}`;

  if (amIPlaying) {
    const myData = iamP1 ? data.p1 : data.p2;
    // Cinsiyet bilgisini sakla (guess phase'de kullanılacak)
    window._stMyGender = myData.gender;

    infoBar.innerText = t('st_enter_secret_btn');
    infoBar.style.background = "var(--theme-gradient)";
    secretArea.classList.remove("hidden");
    phaseLabel.classList.remove("hidden");
    phaseLabel.innerText = `${data.p1.username} vs ${data.p2.username}`;

    const inp = document.getElementById("st-secret-input");
    inp.value = "";
    inp.disabled = false;
    inp.maxLength = dc;
    inp.placeholder = `Örn: ${"0123456789".slice(0, dc)}`;
    // Cinsiyet bazlı input border
    inp.classList.remove("gender-border-male", "gender-border-female");
    inp.classList.add(myData.gender === "female" ? "gender-border-female" : "gender-border-male");
    document.getElementById("st-secret-btn").disabled = false;
    document.getElementById("st-secret-status").innerHTML = "";
    inp.focus();
  } else {
    infoBar.innerText = `${data.p1.username} & ${data.p2.username} ${t('st_selecting')}`;
    infoBar.style.background = "var(--theme-gradient)";
    secretArea.classList.add("hidden");
    phaseLabel.classList.remove("hidden");
    phaseLabel.innerText = `${data.teamName}`;
    waitArea.classList.remove("hidden");
    document.querySelector("#st-wait-area .st-wait-text").innerText = t('st_players_selecting');
  }
});

socket.on("secretSubmitted", () => {
  if (amIPlaying) {
    if (passPlayActive && _ppCurrentPlayer === 'p1') {
      // P1 submitted — show lock screen for P2
      _ppCurrentPlayer = 'p2';
      _stSecretSubmitted = false;
      passPlaySwitch(passPlayP2Name, () => {
        // Show secret input for P2
        const dc = _stDigitCount;
        const secretArea = document.getElementById("st-secret-area");
        const infoBar = document.getElementById("st-turn-info");
        infoBar.innerText = t('st_enter_secret_btn');
        secretArea.classList.remove("hidden");
        const inp = document.getElementById("st-secret-input");
        inp.value = "";
        inp.disabled = false;
        inp.maxLength = dc;
        inp.placeholder = `Örn: ${"0123456789".slice(0, dc)}`;
        document.getElementById("st-secret-btn").disabled = false;
        document.getElementById("st-secret-status").innerHTML = "";
        inp.focus();
      });
      return;
    }
    document.getElementById("st-secret-status").innerHTML = '<div class="st-waiting-spinner"><span class="hourglass">⏳</span> ' + t('st_waiting') + '</div>';
  }
});

socket.on("partnerSecretSubmitted", () => {
  if (amIPlaying) {
    if (!_stSecretSubmitted) {
      document.getElementById("st-secret-status").innerHTML = '<div class="st-waiting-spinner"><span class="hourglass">⏳</span> ' + t('st_partner_ready') + '</div>';
    }
  }
});

socket.on("sayiTahminGuessStart", (data) => {
  let iamP1 = myPlayerId === data.p1.id;
  let iamP2 = myPlayerId === data.p2.id;
  // Pass & Play: start with P1's guess
  if (passPlayActive && iamP1) {
    iamP2 = false;
    _ppCurrentPlayer = 'p1';
  }
  amIPlaying = iamP1 || iamP2;

  const infoBar = document.getElementById("st-turn-info");
  const secretArea = document.getElementById("st-secret-area");
  const guessArea = document.getElementById("st-guess-area");
  const historyArea = document.getElementById("st-history");
  const waitArea = document.getElementById("st-wait-area");

  secretArea.classList.add("hidden");
  historyArea.classList.remove("hidden");
  waitArea.classList.add("hidden");

  // Sütun başlıklarını ayarla (sol=ben, sağ=rakip) + cinsiyet teması
  const leftCol = document.getElementById("st-history-left").parentElement;
  const rightCol = document.getElementById("st-history-right").parentElement;
  // Eski cinsiyet class'larını temizle
  leftCol.classList.remove("gender-male", "gender-female");
  rightCol.classList.remove("gender-male", "gender-female");

  if (amIPlaying) {
    const myData = iamP1 ? data.p1 : data.p2;
    const opData = iamP1 ? data.p2 : data.p1;
    document.getElementById("st-history-left-title").innerText = myData.username + " " + t('st_me');
    document.getElementById("st-history-right-title").innerText = opData.username;
    window._stMyId = myPlayerId;

    // Cinsiyet teması
    leftCol.classList.add(myData.gender === "female" ? "gender-female" : "gender-male");
    rightCol.classList.add(opData.gender === "female" ? "gender-female" : "gender-male");

    // İkisi de aynı anda tahmin girer
    infoBar.innerText = `${opData.username} ${t('st_guess_number')}`;
    infoBar.style.background = "var(--theme-gradient)";
    guessArea.classList.remove("hidden");

    const dc = data.digitCount || _stDigitCount;
    document.getElementById("st-target-label").innerText = `${opData.username} ${t('st_guess_digit')}`;
    const inp = document.getElementById("st-guess-input");
    inp.value = "";
    inp.disabled = false;
    inp.maxLength = dc;
    inp.placeholder = `${dc} haneli tahmin...`;
    // Cinsiyet bazlı input border
    inp.classList.remove("gender-border-male", "gender-border-female");
    inp.classList.add(myData.gender === "female" ? "gender-border-female" : "gender-border-male");
    document.getElementById("st-guess-btn").disabled = false;
    inp.focus();
  } else {
    // Seyirci
    document.getElementById("st-history-left-title").innerText = data.p1.username;
    document.getElementById("st-history-right-title").innerText = data.p2.username;
    window._stMyId = null;

    // Seyirci de cinsiyet temasını görsün
    leftCol.classList.add(data.p1.gender === "female" ? "gender-female" : "gender-male");
    rightCol.classList.add(data.p2.gender === "female" ? "gender-female" : "gender-male");

    infoBar.innerText = `${data.p1.username} vs ${data.p2.username} - ${t('st_guessing')}`;
    infoBar.style.background = "var(--theme-gradient)";
    guessArea.classList.add("hidden");
    waitArea.classList.remove("hidden");
    document.querySelector("#st-wait-area .st-wait-text").innerText = t('st_players_guessing');
  }
});

// Tahmin gönderildi, rakip bekleniyor
socket.on("sayiTahminGuessWaiting", () => {
  if (!amIPlaying) return;

  // Pass & Play: after P1 guesses, show lock screen for P2
  if (passPlayActive && _ppCurrentPlayer === 'p1') {
    _ppCurrentPlayer = 'p2';
    passPlaySwitch(passPlayP2Name, () => {
      // Show guess input for P2
      const dc = _stDigitCount;
      const guessArea = document.getElementById("st-guess-area");
      const infoBar = document.getElementById("st-turn-info");
      infoBar.innerText = t('st_guess_p1');
      guessArea.classList.remove("hidden");
      const inp = document.getElementById("st-guess-input");
      inp.value = "";
      inp.disabled = false;
      inp.maxLength = dc;
      inp.placeholder = `${dc} haneli tahmin...`;
      document.getElementById("st-guess-btn").disabled = false;
      inp.focus();
    });
    return;
  }

  const infoBar = document.getElementById("st-turn-info");
  infoBar.innerHTML = '<span class="hourglass" style="font-size:1.1rem">⏳</span> ' + t('st_waiting');
  infoBar.style.background = "var(--theme-gradient-hover)";
});

// Partner tahminini gönderdi bilgisi
socket.on("sayiTahminPartnerGuessed", () => {
  if (!amIPlaying) return;
  const inp = document.getElementById("st-guess-input");
  // Eğer henüz tahmin göndermediyse (input aktifse) bilgilendir
  if (!inp.disabled) {
    const infoBar = document.getElementById("st-turn-info");
    infoBar.innerText = "⚡ " + t('st_opponent_sent');
    infoBar.style.background = "var(--theme-gradient-hover)";
  }
});

// İkisi de tahmin gönderdi - sonuçlar birlikte açılıyor
socket.on("sayiTahminBothResults", (data) => {
  const dc = data.p1Result.digitCount || _stDigitCount;

  // P1 sonucu
  _addGuessToHistory(data.p1Result, dc);
  // P2 sonucu
  _addGuessToHistory(data.p2Result, dc);
});

function _addGuessToHistory(result, dc) {
  const div = document.createElement("div");
  div.className = "st-history-item";

  const digits = result.guess.split("");
  const results = result.digitResults || [];

  let digitBoxes = "";
  for (let i = 0; i < digits.length; i++) {
    const isGreen = results[i] === true;
    digitBoxes += `<span class="st-digit-box ${isGreen ? 'st-digit-green' : 'st-digit-gray'}">${escapeHtml(digits[i])}</span>`;
  }

  div.innerHTML = `
    <span class="st-history-digits">${digitBoxes}</span>
    <span class="st-history-count">#${result.guessCount}</span>
  `;

  // Doğru sütuna ekle
  let targetList;
  if (window._stMyId) {
    const isMyGuess = result.guesserId === window._stMyId;
    targetList = isMyGuess
      ? document.getElementById("st-history-left")
      : document.getElementById("st-history-right");
  } else {
    targetList = result.who === "p1"
      ? document.getElementById("st-history-left")
      : document.getElementById("st-history-right");
  }
  targetList.prepend(div);
}

// Yeni round: input tekrar açılıyor
socket.on("sayiTahminNextRoundReady", () => {
  if (!amIPlaying) return;

  // Pass & Play: reset to P1 first
  if (passPlayActive) {
    _ppCurrentPlayer = 'p1';
    passPlaySwitch(passPlayP1Name, () => {
      const inp = document.getElementById("st-guess-input");
      inp.disabled = false;
      inp.value = "";
      inp.focus();
      document.getElementById("st-guess-btn").disabled = false;
      const infoBar = document.getElementById("st-turn-info");
      infoBar.innerText = t('st_new_guess');
      infoBar.style.background = "var(--theme-gradient)";
    });
    return;
  }

  const inp = document.getElementById("st-guess-input");
  inp.disabled = false;
  inp.value = "";
  inp.focus();
  document.getElementById("st-guess-btn").disabled = false;

  const infoBar = document.getElementById("st-turn-info");
  infoBar.innerText = t('st_new_guess');
  infoBar.style.background = "var(--theme-gradient)";
});

socket.on("sayiTahminTie", (data) => {
  clearInterval(timerInterval);

  Swal.fire({
    title: `${data.currentRound}. ${t('st_round_tie')}`,
    html: `<div style="padding:15px 0 10px">
      <div style="font-size:3rem;margin-bottom:10px">🤝</div>
      <div style="font-size:0.95rem;color:rgba(255,255,255,0.7);margin-bottom:14px">${t('st_both_guessed').replace('{count}', data.guessCount)}</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(243,156,18,0.15);border:1px solid rgba(243,156,18,0.3);border-radius:12px;flex:1;min-width:100px">
          <span style="font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">${escapeHtml(data.p1Name)}</span>
          <div style="font-size:1.5rem;font-weight:900;letter-spacing:6px;color:#f39c12;margin-top:4px;font-family:monospace">${data.p1Secret}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(243,156,18,0.15);border:1px solid rgba(243,156,18,0.3);border-radius:12px;flex:1;min-width:100px">
          <span style="font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">${escapeHtml(data.p2Name)}</span>
          <div style="font-size:1.5rem;font-weight:900;letter-spacing:6px;color:#f39c12;margin-top:4px;font-family:monospace">${data.p2Secret}</div>
        </div>
      </div>
    </div>`,
    background: "linear-gradient(145deg, rgba(243,156,18,0.12), rgba(20,18,50,0.97))",
    color: "#fff",
    confirmButtonColor: "#f39c12",
    confirmButtonText: t('btn_continue_game'),
    timer: 3500,
    timerProgressBar: true,
    showClass: { popup: 'swal2-show animate__animated animate__zoomIn' },
  });
});

socket.on("sayiTahminWin", (data) => {
  clearInterval(timerInterval);
  const iWon = data.winnerId === myPlayerId;

  if (iWon) {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  }

  Swal.fire({
    title: iWon ? t('st_you_won') : `${data.winnerName} ${t('st_player_won')}`,
    html: `<div style="position:relative;padding:20px 0 10px">
      <div style="font-size:3.5rem;margin-bottom:12px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))">${iWon ? '🏆' : '😤'}</div>
      <div style="display:inline-block;background:${iWon ? 'linear-gradient(135deg,#27ae60,#2ecc71)' : 'linear-gradient(135deg,#e74c3c,#c0392b)'};padding:8px 20px;border-radius:30px;margin-bottom:14px">
        <span style="font-size:1.1rem;font-weight:800;color:#fff;letter-spacing:0.5px">${escapeHtml(data.winnerName)}</span>
        <span style="font-size:0.95rem;color:rgba(255,255,255,0.85);margin-left:6px">${data.guessCount} ${t('st_in_guesses')}</span>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:10px;flex-wrap:wrap">
        <div style="padding:10px 16px;background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.3);border-radius:12px;flex:1;min-width:120px">
          <span style="font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">${escapeHtml(data.winnerName)}</span>
          <div style="font-size:1.6rem;font-weight:900;letter-spacing:6px;color:#2ecc71;margin-top:4px;font-family:monospace">${data.winnerSecret}</div>
        </div>
        <div style="padding:10px 16px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);border-radius:12px;flex:1;min-width:120px">
          <span style="font-size:0.7rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">${escapeHtml(data.loserName)}</span>
          <div style="font-size:1.6rem;font-weight:900;letter-spacing:6px;color:#e74c3c;margin-top:4px;font-family:monospace">${data.targetSecret}</div>
        </div>
      </div>
    </div>`,
    background: iWon
      ? "linear-gradient(145deg, rgba(39,174,96,0.15), rgba(20,18,50,0.97))"
      : "linear-gradient(145deg, rgba(231,76,60,0.12), rgba(20,18,50,0.97))",
    color: "#fff",
    confirmButtonColor: iWon ? "#27ae60" : "#e74c3c",
    confirmButtonText: iWon ? t('st_great') : t('btn_ok'),
    timer: 5000,
    timerProgressBar: true,
    showClass: { popup: 'swal2-show animate__animated animate__zoomIn' },
  });
});

socket.on("sayiTahminGameOver", (data) => {
  // Eski format uyumluluğu (string mesaj)
  if (typeof data === 'string') {
    Swal.fire({ title: t('finished'), text: data });
    return;
  }

  let scoresHtml = '';
  if (data.scores && data.scores.length > 0) {
    data.scores.forEach(pair => {
      const p1Won = pair.p1.wins > pair.p2.wins;
      const p2Won = pair.p2.wins > pair.p1.wins;
      const tie = pair.p1.wins === pair.p2.wins;

      scoresHtml += `
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0;padding:14px;background:rgba(255,255,255,0.05);border-radius:14px;border:1px solid rgba(255,255,255,0.08)">
          <div style="flex:1;text-align:center">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${escapeHtml(pair.p1.name)}</div>
            <div style="font-size:2.2rem;font-weight:900;color:${p1Won ? '#2ecc71' : tie ? '#f39c12' : '#e74c3c'}">${pair.p1.wins}</div>
          </div>
          <div style="font-size:1.2rem;font-weight:800;color:rgba(255,255,255,0.3)">-</div>
          <div style="flex:1;text-align:center">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${escapeHtml(pair.p2.name)}</div>
            <div style="font-size:2.2rem;font-weight:900;color:${p2Won ? '#2ecc71' : tie ? '#f39c12' : '#e74c3c'}">${pair.p2.wins}</div>
          </div>
        </div>`;
    });
  }

  Swal.fire({
    title: t('game_over'),
    html: `<div style="padding:10px 0">
      <div style="font-size:0.85rem;color:rgba(255,255,255,0.5);margin-bottom:8px">${data.roundCount} ${t('st_rounds_done')}</div>
      ${scoresHtml}
    </div>`,
    background: "linear-gradient(145deg, rgba(20, 18, 50, 0.97), rgba(10, 8, 35, 0.98))",
    color: "#fff",
    confirmButtonText: t('btn_ok'),
    showClass: { popup: 'swal2-show animate__animated animate__zoomIn' },
  });
});

  // Expose onclick-callable functions to global scope
  window.goToMainMenu     = goToMainMenu;
  window.startGame        = startGame;
  window.joinTeamSlot     = joinTeamSlot;
  window.copyRoomCode     = copyRoomCode;
  window.shareWhatsApp    = shareWhatsApp;
  window.sendWord         = sendWord;
  window.sendAllIsimSehir = sendAllIsimSehir;
  window.sendIsimSehirWord= sendIsimSehirWord;
  window.sendPictionaryGuess = sendPictionaryGuess;
  window.sendTabuClue     = sendTabuClue;
  window.sendTabuGuess    = sendTabuGuess;
  window.sendTabuPass     = sendTabuPass;
  window.sendImposterWord = sendImposterWord;
  window.sendImposterVote = sendImposterVote;
  window.sendSecretNumber = sendSecretNumber;
  window.sendNumberGuess  = sendNumberGuess;
  window.clearCanvas      = clearCanvas;
  window.passPlayUnlock   = passPlayUnlock;
  window.sendBilBakalimAnswer = sendBilBakalimAnswer;

  // ============ BİL BAKALIM SOCKET EVENTS ============

  var _bbMyPairId = null;
  var _bbMyGender = null;
  var _bbPairs = [];
  var _bbAnswered = false;
  var _bbTimerInterval = null;

  socket.on("bilBakalimStart", function(data) {
    window._currentGameType = "bilBakalim";
    _bbPairs = data.pairs || [];
    _bbMyPairId = null;
    _bbMyGender = null;

    // Kendi pair'ini ve cinsiyetini bul
    const myId = typeof getMyPlayerId === 'function' ? getMyPlayerId() : null;
    _bbPairs.forEach(function(pair) {
      if (pair.p1.id === myId) { _bbMyPairId = pair.id; _bbMyGender = pair.p1.gender; }
      if (pair.p2.id === myId) { _bbMyPairId = pair.id; _bbMyGender = pair.p2.gender; }
    });

    var targetEl = document.getElementById("bb-target-label");
    if (targetEl) targetEl.textContent = t('bb_target_score') + " " + data.targetScore;

    showScreen("bilBakalim");
    _bbUpdateScores({}, data.targetScore);

    // Soru ekranını temizle
    var questionArea = document.getElementById("bb-question-area");
    if (questionArea) questionArea.style.opacity = "0.4";
    var questionText = document.getElementById("bb-question-text");
    if (questionText) questionText.textContent = "...";
  });

  socket.on("bilBakalimQuestion", function(data) {
    _bbAnswered = false;
    if (_bbTimerInterval) clearInterval(_bbTimerInterval);

    // Soru alanını göster
    var questionArea = document.getElementById("bb-question-area");
    if (questionArea) questionArea.style.opacity = "1";

    var questionNo = document.getElementById("bb-question-no");
    if (questionNo) questionNo.textContent = t('bb_question_no') + " " + data.questionNo;

    var questionText = document.getElementById("bb-question-text");
    if (questionText) questionText.textContent = data.question;

    var unitEl = document.getElementById("bb-unit");
    if (unitEl) unitEl.textContent = data.unit || "";

    // Cinsiyet etiketi
    var genderLabel = document.getElementById("bb-gender-label");
    if (genderLabel) genderLabel.textContent = _bbMyGender === "female" ? t('bb_women_group') : t('bb_men_group');

    // Cevap inputunu sıfırla
    var input = document.getElementById("bb-answer-input");
    if (input) { input.value = ""; input.disabled = false; }
    var sendBtn = document.getElementById("bb-send-btn");
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = t('bb_send'); }
    var statusEl = document.getElementById("bb-answered-status");
    if (statusEl) statusEl.textContent = "";

    // Sonuç alanını gizle
    var resultArea = document.getElementById("bb-result-area");
    if (resultArea) resultArea.classList.add("hidden");
    var answerArea = document.getElementById("bb-answer-area");
    if (answerArea) answerArea.classList.remove("hidden");

    // Puanları güncelle
    _bbUpdateScores(data.scores, null);

    // Timer
    var remaining = data.roundTime || 20;
    var timerLabel = document.getElementById("bb-timer-label");
    var timerBar = document.getElementById("bb-timer-bar");
    var totalTime = remaining;

    if (timerLabel) timerLabel.textContent = remaining;
    if (timerBar) timerBar.style.width = "100%";

    _bbTimerInterval = setInterval(function() {
      remaining--;
      if (timerLabel) timerLabel.textContent = remaining;
      if (timerBar) timerBar.style.width = Math.max(0, (remaining / totalTime) * 100) + "%";
      if (remaining <= 0) { clearInterval(_bbTimerInterval); _bbTimerInterval = null; }
    }, 1000);
  });

  socket.on("bilBakalimAnswerReceived", function(data) {
    var statusEl = document.getElementById("bb-answered-status");
    if (!statusEl) return;
    // Sadece başka oyuncular cevap verdi bilgisini göster
    var myId = typeof getMyPlayerId === 'function' ? getMyPlayerId() : null;
    if (data.playerId !== myId) {
      statusEl.textContent = t('bb_opponent_answered');
    }
  });

  socket.on("bilBakalimResult", function(data) {
    if (_bbTimerInterval) { clearInterval(_bbTimerInterval); _bbTimerInterval = null; }

    // Cevap alanını gizle, sonuç alanını göster
    var answerArea = document.getElementById("bb-answer-area");
    if (answerArea) answerArea.classList.add("hidden");
    var resultArea = document.getElementById("bb-result-area");
    if (resultArea) resultArea.classList.remove("hidden");

    // Doğru cevap
    var correctEl = document.getElementById("bb-correct-answer");
    if (correctEl) correctEl.innerHTML = "✅ " + t('bb_correct_answer') + " <strong>" + data.correctAnswer.toLocaleString('tr-TR') + " " + (data.unit || "") + "</strong>";

    // Sonuçlar listesi
    var listEl = document.getElementById("bb-results-list");
    if (listEl) {
      var html = "";
      var genderMap = { male: t('bb_men_group'), female: t('bb_women_group') };
      Object.keys(data.genderResults || {}).forEach(function(gender) {
        var gr = data.genderResults[gender];
        html += '<div class="bb-gender-result"><div class="bb-gender-title">' + genderMap[gender] + '</div>';
        (gr.contestants || []).forEach(function(c) {
          var isWinner = (gr.winners || []).includes(c.pairId);
          // Hangi takım
          var pairName = "";
          _bbPairs.forEach(function(p) { if (p.id === c.pairId) pairName = p.teamName; });
          html += '<div class="bb-result-row' + (isWinner ? " bb-winner" : "") + '">';
          html += '<span class="bb-result-name">' + (isWinner ? "🏆 " : "") + c.username + ' <small>(' + pairName + ')</small></span>';
          html += '<span class="bb-result-val">' + (c.answer !== null ? c.answer.toLocaleString('tr-TR') : "—") + '</span>';
          html += '</div>';
        });
        html += '</div>';
      });
      listEl.innerHTML = html;
    }

    // Puanları güncelle
    _bbUpdateScores(data.scores, data.targetScore);
  });

  socket.on("bilBakalimEnd", function(data) {
    if (_bbTimerInterval) { clearInterval(_bbTimerInterval); _bbTimerInterval = null; }

    var winnerPair = _bbPairs.find(function(p) { return p.id === data.winner; });
    var scoresHtml = (data.ranking || []).map(function(r, i) {
      return '<div style="margin:6px 0; font-size:' + (i === 0 ? '1.2rem' : '1rem') + '">' +
        (i === 0 ? '🏆 ' : (i === 1 ? '🥈 ' : '🥉 ')) +
        '<strong>' + r.teamName + '</strong>: ' + r.score + t('points_suffix') + '</div>';
    }).join('');

    Swal.fire({
      title: '🎯 ' + t('bb_final_rankings'),
      html: '<div style="padding:10px 0">' +
        (winnerPair ? '<div style="font-size:1.3rem;margin-bottom:10px">🏆 ' + t('bb_champion') + ': <strong>' + winnerPair.teamName + '</strong></div>' : '') +
        scoresHtml + '</div>',
      background: "linear-gradient(145deg, rgba(20, 18, 50, 0.97), rgba(10, 8, 35, 0.98))",
      color: "#fff",
      confirmButtonText: t('btn_ok'),
    }).then(function() {
      showScreen("waiting");
    });
  });

  function _bbUpdateScores(scores, targetScore) {
    var scoresEl = document.getElementById("bb-scores");
    if (!scoresEl || !_bbPairs.length) return;
    var html = _bbPairs.map(function(pair) {
      var sc = (scores && scores[pair.id]) || 0;
      var isMe = pair.id === _bbMyPairId;
      return '<div class="bb-score-chip' + (isMe ? " bb-score-me" : "") + '">' +
        '<span class="bb-score-name">' + pair.teamName + '</span>' +
        '<span class="bb-score-val">' + sc + (targetScore ? '/' + targetScore : '') + '</span>' +
        '</div>';
    }).join('');
    scoresEl.innerHTML = html;
  }

  function sendBilBakalimAnswer() {
    if (_bbAnswered) return;
    var input = document.getElementById("bb-answer-input");
    if (!input) return;
    var val = parseFloat(input.value);
    if (isNaN(val)) { input.focus(); return; }

    _bbAnswered = true;
    input.disabled = true;
    var sendBtn = document.getElementById("bb-send-btn");
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = t('bb_answered'); }
    var statusEl = document.getElementById("bb-answered-status");
    if (statusEl) statusEl.textContent = t('bb_answered');

    socket.emit("bilBakalimAnswer", { roomId: currentRoom, answer: val });
  }

} // end setupSocketListeners

// --- GLOBAL EXPORTS (HTML onclick handlers) ---
// openSettings, handleAvatarChange → auth.js global
// setLanguage → translations.js global
window.goToPassPlay       = goToPassPlay;
window.goToPrivateRoom    = goToPrivateRoom;
window.selectPassPlayGame = selectPassPlayGame;
window.openQrScanner      = openQrScanner;
window.closeQrScanner     = closeQrScanner;
window.passPlayUnlock     = passPlayUnlock;
window.createRoom         = createRoom;
window.joinRoom           = joinRoom;
window.goToMatchmaking    = goToMatchmaking;
window.findMatch          = findMatch;
window.cancelMatchmaking  = cancelMatchmaking;
window.selectMode         = selectMode;
window.selectGame         = selectGame;
window.selectMMMode       = selectMMMode;
window.toggleMMGame       = toggleMMGame;
window.goBackToGameSelect = goBackToGameSelect;
window.confirmGameSettings= confirmGameSettings;
window.showScreen         = showScreen;

// --- SESSION RECOVERY ---
// Session recovery artık auth.js'deki onAuthStateChanged ve connectSocket tarafından yönetiliyor
// Saved room varsa connect sonrası otomatik rejoin yapılıyor (connect handler'da)

// --- REKLAM YÖNETİMİ ---
// Bottom bar toggle (gizle/göster)
(function() {
  var toggle = document.getElementById('ad-bottombar-toggle');
  var bar = document.getElementById('ad-bottombar');
  if (toggle && bar) {
    toggle.addEventListener('click', function() {
      var collapsed = bar.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▲ Reklam' : '▼ Gizle';
    });
  }
})();

// Interstitial reklam - oda kurulunca 1 kez 5 saniye gösterilir
var _interstitialShown = false;

function showInterstitialAd() {
  if (_interstitialShown) return;
  _interstitialShown = true;

  var overlay = document.getElementById('ad-interstitial');
  var countdownEl = document.getElementById('ad-interstitial-countdown');
  var closeBtn = document.getElementById('ad-interstitial-close');
  if (!overlay) return;

  // AdSense reklamını yükle
  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch(e) {}

  overlay.classList.add('active');
  var remaining = 5;
  if (countdownEl) countdownEl.textContent = remaining;

  var timer = setInterval(function() {
    remaining--;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timer);
      if (closeBtn) closeBtn.classList.add('visible');
    }
  }, 1000);

  if (closeBtn) {
    closeBtn.onclick = function() {
      overlay.classList.remove('active');
    };
  }
}
window.showInterstitialAd = showInterstitialAd;
