// Firebase Configuration - DuoDuels
// Runtime config önceliği:
// 1) window.__DUODUELS_FIREBASE_CONFIG__ (opsiyonel, deploy-time injection)
// 2) Aşağıdaki fallback değerleri
const firebaseConfig = window.__DUODUELS_FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyDblxGjX8I-Yw-5mHERi_LXZ1KD0W9rtUc",
  authDomain: "duoduels.firebaseapp.com",
  projectId: "duoduels",
  storageBucket: "duoduels.firebasestorage.app",
  messagingSenderId: "694845091148",
  appId: "1:694845091148:web:982dc0ea53506d565c33e9"
};

let auth = null;
let db = null;
let _firebaseReady = false;

function isPlaceholderFirebaseConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return true;
  const values = [
    cfg.apiKey,
    cfg.authDomain,
    cfg.projectId,
    cfg.storageBucket,
    cfg.messagingSenderId,
    cfg.appId
  ];
  return values.some((v) => typeof v !== "string" || v.includes("YOUR_"));
}

try {
  if (isPlaceholderFirebaseConfig(firebaseConfig)) {
    throw new Error("Firebase config eksik. Gerçek proje bilgilerini girin.");
  }
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  // Persistence ayarı - oturum tab kapatılınca bile korunsun
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  _firebaseReady = true;
} catch (e) {
  console.error("Firebase init hatası:", e.message);
  // Firebase init başarısız - splash kaldır ve auth ekranını göster
  document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.classList.add('splash-hide');
      setTimeout(() => { splash.remove(); }, 600);
    }
  });
}
