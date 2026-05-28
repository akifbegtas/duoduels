const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Server-side i18n helper (mirrors client translations for error messages)
const SERVER_MESSAGES = {
  tr: {
    room_not_found: "Oda bulunamadı!",
    only_host_start: "Sadece kurucu oyunu başlatabilir!",
    imposter_tek: "Imposter sadece tek modda oynanabilir!",
    imposter_min3: "Imposter için en az 3 oyuncu gerekli!",
    tek_pictionary: "Tek modda sadece Resim Çiz ve Imposter oynanabilir!",
    min2_players: "En az 2 oyuncu gerekli!",
    not_enough_teams: "Yeterli takım yok!",
    only_host_settings: "Sadece kurucu ayarları değiştirebilir!",
    room_inactive: "Oda hareketsizlik nedeniyle kapatıldı.",
    wait_opponent: "Rakibin tahminini bekle!",
    searching_opponent: "Karşı cinsten oyuncu aranıyor...",
    eliminated: "ELENDİ! 💀",
    all_eliminated: "Herkes Elendi! 💀",
  },
  en: {
    room_not_found: "Room not found!",
    only_host_start: "Only the host can start the game!",
    imposter_tek: "Imposter can only be played in single mode!",
    imposter_min3: "Imposter requires at least 3 players!",
    tek_pictionary: "Only Pictionary and Imposter are available in single mode!",
    min2_players: "At least 2 players required!",
    not_enough_teams: "Not enough teams!",
    only_host_settings: "Only the host can change settings!",
    room_inactive: "Room closed due to inactivity.",
    wait_opponent: "Wait for your opponent's guess!",
    searching_opponent: "Searching for an opponent...",
    eliminated: "ELIMINATED! 💀",
    all_eliminated: "Everyone Eliminated! 💀",
  },
  ar: {
    room_not_found: "الغرفة غير موجودة!",
    only_host_start: "فقط المضيف يمكنه بدء اللعبة!",
    imposter_tek: "المحتال متاح فقط في الوضع الفردي!",
    imposter_min3: "المحتال يتطلب 3 لاعبين على الأقل!",
    tek_pictionary: "فقط الرسم وImposter متاحان في الوضع الفردي!",
    min2_players: "يجب وجود لاعبين على الأقل!",
    not_enough_teams: "لا توجد فرق كافية!",
    only_host_settings: "فقط المضيف يمكنه تغيير الإعدادات!",
    room_inactive: "تم إغلاق الغرفة بسبب عدم النشاط.",
    wait_opponent: "انتظر تخمين خصمك!",
    searching_opponent: "البحث عن خصم...",
    eliminated: "تم الإقصاء! 💀",
    all_eliminated: "تم إقصاء الجميع! 💀",
  }
};

function serverT(key, lang) {
  lang = lang || 'tr';
  return (SERVER_MESSAGES[lang] && SERVER_MESSAGES[lang][key]) || SERVER_MESSAGES['tr'][key] || key;
}

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '2mb' }));

// --- CORS Allowlist ---
const ALLOWED_ORIGINS = [
  'https://duoduels.com',
  'https://www.duoduels.com',
  'https://duoduels.onrender.com',
  'https://duoduels-efwwv7zyia-ew.a.run.app',
  'https://duoduels-599689373205.europe-west1.run.app',
  'capacitor://localhost',
  'duoduels://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Origin yoksa (same-origin GET veya native app) izin ver
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// --- Security Headers ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://pagead2.googlesyndication.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.googlesyndication.com https://*.doubleclick.net; " +
    "connect-src 'self' wss://duoduels.onrender.com wss://duoduels.com wss://www.duoduels.com https://duoduels-599689373205.europe-west1.run.app wss://duoduels-599689373205.europe-west1.run.app wss://duoduels-efwwv7zyia-ew.a.run.app ws://localhost:3000 ws://127.0.0.1:3000 https://*.googlesyndication.com https://*.doubleclick.net; " +
    "frame-src 'self' https://*.googlesyndication.com https://*.doubleclick.net;"
  );
  next();
});

// --- HTTP Rate Limiting ---
const httpRateLimits = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  let entry = httpRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60000 }; // 1 dakika penceresi
    httpRateLimits.set(ip, entry);
  }
  entry.count++;
  if (entry.count > 300) { // dakikada max 300 istek
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});
// Eski HTTP rate limit kayıtlarını temizle (her 5 dk)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of httpRateLimits) {
    if (now > entry.resetAt) httpRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

app.use(express.static(path.join(__dirname, "public")));

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "terms.html"));
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
});

// --- Input Validation Helpers ---
const VALID_GAME_TYPES = ['telepati', 'isimSehir', 'pictionary', 'tabu', 'sayiTahmin', 'imposter', 'bilBakalim'];
const VALID_GENDERS = ['male', 'female'];
const VALID_GAME_MODES = ['cift', 'duo', 'tek'];
const MODE_GAME_TYPES = {
  cift: ['telepati', 'isimSehir', 'pictionary', 'tabu', 'sayiTahmin', 'bilBakalim'],
  duo: ['telepati', 'isimSehir', 'pictionary', 'tabu', 'sayiTahmin', 'bilBakalim'],
  tek: ['pictionary', 'imposter'],
};
function isGameSupportedForMode(gameType, gameMode) {
  return !!(MODE_GAME_TYPES[gameMode] && MODE_GAME_TYPES[gameMode].includes(gameType));
}

// --- BİL BAKALIM SORU BANKASI ---
const BIL_BAKALIM_QUESTIONS = [
  { q: "İnsan vücudunda kaç kemik bulunur?", a: 206, unit: "kemik" },
  { q: "Dünya'da kaç ülke vardır?", a: 195, unit: "ülke" },
  { q: "Fil bir günde ortalama kaç litre su içer?", a: 150, unit: "litre" },
  { q: "Bir ahtapotun kaç kalbi vardır?", a: 3, unit: "kalp" },
  { q: "Türkiye'nin kaç ili vardır?", a: 81, unit: "il" },
  { q: "İnsan gözü kaç rengi ayırt edebilir?", a: 10000000, unit: "renk" },
  { q: "Ortalama bir bulut kaç ton ağırlığındadır?", a: 500, unit: "ton" },
  { q: "Bir salyangoz kaç yıl uyuyabilir?", a: 3, unit: "yıl" },
  { q: "Güneş'ten Dünya'ya ışığın ulaşması kaç dakika sürer?", a: 8, unit: "dakika" },
  { q: "İnsan beyni kaç milyar nöron içerir?", a: 86, unit: "milyar" },
  { q: "Bir arının kanadı saniyede kaç kez çırpar?", a: 200, unit: "kez" },
  { q: "DNA'nın bir insan hücresindeki uzunluğu kaç metredir?", a: 2, unit: "metre" },
  { q: "Dünya'nın en derin noktası (Mariana Çukuru) kaç metre derinliktedir?", a: 11034, unit: "metre" },
  { q: "Bir timsah kaç yıl yaşayabilir?", a: 70, unit: "yıl" },
  { q: "Ortalama bir insan hayatında kaç kilometre yürür?", a: 160000, unit: "km" },
  { q: "Türkiye'nin yüzölçümü kaç km²'dir?", a: 783562, unit: "km²" },
  { q: "Bir zürafanın dili kaç santimetre uzunluğundadır?", a: 45, unit: "cm" },
  { q: "Bütün dünyadaki karıncaların toplam ağırlığı kaç trilyon tondur?", a: 20, unit: "trilyon ton" },
  { q: "Bir insanın tüm kan damarlarının toplam uzunluğu kaç km'dir?", a: 100000, unit: "km" },
  { q: "Okyanusların ortalama derinliği kaç metredir?", a: 3688, unit: "metre" },
  { q: "Bir koala günde kaç saat uyur?", a: 22, unit: "saat" },
  { q: "İnsan vücudundaki bakteri sayısı, hücre sayısının kaç katıdır?", a: 1, unit: "kat" },
  { q: "Bir muz yaklaşık kaç kalori içerir?", a: 89, unit: "kalori" },
  { q: "Dünya'nın çevresinin uzunluğu kaç km'dir?", a: 40075, unit: "km" },
  { q: "En hızlı hayvan olan şahin kaç km/saat hıza ulaşabilir?", a: 389, unit: "km/saat" },
  { q: "Bir inek hayatı boyunca kaç litre süt verir?", a: 200000, unit: "litre" },
  { q: "Türkiye'de kaç tür kuş yaşamaktadır?", a: 500, unit: "tür" },
  { q: "Bir insanın tüm saçları yılda ortalama kaç cm uzar?", a: 15, unit: "cm" },
  { q: "Bir karınca kendi ağırlığının kaç katını taşıyabilir?", a: 50, unit: "kat" },
  { q: "Dünyanın en yüksek dağı Everest kaç metre yüksekliğindedir?", a: 8849, unit: "metre" },
];

function sanitizeString(str, maxLength = 50) {
  if (typeof str !== 'string') return '';
  // S2 fix: strip HTML tags to prevent injection. Data is JSON-transported so
  // we strip angle-bracket tags but preserve other characters to avoid double-encoding
  // when the client calls escapeHtml() on display.
  return str.trim().substring(0, maxLength).replace(/<[^>]*>/g, '');
}

function randomDigits(length = 4) {
  const size = Math.max(1, Number(length) || 4);
  let digits = '';

  do {
    digits = '';
    for (let i = 0; i < size; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
  } while (/^(\d)\1*$/.test(digits));

  return digits;
}

function isValidRoomId(id) {
  return typeof id === 'string' && /^[A-Z0-9]{5,6}$/.test(id);
}

function getValidRoom(roomId) {
  if (!isValidRoomId(roomId)) return null;
  return rooms[roomId] || null;
}

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id;
  do {
    id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[id]);
  return id;
}

// --- Rate Limiting ---
io.use((socket, next) => {
  const limits = { count: 0, resetAt: Date.now() + 1000 };
  const drawLimits = { count: 0, resetAt: Date.now() + 1000 };
  socket.use(([event], next) => {
    const now = Date.now();
    if (event === 'drawData') {
      // drawData için ayrı, daha yüksek limit (saniyede 120)
      if (now > drawLimits.resetAt) {
        drawLimits.count = 0;
        drawLimits.resetAt = now + 1000;
      }
      drawLimits.count++;
      if (drawLimits.count > 120) {
        return next(new Error('Draw rate limit exceeded'));
      }
      return next();
    }
    if (now > limits.resetAt) {
      limits.count = 0;
      limits.resetAt = now + 1000;
    }
    limits.count++;
    if (limits.count > 30) {
      return next(new Error('Rate limit exceeded'));
    }
    next();
  });
  next();
});

// --- Simple Handshake Auth ---
// Client localStorage'da ürettiği UUID'yi handshake'te gönderir.
// Token doğrulama / Firebase yok — sadece girilen username + UUID.
io.use((socket, next) => {
  const auth = socket.handshake.auth || {};
  const rawId = sanitizeString(auth.playerId || '', 64);
  socket.userId = rawId || `anon_${socket.id}`;
  socket.lang = (typeof auth.lang === 'string' && ['tr', 'en', 'ar'].includes(auth.lang)) ? auth.lang : 'tr';
  next();
});

const rooms = {};

// --- Player Identity ---
const playerSockets = {}; // playerId -> socketId

function getSocketId(playerId) {
  return playerSockets[playerId] || "__disconnected__";
}

const TURKISH_LETTERS = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
];
const CATEGORIES = ["İSİM", "ŞEHİR", "HAYVAN"];

const EXAMPLES = {
  A: { İSİM: "Ayşe", ŞEHİR: "Ankara", HAYVAN: "Aslan" },
  B: { İSİM: "Burak", ŞEHİR: "Bursa", HAYVAN: "Balina" },
  C: { İSİM: "Cem", ŞEHİR: "Canberra", HAYVAN: "Ceylan" },
  Ç: { İSİM: "Çiğdem", ŞEHİR: "Çanakkale", HAYVAN: "Çakal" },
  D: { İSİM: "Deniz", ŞEHİR: "Denizli", HAYVAN: "Deve" },
  E: { İSİM: "Elif", ŞEHİR: "Edirne", HAYVAN: "Eşek" },
  F: { İSİM: "Fatma", ŞEHİR: "Frankfurt", HAYVAN: "Flamingo" },
  G: { İSİM: "Gül", ŞEHİR: "Gaziantep", HAYVAN: "Gorilla" },
  H: { İSİM: "Hakan", ŞEHİR: "Hatay", HAYVAN: "Hamster" },
  I: { İSİM: "Işıl", ŞEHİR: "Isparta", HAYVAN: "Iguana" },
  İ: { İSİM: "İrem", ŞEHİR: "İstanbul", HAYVAN: "İnek" },
  J: { İSİM: "Jale", ŞEHİR: "Johannesburg", HAYVAN: "Jaguar" },
  K: { İSİM: "Kemal", ŞEHİR: "Konya", HAYVAN: "Kanguru" },
  L: { İSİM: "Leyla", ŞEHİR: "Londra", HAYVAN: "Lama" },
  M: { İSİM: "Murat", ŞEHİR: "Mersin", HAYVAN: "Maymun" },
  N: { İSİM: "Naz", ŞEHİR: "Nevşehir", HAYVAN: "Narval" },
  O: { İSİM: "Okan", ŞEHİR: "Ordu", HAYVAN: "Okapi" },
  Ö: { İSİM: "Özge", ŞEHİR: "Ödenburg", HAYVAN: "Ökse" },
  P: { İSİM: "Pınar", ŞEHİR: "Paris", HAYVAN: "Penguen" },
  R: { İSİM: "Rüya", ŞEHİR: "Rize", HAYVAN: "Rakun" },
  S: { İSİM: "Selin", ŞEHİR: "Samsun", HAYVAN: "Sincap" },
  Ş: { İSİM: "Şeyma", ŞEHİR: "Şanlıurfa", HAYVAN: "Şahin" },
  T: { İSİM: "Tolga", ŞEHİR: "Trabzon", HAYVAN: "Tavşan" },
  U: { İSİM: "Umut", ŞEHİR: "Uşak", HAYVAN: "Unicorn" },
  Ü: { İSİM: "Ümit", ŞEHİR: "Üsküp", HAYVAN: "Üveyik" },
  V: { İSİM: "Volkan", ŞEHİR: "Van", HAYVAN: "Vaşak" },
  Y: { İSİM: "Yasemin", ŞEHİR: "Yozgat", HAYVAN: "Yunus" },
  Z: { İSİM: "Zeynep", ŞEHİR: "Zonguldak", HAYVAN: "Zebra" },
};

const TABU_WORDS = [
  {
    word: "ARABA",
    forbidden: ["MOTOR", "TEKERLEK", "SÜRMEK", "ARAÇ", "TRAFİK"],
  },
  {
    word: "GÜNEŞ",
    forbidden: ["IŞIK", "SICAK", "GÖKYÜZÜ", "YILDIZ", "GÜNDÜZ"],
  },
  {
    word: "TELEFON",
    forbidden: ["ARAMAK", "KONUŞMAK", "CEP", "MESAJ", "EKRAN"],
  },
  {
    word: "OKUL",
    forbidden: ["ÖĞRETMEN", "ÖĞRENCİ", "DERS", "SINIF", "EĞİTİM"],
  },
  {
    word: "HASTANE",
    forbidden: ["DOKTOR", "HASTA", "İLAÇ", "AMELİYAT", "HEMŞİRE"],
  },
  { word: "FUTBOL", forbidden: ["TOP", "GOL", "SAHA", "MAÇ", "OYUNCU"] },
  { word: "DENİZ", forbidden: ["SU", "DALGA", "KUMSAL", "YÜZMEK", "OKYANUS"] },
  {
    word: "UÇAK",
    forbidden: ["UÇMAK", "PİLOT", "GÖKYÜZÜ", "HAVALİMANI", "KANAT"],
  },
  {
    word: "KİTAP",
    forbidden: ["OKUMAK", "SAYFA", "YAZAR", "KÜTÜPHANE", "ROMAN"],
  },
  {
    word: "MÜZİK",
    forbidden: ["ŞARKI", "ENSTRÜMAN", "DİNLEMEK", "NOTA", "MELODI"],
  },
  {
    word: "SİNEMA",
    forbidden: ["FİLM", "İZLEMEK", "EKRAN", "OYUNCU", "BİLET"],
  },
  {
    word: "BİLGİSAYAR",
    forbidden: ["EKRAN", "KLAVYE", "MOUSE", "İNTERNET", "PROGRAM"],
  },
  {
    word: "PIZZA",
    forbidden: ["HAMUR", "PEYNİR", "İTALYAN", "DİLİM", "FIRINDA"],
  },
  {
    word: "DOKTOR",
    forbidden: ["HASTA", "HASTANE", "İLAÇ", "MUAYENE", "SAĞLIK"],
  },
  {
    word: "ÖĞRETMEN",
    forbidden: ["OKUL", "DERS", "ÖĞRENCİ", "SINIF", "EĞİTİM"],
  },
  { word: "POLİS", forbidden: ["SUÇ", "KANUN", "KARAKOL", "EMNİYET", "SİREN"] },
  {
    word: "KÖPEK",
    forbidden: ["HAVLAMAK", "KUYRUK", "MAMA", "PATI", "HAYVAN"],
  },
  {
    word: "KEDİ",
    forbidden: ["MİYAVLAMAK", "PATI", "KUYRUK", "TÜYLÜ", "HAYVAN"],
  },
  { word: "BEBEK", forbidden: ["ÇOCUK", "AĞLAMAK", "KÜÇÜK", "ANNE", "DOĞMAK"] },
  { word: "DÜĞÜN", forbidden: ["EVLİLİK", "GELİN", "DAMAT", "NİKAH", "DANS"] },
  {
    word: "BAYRAM",
    forbidden: ["TATİL", "ŞEKER", "KURBAN", "KUTLAMA", "ZİYARET"],
  },
  { word: "TATİL", forbidden: ["DİNLENMEK", "SEYAHAT", "OTEL", "YAZ", "GEZİ"] },
  {
    word: "YAĞMUR",
    forbidden: ["SU", "BULUT", "ISLANMAK", "ŞEMSİYE", "DAMLA"],
  },
  {
    word: "KAR",
    forbidden: ["BEYAZ", "SOĞUK", "KIŞ", "KARDAN ADAM", "ERİMEK"],
  },
  { word: "RÜYA", forbidden: ["UYKU", "GÖRMEK", "GECE", "HAYAL", "UYUMAK"] },
  {
    word: "AŞK",
    forbidden: ["SEVGİ", "KALP", "SEVGİLİ", "ROMANTIK", "SEVMEK"],
  },
  {
    word: "ARKADAŞ",
    forbidden: ["DOST", "BERABER", "OKUL", "YAKINI", "TANINMAK"],
  },
  { word: "ANNE", forbidden: ["BABA", "ÇOCUK", "KADIN", "AİLE", "DOĞUM"] },
  { word: "BABA", forbidden: ["ANNE", "ÇOCUK", "ERKEK", "AİLE", "EVLAT"] },
  { word: "ÇOCUK", forbidden: ["KÜÇÜK", "BEBEK", "ANNE", "BABA", "OYNAMAK"] },
  { word: "UYKU", forbidden: ["YATAK", "GECE", "UYUMAK", "RÜYA", "YORGUN"] },
  {
    word: "KAHVALTI",
    forbidden: ["SABAH", "YEMEK", "ÇAY", "YUMURTA", "EKMEK"],
  },
  {
    word: "AKŞAM YEMEĞİ",
    forbidden: ["GECE", "SOFRA", "YİYECEK", "AİLE", "MUTFAK"],
  },
  { word: "ÇAY", forbidden: ["İÇMEK", "SICAK", "BARDAK", "DEMLİK", "ŞEKERLİ"] },
  { word: "KAHVE", forbidden: ["İÇMEK", "FİNCAN", "SICAK", "KAFEİN", "TÜRK"] },
  { word: "DONDURMA", forbidden: ["SOĞUK", "TATLI", "YEMEK", "KÜLAH", "YAZ"] },
  {
    word: "ÇİKOLATA",
    forbidden: ["TATLI", "KAKAO", "KAHVE", "BROWN", "YİYECEK"],
  },
  {
    word: "MARKET",
    forbidden: ["ALIŞVERİŞ", "MAĞAZA", "ÜRÜN", "KASA", "REYONLAR"],
  },
  { word: "PARK", forbidden: ["AĞAÇ", "BANK", "YEŞİL", "YÜRÜMEK", "BAHÇE"] },
  {
    word: "ASKER",
    forbidden: ["ORDU", "SİLAH", "ASKERİYE", "VATAN", "ÜNİFORMA"],
  },
  { word: "BAYRAK", forbidden: ["KIRMIZI", "BEYAZ", "AY", "YILDIZ", "VATAN"] },
  {
    word: "İSTANBUL",
    forbidden: ["ŞEHİR", "BOĞAZ", "KÖPRÜ", "BÜYÜK", "TÜRKİYE"],
  },
  {
    word: "ANKARA",
    forbidden: ["BAŞKENT", "ŞEHİR", "KIZILKULE", "ANITKADIR", "TÜRKİYE"],
  },
  {
    word: "TRABZON",
    forbidden: ["KARADENİZ", "ŞEHİR", "HAMSI", "YEŞİL", "UZUNGÖL"],
  },
  {
    word: "GALATASARAY",
    forbidden: ["FUTBOL", "SARI", "KIRMIZI", "TAKIM", "CİMBOM"],
  },
  {
    word: "FENERBAHÇE",
    forbidden: ["FUTBOL", "SARI", "LACİVERT", "TAKIM", "KANARYA"],
  },
  {
    word: "BEŞİKTAŞ",
    forbidden: ["FUTBOL", "SİYAH", "BEYAZ", "TAKIM", "KARTAL"],
  },
  { word: "RAMAZAN", forbidden: ["ORUÇ", "İFTAR", "SAHUR", "DUA", "DİN"] },
  { word: "NOEL", forbidden: ["BABA", "AĞAÇ", "HEDİYE", "KIRMIZI", "ARALIK"] },
  {
    word: "KAMERA",
    forbidden: ["FOTOĞRAF", "ÇEKİM", "VİDEO", "LENS", "KAYIT"],
  },
];

const PICTIONARY_WORDS = [
  "ARABA",
  "EV",
  "AĞAÇ",
  "GÜNEŞ",
  "YILDIZ",
  "AY",
  "BULUT",
  "YAĞMUR",
  "KAR",
  "DENİZ",
  "BALIK",
  "KEDİ",
  "KÖPEK",
  "KUŞ",
  "KELEBEK",
  "ÇİÇEK",
  "GÜL",
  "KALP",
  "YÜZÜK",
  "PASTA",
  "DONDURMA",
  "PİZZA",
  "HAMBURGER",
  "ELMA",
  "MUZ",
  "ÇİLEK",
  "KARPUZ",
  "PORTAKAL",
  "ÜZÜM",
  "ARMUT",
  "FUTBOL",
  "BASKETBOL",
  "BİSİKLET",
  "UÇAK",
  "GEMİ",
  "TREN",
  "ROKET",
  "HELİKOPTER",
  "OTOBÜS",
  "MOTOSİKLET",
  "TELEFON",
  "BİLGİSAYAR",
  "TELEVİZYON",
  "KAMERA",
  "SAAT",
  "GÖZLÜK",
  "ŞEMSIYE",
  "ÇANTA",
  "AYAKKABI",
  "ŞAPKA",
  "KİTAP",
  "KALEM",
  "MASA",
  "SANDALYE",
  "YATAK",
  "LAMBA",
  "ANAHTAR",
  "MAKAS",
  "BARDAK",
  "TABAK",
  "GÖKKUŞAĞI",
  "YANARDAĞ",
  "PALMIYE",
  "KÖPRÜ",
  "KALE",
  "PİRAMİT",
  "BAYRAK",
  "MERDIVEN",
  "ÇİT",
  "KUYU",
  "ASLAN",
  "FİL",
  "ZÜRAFA",
  "PENGUEN",
  "YUNUS",
  "KAPLUMBAĞA",
  "YILAN",
  "TAVŞAN",
  "MAYMUN",
  "KARTAL",
];

const IMPOSTER_WORDS = [
  { word: "PIZZA", hint: "Yiyecek" },
  { word: "KÖPEK", hint: "Hayvan" },
  { word: "KEDİ", hint: "Hayvan" },
  { word: "İSTANBUL", hint: "Şehir" },
  { word: "FUTBOL", hint: "Spor" },
  { word: "ARABA", hint: "Araç" },
  { word: "GÜNEŞ", hint: "Gökyüzü" },
  { word: "OKUL", hint: "Bina" },
  { word: "DENİZ", hint: "Doğa" },
  { word: "SİNEMA", hint: "Eğlence" },
  { word: "KAHVALTI", hint: "Öğün" },
  { word: "HASTANE", hint: "Bina" },
  { word: "UÇAK", hint: "Ulaşım" },
  { word: "KİTAP", hint: "Nesne" },
  { word: "MÜZİK", hint: "Sanat" },
  { word: "BAYRAM", hint: "Kutlama" },
  { word: "YAĞMUR", hint: "Hava Durumu" },
  { word: "AŞK", hint: "Duygu" },
  { word: "DONDURMA", hint: "Yiyecek" },
  { word: "PLAJ", hint: "Mekan" },
  { word: "DOKTOR", hint: "Meslek" },
  { word: "GALATASARAY", hint: "Spor Kulübü" },
  { word: "RAMAZAN", hint: "Kültür" },
  { word: "DÜĞÜN", hint: "Tören" },
  { word: "BEBEK", hint: "İnsan" },
];

io.on("connection", (socket) => {
  const origin = socket.handshake.headers.origin || socket.handshake.headers.referer || 'unknown';
  console.log(`Yeni bağlantı: socketId=${socket.id} userId=${socket.userId} origin=${origin} transport=${socket.conn.transport.name}`);
  const playerId = socket.userId;
  playerSockets[playerId] = socket.id;

  socket.on("setLanguage", (data = {}) => {
    const lang = sanitizeString(data.lang, 5).toLowerCase();
    socket.lang = ['tr', 'en', 'ar'].includes(lang) ? lang : 'tr';
  });

  // --- ODA OLUŞTURMA ---
  socket.on("createRoom", (data) => {
    const roomId = generateRoomId();

    const gameType = VALID_GAME_TYPES.includes(data.gameType) ? data.gameType : "telepati";
    const gameMode = VALID_GAME_MODES.includes(data.gameMode) ? data.gameMode : "cift";
    const username = sanitizeString(data.username, 12) || "Oyuncu";
    const gender = VALID_GENDERS.includes(data.gender) ? data.gender : "male";

    if (!isGameSupportedForMode(gameType, gameMode)) {
      socket.emit("gameError", serverT('tek_pictionary', socket.lang));
      return;
    }

    let count = parseInt(data.coupleCount);
    if (gameMode === "duo") {
      if (!count || count < 1) count = 1;
    } else {
      if (!count || count < 2) count = 2;
    }
    if (count > 5) count = 5;

    let rounds = parseInt(data.roundCount);
    if (!rounds || rounds < 1) rounds = 5;
    if (rounds > 20) rounds = 20;

    let time = parseInt(data.roundTime);
    if (!time || time < 5) time = 10;
    if (time > 120) time = 120;

    const pid = socket.userId;
    const hostPlayer = {
      id: pid,
      socketId: socket.id,
      username: username,
      gender: gender,
      isHost: true,
    };

    let teams = [];
    let players = [];
    let maxPlayers = 0;

    if (gameMode === "tek") {
      players.push(hostPlayer);
      maxPlayers = parseInt(data.maxPlayers) || 10;
    } else {
      for (let i = 0; i < count; i++) {
        teams.push({ id: i, name: `Takım ${i + 1}`, p1: null, p2: null });
      }
      teams[0].p1 = hostPlayer;
    }

    rooms[roomId] = {
      id: roomId,
      gameMode: gameMode,
      teams: teams,
      players: players,
      maxPlayers: maxPlayers,
      spectators: [],
      gameStatus: "waiting",
      createdAt: Date.now(),
      lastActivity: Date.now(),
      gameType: gameType,
      currentPairIndex: 0,
      roundCount: rounds,
      roundTime: time,
      currentRound: 1,
      pairs: [],
      moves: {},
      telepatiTimer: null,
      soloPlayers: [],
      currentDrawerIndex: 0,
      // Pictionary specific
      pictionaryScores: {},
      pictionaryUsedWords: [],
      pictionaryDrawerToggle: 0,
      pictionaryGuessOrder: [],
      pictionaryTimer: null,
      // İsim Şehir specific
      currentLetter: null,
      currentCategory: null,
      categoryIndex: 0,
      isimSehirScores: {},
      usedLetters: [],
      isimSehirTimer: null,
      // Tabu specific
      tabuScores: {},
      tabuUsedWords: [],
      tabuTimer: null,
      tabuCurrentWord: null,
      tabuDescriberId: null,
      tabuGuesserId: null,
      tabuDescriberToggle: 0,
      tabuPassesLeft: 3,
      // Sayı Tahmin specific
      sayiTahminSecrets: {},
      sayiTahminGuesses: {},
      sayiTahminCurrentTurn: null, // p1 or p2
      sayiTahminRound: 1,
      sayiTahminDigitCount: Math.max(3, Math.min(6, parseInt(data.digitCount) || 4)), // Bug L4 fix: double-clamped
      sayiTahminTimer: null,
      sayiTahminTieCount: 0,
      // Bil Bakalım specific
      bilBakalimScores: {},
      bilBakalimAnswers: {},
      bilBakalimCurrentQ: null,
      bilBakalimUsedQIndices: [],
      bilBakalimTimer: null,
      bilBakalimTargetScore: Math.min(Math.max(parseInt(data.targetScore) || 10, 5), 20),
    };

    // --- Pass & Play desteği ---
    if (data.passPlay === true && gameMode === 'duo') {
      rooms[roomId].passPlay = true;
      const p2Username = sanitizeString(data.p2Username, 12) || 'Oyuncu 2';
      const p2Gender = data.p2Gender === 'female' ? 'female' : 'male';
      const p2Id = 'passplay_' + socket.userId;
      const p2 = { id: p2Id, socketId: socket.id, username: p2Username, gender: p2Gender, isHost: false };
      if (!rooms[roomId].teams[0]) rooms[roomId].teams[0] = { id: 0, name: 'Takım 1', p1: null, p2: null };
      rooms[roomId].teams[0].p2 = p2;
      playerSockets[p2Id] = socket.id;
      console.log(`Pass&Play Oda: ${roomId} | P1:${username} P2:${p2Username}`);
    }

    console.log(
      `Oda Kuruldu: ${roomId} | Mod: ${gameMode} | Oyun: ${gameType} | Tur: ${rounds} | Süre: ${time}`,
    );

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    emitLobbyUpdate(roomId);
  });

  // --- ODAYA KATILMA ---
  socket.on("joinRoom", ({ roomId, username, gender }) => {
    const cleanRoomId = typeof roomId === 'string' ? roomId.toUpperCase().trim() : '';
    const cleanUsername = sanitizeString(username, 12) || "Oyuncu";
    const cleanGender = VALID_GENDERS.includes(gender) ? gender : "male";
    console.log(`joinRoom isteği: oda=${cleanRoomId} kullanıcı=${cleanUsername} mevcut=${!!rooms[cleanRoomId]}`);
    const room = rooms[cleanRoomId];
    if (!room) {
      socket.emit("gameError", serverT('room_not_found', socket.lang));
      return;
    }

    const pid = socket.userId;
    const existingRoomId = findRoomIdByPlayer(pid);
    if (existingRoomId && existingRoomId !== cleanRoomId) {
      socket.leave(existingRoomId);
      removePlayerFromRoom(existingRoomId, pid);
    }

    // Zaten odada mı?
    const existingPlayer = findPlayerInRoom(room, pid);
    if (existingPlayer) {
      // Yeni socketle (yeniden bağlanma) geldiyse referansları tazele
      existingPlayer.socketId = socket.id;
      existingPlayer.disconnected = false;
      existingPlayer.disconnectedAt = null;
      playerSockets[pid] = socket.id;
      socket.join(cleanRoomId);
      socket.emit("joinedRoom", cleanRoomId);
      emitLobbyUpdate(cleanRoomId);
      return;
    }
    const newPlayer = { id: pid, socketId: socket.id, username: cleanUsername, gender: cleanGender, isHost: false };
    if (room.gameStatus === "waiting") {
      if (room.gameMode === "tek") {
        if (room.maxPlayers > 0 && room.players.length >= room.maxPlayers) {
          // Oda dolu ama seyirci olarak katılabilir
          room.spectators.push(newPlayer);
        } else {
          room.players.push(newPlayer);
        }
      } else {
        room.spectators.push(newPlayer);
      }
    } else {
      // Oyun devam ederken sadece seyirci olarak katıl
      room.spectators.push(newPlayer);
    }
    playerSockets[pid] = socket.id;
    socket.join(cleanRoomId);
    socket.emit("joinedRoom", cleanRoomId);
    emitLobbyUpdate(cleanRoomId);
  });

  // --- TAKIM SEÇME ---
  socket.on("selectTeam", ({ roomId, teamIndex, slot }) => {
    const room = getValidRoom(roomId);
    if (!room) return;
    if (room.gameStatus !== "waiting") return;
    const pid = socket.userId;
    const playerIndex = room.spectators.findIndex((p) => p.id === pid);
    if (playerIndex !== -1) {
      const player = room.spectators[playerIndex];
      if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex >= room.teams.length) return;
      const targetTeam = room.teams[teamIndex];
      if (slot === "p1" && targetTeam.p1 === null) {
        targetTeam.p1 = player;
        room.spectators.splice(playerIndex, 1);
      } else if (slot === "p2" && targetTeam.p2 === null) {
        targetTeam.p2 = player;
        room.spectators.splice(playerIndex, 1);
      }
      emitLobbyUpdate(roomId);
    }
  });

  // --- OYUN BAŞLATMA ---
  socket.on("startGame", (roomId) => {
    if (typeof roomId === 'string') roomId = roomId.toUpperCase().trim();
    const room = getValidRoom(roomId);
    if (!room) return;

    // Sadece host başlatabilir
    const pid = socket.userId;
    if (!isPlayerHost(room, pid)) {
      socket.emit("gameError", serverT('only_host_start', socket.lang));
      return;
    }

    // --- IMPOSTOR OYUNU ---
    if (room.gameType === "imposter") {
      if (room.gameMode !== "tek") {
        socket.emit("gameError", serverT('imposter_tek', socket.lang));
        return;
      }
      if (!room.players || room.players.length < 3) {
        socket.emit("gameError", serverT('imposter_min3', socket.lang));
        return;
      }
      room.gameStatus = "playing";
      room.currentRound = 1;
      room.roundCount = room.roundCount || 5;
      room.roundTime = room.roundTime || 60;
      room.imposterUsedWords = [];
      room.imposterSubmissions1 = {};
      room.imposterSubmissions2 = {};
      room.imposterVotes = {};
      room.imposterPhase = null;
      room.imposterScores = {};
      room.players.forEach(p => { room.imposterScores[p.id] = 0; });

      io.to(roomId).emit("imposterStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      setTimeout(() => { if (!rooms[roomId]) return; startImposterRound(roomId); }, 2000); // Bug 3 fix
      return;
    }

    // TEK MOD
    if (room.gameMode === "tek") {
      if (room.gameType !== "pictionary" && room.gameType !== "imposter") {
        socket.emit("gameError", serverT('tek_pictionary', socket.lang));
        return;
      }
      if (room.players.length < 2) {
        socket.emit("gameError", serverT('min2_players', socket.lang));
        return;
      }
      room.gameStatus = "playing";
      room.soloPlayers = [...room.players];
      room.currentRound = 1;
      room.currentDrawerIndex = 0;
      room.pictionaryScores = {};
      room.soloPlayers.forEach((p) => {
        room.pictionaryScores[p.id] = 0;
      });

      io.to(roomId).emit("pictionaryStart", {
        roundCount: room.roundCount,
        gameMode: "tek",
      });

      updatePictionaryLeaderboard(roomId);
      setTimeout(() => { if (!rooms[roomId]) return; startPictionaryRound(roomId); }, 2000); // Bug 3 fix
      return;
    }

    // ÇİFT MOD
    const validPairs = [];
    room.teams.forEach((t) => {
      if (t.p1 && t.p2) {
        validPairs.push({
          id: `pair_${t.id}`,
          teamName: t.name,
          p1: t.p1,
          p2: t.p2,
          currentTurnAttempts: 0,
          totalAttempts: 0,
          isEliminated: false,
        });
      }
    });

    const minimumPairCount = room.gameMode === "cift" ? 2 : 1;
    if (validPairs.length < minimumPairCount) {
      socket.emit("gameError", serverT('not_enough_teams', socket.lang));
      return;
    }

    room.gameStatus = "playing";
    room.pairs = validPairs;
    room.currentPairIndex = 0;
    room.currentRound = 1;

    if (room.gameType === "pictionary") {
      validPairs.forEach((p) => {
        room.pictionaryScores[p.id] = 0;
      });

      io.to(roomId).emit("pictionaryStart", {
        roundCount: room.roundCount,
      });

      updatePictionaryLeaderboard(roomId);

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startPictionaryRound(roomId);
      }, 2000);
    } else if (room.gameType === "isimSehir") {
      // Initialize scores
      validPairs.forEach((p) => {
        room.isimSehirScores[p.id] = 0;
      });

      io.to(roomId).emit("isimSehirStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
        firstPair: validPairs[0],
      });

      updateIsimSehirLeaderboard(roomId);

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startIsimSehirRound(roomId);
      }, 2000);
    } else if (room.gameType === "tabu") {
      validPairs.forEach((p) => {
        room.tabuScores[p.id] = 0;
      });

      io.to(roomId).emit("tabuStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      updateTabuLeaderboard(roomId);

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startTabuTurn(roomId);
      }, 2000);
    } else if (room.gameType === "sayiTahmin") {
      // Sayı Tahmin
      room.sayiTahminSecrets = {};
      room.sayiTahminGuesses = {};
      room.sayiTahminCurrentTurn = null;
      room.sayiTahminRound = 1;
      room.sayiTahminScores = {};
      validPairs.forEach(pair => {
        room.sayiTahminScores[pair.p1.id] = 0;
        room.sayiTahminScores[pair.p2.id] = 0;
      });

      io.to(roomId).emit("sayiTahminStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
        pairs: validPairs,
        digitCount: room.sayiTahminDigitCount,
      });

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startSayiTahminSecretPhase(roomId);
      }, 1200);
    } else if (room.gameType === "bilBakalim") {
      // Bil Bakalım — sadece çift/duo mod (2 takım karşılaşır)
      room.bilBakalimScores = {};
      room.bilBakalimAnswers = {};
      room.bilBakalimUsedQIndices = [];
      validPairs.forEach(pair => { room.bilBakalimScores[pair.id] = 0; });

      io.to(roomId).emit("bilBakalimStart", {
        targetScore: room.bilBakalimTargetScore,
        roundTime: room.roundTime,
        pairs: validPairs.map(p => ({
          id: p.id,
          teamName: p.teamName,
          p1: { id: p.p1.id, username: p.p1.username, gender: p.p1.gender },
          p2: { id: p.p2.id, username: p.p2.username, gender: p.p2.gender },
        })),
      });

      setTimeout(() => { if (!rooms[roomId]) return; startBilBakalimQuestion(roomId); }, 2500); // Bug 3 fix
    } else {
      // Telepati
      io.to(roomId).emit("gameInit", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      updateLeaderboard(roomId);

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startTurn(roomId);
      }, 2000);
    }
  });

  // --- TELEPATİ: KELİME GÖNDERME ---
  socket.on("submitWord", ({ roomId, word, passPlayActingAs }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing") return socket.emit("gameError", serverT('room_not_found', socket.lang));
    let pid = socket.userId;
    // Pass & Play: same socket can submit as P2
    if (room && room.passPlay && passPlayActingAs) {
      const cp = room.pairs[room.currentPairIndex];
      if (cp && passPlayActingAs === cp.p2.id && socket.id === cp.p2.socketId) {
        pid = passPlayActingAs;
      }
    }

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id)
      return;
    if (!room.moves[currentPair.id]) room.moves[currentPair.id] = {};

    // Duplicate submission guard - player already submitted this turn
    if (room.moves[currentPair.id][pid] !== undefined) return;

    let cleanWord = sanitizeString(word, 30).toLocaleUpperCase("tr-TR") || "⏰";
    if (cleanWord === "") cleanWord = "⏰";

    room.moves[currentPair.id][pid] = cleanWord;

    const partnerId =
      pid === currentPair.p1.id ? currentPair.p2.id : currentPair.p1.id;
    io.to(getSocketId(partnerId)).emit("partnerSubmitted");

    const who = pid === currentPair.p1.id ? "p1" : "p2";
    io.to(roomId).emit("revealOneMove", { slot: who, word: cleanWord });

    const w1 = room.moves[currentPair.id][currentPair.p1.id];
    const w2 = room.moves[currentPair.id][currentPair.p2.id];

    if (w1 !== undefined && w2 !== undefined) {
      // Bug 14 fix: guard against duplicate result processing
      if (room.scoreLocked) return;
      room.scoreLocked = true;
      // Clear server-side timeout
      if (room.telepatiTimer) { clearTimeout(room.telepatiTimer); room.telepatiTimer = null; }
      currentPair.currentTurnAttempts++;
      const isMatch = w1 === w2 && w1 !== "⏰";

      if (!isMatch) currentPair.totalAttempts++;

      updateLeaderboard(roomId);

      const result = {
        pairId: currentPair.id,
        p1Word: w1,
        p2Word: w2,
        attempts: currentPair.currentTurnAttempts,
        totalMistakes: currentPair.totalAttempts,
        match: isMatch,
      };

      if (currentPair.totalAttempts >= 20 && !currentPair.isEliminated) {
        currentPair.isEliminated = true;
        io.to(roomId).emit("spectatorUpdate", result);
        io.to(roomId).emit("gameOver", currentPair.teamName + " " + serverT('eliminated'));
        // Check if game is already over before scheduling nextTurn
        const alive = room.pairs.filter((p) => !p.isEliminated);
        if (alive.length > 1) {
          setTimeout(() => { if (!rooms[roomId]) return; nextTurn(roomId); }, 2000); // Bug 3 fix
        } else if (alive.length === 1) {
          const winner = alive[0];
          const winnerIds = [winner.p1.id, winner.p2.id];
          setTimeout(() => {
            if (!rooms[roomId]) return; // Bug 3 fix
            io.to(roomId).emit("telepatiGameOver", {
              winnerTeam: winner.teamName,
              winnerP1: winner.p1.username,
              winnerP2: winner.p2.username,
              winnerIds: winnerIds,
              winnerScore: winner.totalAttempts,
              lastStanding: true,
            });
            room.gameStatus = "finished";
            setTimeout(() => {
              if (!rooms[roomId]) return; // Bug 3 fix
              room.gameStatus = "waiting";
              emitBackToSelect(roomId);
            }, 7000);
          }, 2000);
        } else {
          setTimeout(() => {
            if (!rooms[roomId]) return; // Bug 3 fix
            io.to(roomId).emit("gameOver", serverT('all_eliminated'));
            room.gameStatus = "finished";
            setTimeout(() => {
              if (!rooms[roomId]) return; // Bug 3 fix
              room.gameStatus = "waiting";
              emitBackToSelect(roomId);
            }, 5000);
          }, 2000);
        }
        return;
      }

      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        io.to(roomId).emit("spectatorUpdate", result);
        room.moves[currentPair.id] = {};

        if (isMatch) {
          io.to(getSocketId(currentPair.p1.id))
            .to(getSocketId(currentPair.p2.id))
            .emit("levelFinished", { success: true });
          nextTurn(roomId);
        }
      }, 500);
    }
  });

  // --- İSİM ŞEHİR: 3 CEVAP BİRDEN GÖNDERME ---
  socket.on("submitAllIsimSehir", ({ roomId, answers, passPlayActingAs }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing") {
      console.log("[IS] REJECTED: room not found or not playing", roomId);
      return;
    }

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) {
      console.log("[IS] REJECTED: no currentPair at index", room.currentPairIndex);
      return;
    }

    let pid = socket.userId;
    // Pass & Play: same socket can submit as P2
    if (room.passPlay && passPlayActingAs && passPlayActingAs === currentPair.p2.id && socket.id === currentPair.p2.socketId) {
      pid = passPlayActingAs;
    }

    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id) {
      console.log("[IS] REJECTED: player not in pair", pid, "p1:", currentPair.p1.id, "p2:", currentPair.p2.id);
      return;
    }

    const who = pid === currentPair.p1.id ? "P1" : "P2";
    console.log(`[IS] ${who} submitted:`, answers);

    // Duplicate submission guard
    const firstKey = currentPair.id + "_" + CATEGORIES[0];
    if (room.moves[firstKey] && room.moves[firstKey][pid] !== undefined) return;

    // Her kategori için cevabı kaydet
    CATEGORIES.forEach((cat) => {
      const moveKey = currentPair.id + "_" + cat;
      if (!room.moves[moveKey]) room.moves[moveKey] = {};
      let cleanWord = answers[cat] ? sanitizeString(answers[cat], 30).toLocaleUpperCase("tr-TR") : "⏰";
      if (cleanWord === "") cleanWord = "⏰";
      room.moves[moveKey][pid] = cleanWord;
    });

    const partnerId =
      pid === currentPair.p1.id ? currentPair.p2.id : currentPair.p1.id;
    io.to(getSocketId(partnerId)).emit("partnerSubmitted");

    // İki oyuncu da gönderdiyse karşılaştır
    const firstCatKey = currentPair.id + "_" + CATEGORIES[0];
    const w1 = room.moves[firstCatKey][currentPair.p1.id];
    const w2 = room.moves[firstCatKey][currentPair.p2.id];
    console.log(`[IS] Check both submitted: w1=${w1}, w2=${w2}`);

    if (w1 !== undefined && w2 !== undefined) {
      // Clear server-side timeout since both submitted
      if (room.isimSehirTimer) { clearTimeout(room.isimSehirTimer); room.isimSehirTimer = null; }

      // Tüm kategorileri karşılaştır
      const allResults = [];
      let matchCount = 0;

      CATEGORIES.forEach((cat) => {
        const moveKey = currentPair.id + "_" + cat;
        const p1w = room.moves[moveKey][currentPair.p1.id];
        const p2w = room.moves[moveKey][currentPair.p2.id];
        const isMatch = p1w === p2w && p1w !== "⏰";

        if (isMatch) {
          room.isimSehirScores[currentPair.id]++;
          matchCount++;
        }

        const bothFailed = p1w === "⏰" && p2w === "⏰";
        const example =
          bothFailed && EXAMPLES[room.currentLetter]
            ? EXAMPLES[room.currentLetter][cat]
            : null;

        allResults.push({
          pairId: currentPair.id,
          p1Word: p1w,
          p2Word: p2w,
          match: isMatch,
          category: cat,
          example: example,
        });
      });

      updateIsimSehirLeaderboard(roomId);

      if (matchCount > 0) {
        io.to(getSocketId(currentPair.p1.id))
          .to(getSocketId(currentPair.p2.id))
          .emit("levelFinished", { success: true });
      }

      // Tüm kategorilerin sonucunu toplu gönder
      room.categoryIndex = CATEGORIES.length - 1; // Son kategoriye atla
      console.log(`[IS] Both submitted! Results:`, allResults.map(r => `${r.category}: ${r.p1Word} vs ${r.p2Word} = ${r.match}`));
      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        console.log(`[IS] Emitting isimSehirAllResults to room ${roomId}`);
        io.to(roomId).emit("isimSehirAllResults", {
          results: allResults,
          p1: currentPair.p1,
          p2: currentPair.p2,
        });
        // Animasyon süresi: sonuç başına 2.8sn + 0.5sn buffer
        const animDelay = allResults.length * 2800 + 500;
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          nextIsimSehirStep(roomId);
        }, animDelay);
      }, 500);
    }
  });

  // --- PICTIONARY: DRAW DATA ---
  socket.on("drawData", (data) => {
    const room = getValidRoom(data.roomId);
    // Bug 4 fix: reject drawData if game is not actively playing
    if (!room || room.gameType !== "pictionary" || room.gameStatus !== "playing") return;
    // Relay to everyone else in room
    socket.to(data.roomId).emit("drawData", data);
  });

  // --- PICTIONARY: GUESS ---
  socket.on("pictionaryGuess", ({ roomId, guess }) => {
    const room = getValidRoom(roomId);
    if (
      !room ||
      room.gameStatus !== "playing" ||
      room.gameType !== "pictionary"
    )
      return;

    const cleanGuess = sanitizeString(guess, 50).toLocaleUpperCase("tr-TR");
    if (!cleanGuess) return;

    const word = room._currentPictionaryWord;
    if (!word) return;

    const pid = socket.userId;

    if (room.gameMode === "tek") {
      // TEK MOD: bireysel tahmin
      const player = room.soloPlayers.find((p) => p.id === pid);
      if (!player) return;

      const drawerIndex = room.currentDrawerIndex % room.soloPlayers.length;
      const drawer = room.soloPlayers[drawerIndex];
      if (pid === drawer.id) return;

      if (room.pictionaryGuessOrder.includes(pid)) return;

      if (cleanGuess === word) {
        room.pictionaryGuessOrder.push(pid);
        const order = room.pictionaryGuessOrder.length;
        const guesserCount = room.soloPlayers.length - 1;
        const points = guesserCount - order + 1;

        room.pictionaryScores[pid] =
          (room.pictionaryScores[pid] || 0) + points;
        room.pictionaryScores[drawer.id] =
          (room.pictionaryScores[drawer.id] || 0) + 1;
        updatePictionaryLeaderboard(roomId);

        io.to(roomId).emit("pictionaryCorrect", {
          teamName: player.username,
          guesserId: pid,
          points: points,
          order: order,
          word: word,
          gameMode: "tek",
        });

        if (room.pictionaryGuessOrder.length >= room.soloPlayers.length - 1) {
          endPictionaryRound(roomId);
        }
      } else {
        io.to(roomId).emit("pictionaryWrongGuess", {
          guess: cleanGuess,
          guesserName: player.username,
        });
      }
    } else {
      // ÇİFT MOD
      const pair = room.pairs.find(
        (p) => p.p1.id === pid || p.p2.id === pid,
      );
      if (!pair) return;

      if (room.pictionaryGuessOrder.includes(pair.id)) return;

      const drawerIsP1 = room.pictionaryDrawerToggle % 2 === 0;
      const drawerId = drawerIsP1 ? pair.p1.id : pair.p2.id;
      if (pid === drawerId) return;

      if (cleanGuess === word) {
        room.pictionaryGuessOrder.push(pair.id);
        const order = room.pictionaryGuessOrder.length;
        const pairCount = room.pairs.length;
        const points = pairCount - order + 1;

        room.pictionaryScores[pair.id] =
          (room.pictionaryScores[pair.id] || 0) + points;
        updatePictionaryLeaderboard(roomId);

        io.to(roomId).emit("pictionaryCorrect", {
          teamName: pair.teamName,
          points: points,
          order: order,
          word: word,
        });

        if (room.pictionaryGuessOrder.length >= room.pairs.length) {
          endPictionaryRound(roomId);
        }
      } else {
        const guesserName =
          pid === pair.p1.id ? pair.p1.username : pair.p2.username;
        io.to(roomId).emit("pictionaryWrongGuess", {
          guess: cleanGuess,
          guesserName,
        });
      }
    }
  });

  // --- TABU: DOĞRU (anlatıcı tıklar) ---
  socket.on("tabuCorrect", ({ roomId }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = socket.userId;
    if (pid !== room.tabuDescriberId) return;
    if (!room.tabuCurrentWord) return;

    const pair = room.pairs[room.currentPairIndex];
    room.tabuScores[pair.id] = (room.tabuScores[pair.id] || 0) + 1;
    updateTabuLeaderboard(roomId);

    io.to(roomId).emit("tabuCorrect", {
      word: room.tabuCurrentWord.word,
      teamName: pair.teamName,
      score: room.tabuScores[pair.id],
    });

    setTimeout(() => { if (!rooms[roomId]) return; nextTabuWord(roomId); }, 700);
  });

  // --- TABU: YANLIŞ (kart atlanır, ceza yok) ---
  socket.on("tabuWrong", ({ roomId }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = socket.userId;
    if (pid !== room.tabuDescriberId) return;
    if (!room.tabuCurrentWord) return;

    io.to(roomId).emit("tabuWrong", {
      word: room.tabuCurrentWord.word,
    });

    nextTabuWord(roomId);
  });

  // --- TABU: PAS (anlatıcı, tur başına 3 hak) ---
  socket.on("tabuPass", ({ roomId }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = socket.userId;
    if (pid !== room.tabuDescriberId) return;
    if (!room.tabuCurrentWord) return;
    if ((room.tabuPassesLeft || 0) <= 0) return;

    room.tabuPassesLeft--;

    io.to(roomId).emit("tabuPassed", {
      word: room.tabuCurrentWord.word,
      passesLeft: room.tabuPassesLeft,
    });

    nextTabuWord(roomId);
  });

  // --- IMPOSTER: KELİME GÖNDERME ---
  socket.on("submitImposterWord", ({ roomId, word }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "write1" && room.imposterPhase !== "write2")
      return;

    const pid = socket.userId;
    const player = room.players ? room.players.find((p) => p.id === pid) : null;
    if (!player) return;

    // Bug 13 fix: defensive initialization of imposter state
    room.imposterSubmissions1 = room.imposterSubmissions1 || {};
    room.imposterSubmissions2 = room.imposterSubmissions2 || {};

    const subs =
      room.imposterPhase === "write1"
        ? room.imposterSubmissions1
        : room.imposterSubmissions2;
    if (subs[pid]) return;

    let cleanWord = sanitizeString(word, 30).toLocaleUpperCase("tr-TR") || "⏰";
    if (cleanWord === "") cleanWord = "⏰";

    subs[pid] = cleanWord;

    io.to(roomId).emit("imposterPlayerSubmitted", {
      username: player.username,
      playerId: pid,
      phase: room.imposterPhase,
    });

    const activePlayers = room.players.filter(p => !p.disconnected).length;
    if (Object.keys(subs).length >= activePlayers) {
      endImposterPhase(roomId);
    }
  });

  // --- IMPOSTER: OY VERME ---
  socket.on("submitImposterVote", ({ roomId, votedPlayerId }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "vote") return;

    const pid = socket.userId;
    const player = room.players ? room.players.find((p) => p.id === pid) : null;
    if (!player) return;
    // Bug 13 fix: defensive initialization of imposterVotes
    room.imposterVotes = room.imposterVotes || {};
    if (room.imposterVotes[pid]) return;
    if (pid === votedPlayerId) return;
    // Validate voted player exists in room
    if (!room.players.some(p => p.id === votedPlayerId)) return;

    room.imposterVotes[pid] = votedPlayerId;

    io.to(roomId).emit("imposterPlayerVoted", {
      username: player.username,
      playerId: pid,
    });

    const activeVoters = room.players.filter(p => !p.disconnected).length;
    if (Object.keys(room.imposterVotes).length >= activeVoters) {
      endImposterVoting(roomId);
    }
  });

  // --- SAYI TAHMİN: GİZLİ SAYI GÖNDERME ---
  socket.on("submitSecretNumber", ({ roomId, number, passPlayActingAs }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;
    let pid = socket.userId;
    // Pass & Play: same socket can submit as P2
    if (room.passPlay && passPlayActingAs && passPlayActingAs === currentPair.p2.id && socket.id === currentPair.p2.socketId) {
      pid = passPlayActingAs;
    }
    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id) return;

    // Validate: N digits (dynamic)
    const dc = room.sayiTahminDigitCount || 4;
    const str = String(number);
    const digitRegex = new RegExp(`^\\d{${dc}}$`);
    if (str.length !== dc || !digitRegex.test(str)) {
      socket.emit("sayiTahminError", `${dc} haneli bir sayı girin!`);
      return;
    }
    // Tüm rakamlar aynı olamaz (1111, 2222 vb.)
    if (new Set(str.split("")).size === 1) {
      socket.emit("sayiTahminError", `Tüm rakamlar aynı olamaz!`);
      return;
    }

    const pairKey = currentPair.id;
    if (!room.sayiTahminSecrets[pairKey]) room.sayiTahminSecrets[pairKey] = {};
    room.sayiTahminSecrets[pairKey][pid] = str;

    const partnerId = pid === currentPair.p1.id ? currentPair.p2.id : currentPair.p1.id;
    io.to(getSocketId(partnerId)).emit("partnerSecretSubmitted");
    socket.emit("secretSubmitted");

    // Both submitted?
    const s1 = room.sayiTahminSecrets[pairKey][currentPair.p1.id];
    const s2 = room.sayiTahminSecrets[pairKey][currentPair.p2.id];
    if (s1 && s2) {
      // İkisi de girdi - eşzamanlı tahmin fazı başlasın
      if (room.sayiTahminTimer) { clearTimeout(room.sayiTahminTimer); room.sayiTahminTimer = null; }
      room.sayiTahminGuesses[pairKey] = { p1: [], p2: [] };
      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        startSayiTahminGuessPhase(roomId);
      }, 1000);
    }
  });

  // --- SAYI TAHMİN: TAHMİN GÖNDERME (senkronize round - ikisi de gönderince sonuçlar açılır) ---
  socket.on("submitNumberGuess", ({ roomId, guess, passPlayActingAs }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    let pid = socket.userId;
    // Pass & Play: same socket can submit as P2
    if (room.passPlay && passPlayActingAs && passPlayActingAs === currentPair.p2.id && socket.id === currentPair.p2.socketId) {
      pid = passPlayActingAs;
    }
    const isP1 = pid === currentPair.p1.id;
    const isP2 = pid === currentPair.p2.id;
    if (!isP1 && !isP2) return;

    const pairKey = currentPair.id;

    // Pending guesses objesi yoksa oluştur
    if (!room.sayiTahminPendingGuesses) room.sayiTahminPendingGuesses = {};
    if (!room.sayiTahminPendingGuesses[pairKey]) room.sayiTahminPendingGuesses[pairKey] = {};

    const who = isP1 ? "p1" : "p2";

    // Bu oyuncu zaten bu round'da tahmin gönderdiyse kabul etme
    if (room.sayiTahminPendingGuesses[pairKey][who]) {
      socket.emit("sayiTahminError", serverT('wait_opponent', socket.lang));
      return;
    }

    // Validate guess (dynamic digit count)
    const dc = room.sayiTahminDigitCount || 4;
    const str = String(guess);
    const digitRegex = new RegExp(`^\\d{${dc}}$`);
    if (str.length !== dc || !digitRegex.test(str)) {
      socket.emit("sayiTahminError", `${dc} haneli bir sayı girin!`);
      return;
    }
    if (new Set(str.split("")).size === 1) {
      socket.emit("sayiTahminError", `Tüm rakamlar aynı olamaz!`);
      return;
    }

    const targetSecret = isP1
      ? room.sayiTahminSecrets[pairKey][currentPair.p2.id]
      : room.sayiTahminSecrets[pairKey][currentPair.p1.id];

    // Calculate per-digit result
    const targetDigits = targetSecret.split("");
    const guessDigits = str.split("");
    const digitResults = [];
    let greens = 0;

    for (let i = 0; i < dc; i++) {
      const isGreen = guessDigits[i] === targetDigits[i];
      digitResults.push(isGreen);
      if (isGreen) greens++;
    }

    const guesserName = isP1 ? currentPair.p1.username : currentPair.p2.username;
    room.sayiTahminGuesses[pairKey][who].push({ guess: str, greens, digitResults });

    // Pending'e kaydet
    room.sayiTahminPendingGuesses[pairKey][who] = {
      who: who,
      guesserId: pid,
      guesserName: guesserName,
      guess: str,
      greens: greens,
      digitResults: digitResults,
      digitCount: dc,
      guessCount: room.sayiTahminGuesses[pairKey][who].length,
    };

    // Gönderen oyuncuya "bekleniyor" bildir
    socket.emit("sayiTahminGuessWaiting");

    // Partner'a da bildir ki "rakip gönderdi" bilsin
    const partnerId = isP1 ? currentPair.p2.id : currentPair.p1.id;
    const partnerSocketId = getSocketId(partnerId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("sayiTahminPartnerGuessed");
    }

    // İkisi de gönderdiyse sonuçları aç
    const pending = room.sayiTahminPendingGuesses[pairKey];
    if (pending.p1 && pending.p2) {
      if (room.sayiTahminTimer) { clearTimeout(room.sayiTahminTimer); room.sayiTahminTimer = null; }
      resolveSayiTahminGuessRound(roomId);
    }
  });

  // --- ODA AYARLARINI GÜNCELLE (oyun bitince tekrar seçim) ---
  // --- ODADAN AYRILMA ---
  socket.on("leaveRoom", (roomId, ack) => {
    if (typeof roomId === 'string') roomId = roomId.toUpperCase().trim();
    const room = getValidRoom(roomId);
    if (!room) {
      if (typeof ack === 'function') ack(false);
      return;
    }
    const pid = socket.userId;
    socket.leave(roomId);
    removePlayerFromRoom(roomId, pid);
    if (typeof ack === 'function') ack(true);
  });

  // --- ODA AYARLARINI GÜNCELLE (oyun bitince tekrar seçim) ---
  socket.on("updateRoom", (data) => {
    const room = getValidRoom(data.roomId);
    if (!room || room.gameStatus !== "waiting") return socket.emit("gameError", serverT('room_not_found', socket.lang));
    const pid = socket.userId;
    if (!isPlayerHost(room, pid)) {
      socket.emit("gameError", serverT('only_host_settings', socket.lang));
      return;
    }

    const nextGameType = VALID_GAME_TYPES.includes(data.gameType) ? data.gameType : room.gameType;
    if (!isGameSupportedForMode(nextGameType, room.gameMode)) {
      socket.emit("gameError", serverT('tek_pictionary', socket.lang));
      return;
    }

    room.gameType = nextGameType;
    room.roundCount = Math.min(Math.max(parseInt(data.roundCount) || 5, 1), 20);
    room.roundTime = Math.min(Math.max(parseInt(data.roundTime) || 10, 5), 120);
    if (data.digitCount) room.sayiTahminDigitCount = Math.min(Math.max(parseInt(data.digitCount) || 4, 3), 6);
    if (data.targetScore) room.bilBakalimTargetScore = Math.min(Math.max(parseInt(data.targetScore) || 10, 5), 20);

    io.to(data.roomId).emit("joinedRoom", data.roomId);
    emitLobbyUpdate(data.roomId);
  });

  // --- REJOIN (reconnection) ---
  socket.on("rejoinRoom", ({ roomId }) => {
    const pid = socket.userId;
    const room = getValidRoom(roomId);
    if (!room) {
      socket.emit("rejoinFailed");
      return;
    }
    const player = findPlayerInRoom(room, pid);
    // Bug 16 fix: ensure the player was actually disconnected from this room (not a new joiner exploiting rejoin)
    if (!player || player.disconnected !== true) {
      socket.emit("rejoinFailed");
      return;
    }
    // Reconnect
    player.disconnected = false;
    player.disconnectedAt = null;
    player.socketId = socket.id;
    playerSockets[pid] = socket.id;

    socket.join(roomId);
    socket.emit("rejoinSuccess", {
      roomId,
      gameStatus: room.gameStatus,
      gameType: room.gameType,
      currentRound: room.currentRound,
      roundCount: room.roundCount,
      roundTime: room.roundTime,
    });
    io.to(roomId).emit("playerReconnected", { playerId: pid, username: player.username });
    emitLobbyUpdate(roomId);
  });

  // --- BİL BAKALIM: CEVAP ---
  socket.on("bilBakalimAnswer", ({ roomId, answer }) => {
    const room = getValidRoom(roomId);
    if (!room || room.gameStatus !== 'playing' || room.gameType !== 'bilBakalim') return;
    const pid = socket.userId;
    const parsed = parseFloat(answer);
    if (isNaN(parsed)) return;
    // Sadece bir kez cevap verilebilir
    if (room.bilBakalimAnswers[pid] !== undefined) return;
    room.bilBakalimAnswers[pid] = parsed;
    room.lastActivity = Date.now();

    // Kaç oyuncu cevap verdi bildir
    io.to(roomId).emit("bilBakalimAnswerReceived", { playerId: pid });

    // Tüm oyuncular cevap verdiyse bitir
    const allPlayerIds = room.pairs.flatMap(p => [p.p1.id, p.p2.id]);
    const answeredCount = allPlayerIds.filter(id => room.bilBakalimAnswers[id] !== undefined).length;
    if (answeredCount >= allPlayerIds.length) {
      if (room.bilBakalimTimer) { clearTimeout(room.bilBakalimTimer); room.bilBakalimTimer = null; }
      endBilBakalimQuestion(roomId);
    }
  });

  // ============ EMOJİ TEPKİLERİ ============
  socket.on("sendReaction", ({ roomId, emoji }) => {
    if (!roomId || !emoji || !rooms[roomId]) return;
    const pid = socket.userId;
    // Find username
    const room = rooms[roomId];
    let username = '';
    if (room.gameMode === 'tek') {
      const p = room.players.find(pl => pl.id === pid);
      if (p) username = p.username;
    } else {
      for (const t of room.teams) {
        if (t.p1 && t.p1.id === pid) { username = t.p1.username; break; }
        if (t.p2 && t.p2.id === pid) { username = t.p2.username; break; }
      }
      if (!username) {
        const sp = room.spectators.find(s => s.id === pid);
        if (sp) username = sp.username;
      }
    }
    // Broadcast to room (except sender)
    socket.to(roomId).emit("reactionReceived", { emoji, username, senderId: pid });
  });

  // ============ BAĞLANTI KOPMA ============

  socket.on("disconnect", () => {
    const pid = socket.userId;

    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      const player = findPlayerInRoom(room, pid);
      if (!player) continue;

      // Grace period: 30sn içinde geri bağlanabilir
      player.disconnected = true;
      player.disconnectedAt = Date.now();
      io.to(roomId).emit("playerDisconnected", { playerId: pid, username: player.username });

      // Imposter aktif fazında: disconnect olan oyuncu quorum'u düşürür,
      // kalan submission/vote sayısı yeni eşiğe ulaştıysa fazı sonlandır
      if (room.gameType === "imposter" && room.gameStatus === "playing") {
        const activeCount = room.players.filter(p => !p.disconnected).length;
        if (room.imposterPhase === "write1" || room.imposterPhase === "write2") {
          const subs = room.imposterPhase === "write1"
            ? room.imposterSubmissions1 : room.imposterSubmissions2;
          if (subs && Object.keys(subs).length >= activeCount && activeCount > 0) {
            endImposterPhase(roomId);
          }
        } else if (room.imposterPhase === "vote") {
          if (room.imposterVotes && Object.keys(room.imposterVotes).length >= activeCount && activeCount > 0) {
            endImposterVoting(roomId);
          }
        }
      }

      setTimeout(() => {
        // Bug 3 & 7 fix: check room still exists and player result is non-null
        const r = rooms[roomId];
        if (!r) return;
        const p = findPlayerInRoom(r, pid);
        if (p && p.disconnected) {
          removePlayerFromRoom(roomId, pid);
        }
      }, 30000);
    }
    if (pid) delete playerSockets[pid];
  });
});

// ============ HELPER FONKSİYONLARI ============

function findPlayerInRoom(room, pid) {
  if (!room) return null;
  if (room.gameMode === 'tek') {
    return room.players.find(p => p.id === pid) || room.spectators.find(p => p.id === pid) || null;
  }
  for (const t of room.teams) {
    if (t.p1 && t.p1.id === pid) return t.p1;
    if (t.p2 && t.p2.id === pid) return t.p2;
  }
  return room.spectators.find(p => p.id === pid) || null;
}

function findRoomIdByPlayer(pid) {
  if (!pid) return null;
  for (const roomId of Object.keys(rooms)) {
    if (findPlayerInRoom(rooms[roomId], pid)) return roomId;
  }
  return null;
}

function clearAllRoomTimers(room) {
  if (room.pictionaryTimer) { clearTimeout(room.pictionaryTimer); room.pictionaryTimer = null; }
  if (room.tabuTimer) { clearTimeout(room.tabuTimer); room.tabuTimer = null; }
  if (room.imposterTimer) { clearTimeout(room.imposterTimer); room.imposterTimer = null; }
  if (room.isimSehirTimer) { clearTimeout(room.isimSehirTimer); room.isimSehirTimer = null; }
  if (room.sayiTahminTimer) { clearTimeout(room.sayiTahminTimer); room.sayiTahminTimer = null; }
  if (room.telepatiTimer) { clearTimeout(room.telepatiTimer); room.telepatiTimer = null; }
  if (room.bilBakalimTimer) { clearTimeout(room.bilBakalimTimer); room.bilBakalimTimer = null; }
}

// ============ BİL BAKALIM HELPER'LARI ============

function startBilBakalimQuestion(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== 'playing') return;

  // Kullanılmamış soru seç
  const available = BIL_BAKALIM_QUESTIONS.map((_, i) => i)
    .filter(i => !room.bilBakalimUsedQIndices.includes(i));

  if (available.length === 0) {
    // Tüm sorular bitti, game over
    endBilBakalimGame(roomId, 'questions_exhausted');
    return;
  }

  const qIndex = available[Math.floor(Math.random() * available.length)];
  room.bilBakalimUsedQIndices.push(qIndex);
  room.bilBakalimCurrentQ = { ...BIL_BAKALIM_QUESTIONS[qIndex], index: qIndex };
  room.bilBakalimAnswers = {};

  const roundTime = room.roundTime || 20;

  io.to(roomId).emit("bilBakalimQuestion", {
    question: room.bilBakalimCurrentQ.q,
    unit: room.bilBakalimCurrentQ.unit,
    roundTime: roundTime,
    questionNo: room.bilBakalimUsedQIndices.length,
    scores: room.bilBakalimScores,
  });

  // Süre dolunca bitir
  room.bilBakalimTimer = setTimeout(() => endBilBakalimQuestion(roomId), roundTime * 1000);
}

function endBilBakalimQuestion(roomId) {
  const room = rooms[roomId];
  if (!room || !room.bilBakalimCurrentQ) return;
  if (room.bilBakalimTimer) { clearTimeout(room.bilBakalimTimer); room.bilBakalimTimer = null; }

  const correctAnswer = room.bilBakalimCurrentQ.a;
  const answers = room.bilBakalimAnswers;
  const pairs = room.pairs;

  // Her cinsiyet için kazananı bul
  const roundWinners = {}; // pairId → points earned this round
  pairs.forEach(p => { roundWinners[p.id] = 0; });

  const genders = ['male', 'female'];
  const genderResults = {};

  genders.forEach(gender => {
    // Her pair'den bu cinsiyetteki oyuncuyu bul
    const contestants = pairs.map(pair => {
      const player = pair.p1.gender === gender ? pair.p1 : (pair.p2.gender === gender ? pair.p2 : null);
      if (!player) return null;
      const ans = answers[player.id];
      return {
        pairId: pair.id,
        playerId: player.id,
        username: player.username,
        answer: ans !== undefined ? ans : null,
        diff: ans !== undefined ? Math.abs(ans - correctAnswer) : Infinity,
      };
    }).filter(Boolean);

    if (contestants.length < 2) return; // tek çift varsa yarışma yok, puan yok

    // En yakın farkı bul
    const minDiff = Math.min(...contestants.map(c => c.diff));

    if (minDiff === Infinity) {
      // Kimse cevap vermedi
      genderResults[gender] = { contestants, winners: [], tied: false };
      return;
    }

    const winners = contestants.filter(c => c.diff === minDiff);
    winners.forEach(w => { roundWinners[w.pairId] = (roundWinners[w.pairId] || 0) + 1; });
    genderResults[gender] = { contestants, winners: winners.map(w => w.pairId), tied: winners.length > 1 };
  });

  // Puanları güncelle
  pairs.forEach(p => {
    room.bilBakalimScores[p.id] = (room.bilBakalimScores[p.id] || 0) + (roundWinners[p.id] || 0);
  });

  // Sonucu gönder
  io.to(roomId).emit("bilBakalimResult", {
    correctAnswer: correctAnswer,
    unit: room.bilBakalimCurrentQ.unit,
    answers: answers,
    genderResults: genderResults,
    roundWinners: roundWinners,
    scores: room.bilBakalimScores,
    targetScore: room.bilBakalimTargetScore,
  });

  // Hedef puana ulaşıldı mı?
  const targetReached = pairs.some(p => (room.bilBakalimScores[p.id] || 0) >= room.bilBakalimTargetScore);
  if (targetReached) {
    setTimeout(() => { if (!rooms[roomId]) return; endBilBakalimGame(roomId, 'target_reached'); }, 4000); // Bug 3 fix
  } else {
    setTimeout(() => { if (!rooms[roomId]) return; startBilBakalimQuestion(roomId); }, 5000); // Bug 3 fix
  }
}

function endBilBakalimGame(roomId, reason) {
  const room = rooms[roomId];
  if (!room) return;
  room.gameStatus = 'waiting';

  const sorted = [...room.pairs].sort((a, b) =>
    (room.bilBakalimScores[b.id] || 0) - (room.bilBakalimScores[a.id] || 0)
  );

  io.to(roomId).emit("bilBakalimEnd", {
    reason: reason,
    scores: room.bilBakalimScores,
    winner: sorted[0] ? sorted[0].id : null,
    ranking: sorted.map(p => ({
      pairId: p.id,
      teamName: p.teamName,
      score: room.bilBakalimScores[p.id] || 0,
    })),
  });
}

function isRoomEmpty(room) {
  const hasTeamPlayers = room.teams && room.teams.some(t => t.p1 || t.p2);
  const hasSoloPlayers = room.players && room.players.length > 0;
  const hasSpectators = room.spectators && room.spectators.length > 0;
  return !hasTeamPlayers && !hasSoloPlayers && !hasSpectators;
}

function findNextHost(room) {
  if (room.gameMode === 'tek') {
    return room.players.find(p => !p.disconnected) || null;
  }
  for (const t of room.teams) {
    if (t.p1 && !t.p1.disconnected) return t.p1;
    if (t.p2 && !t.p2.disconnected) return t.p2;
  }
  return room.spectators.find(p => !p.disconnected) || null;
}

function isPlayerHost(room, pid) {
  if (room.gameMode === 'tek') {
    return room.players.some(p => p.id === pid && p.isHost);
  }
  for (const t of room.teams) {
    if (t.p1 && t.p1.id === pid && t.p1.isHost) return true;
    if (t.p2 && t.p2.id === pid && t.p2.isHost) return true;
  }
  return false;
}

function removePlayerFromRoom(roomId, pid) {
  const room = rooms[roomId];
  if (!room) return;

  const wasHost = isPlayerHost(room, pid);

  // Remove from wherever they are
  if (room.gameMode === 'tek') {
    room.players = room.players.filter(p => p.id !== pid);
    if (room.soloPlayers) {
      room.soloPlayers = room.soloPlayers.filter(p => p.id !== pid);
    }
  } else {
    room.teams.forEach(t => {
      if (t.p1 && t.p1.id === pid) t.p1 = null;
      if (t.p2 && t.p2.id === pid) t.p2 = null;
    });
  }
  room.spectators = room.spectators.filter(p => p.id !== pid);

  // Check if room is empty
  if (isRoomEmpty(room)) {
    clearAllRoomTimers(room);
    // Bug 15 fix: clean up playerSockets for all players in the room
    _cleanupRoomPlayerSockets(room);
    delete rooms[roomId];
    console.log(`Oda silindi (boş): ${roomId}`);
    return;
  }

  // Host left -> transfer host
  if (wasHost) {
    const newHost = findNextHost(room);
    if (newHost) {
      newHost.isHost = true;
      io.to(roomId).emit("hostChanged", {
        newHostId: newHost.id,
        newHostName: newHost.username,
      });
      console.log(`Host transfer: ${roomId} -> ${newHost.username}`);
    } else {
      // No eligible host, destroy room
      clearAllRoomTimers(room);
      _cleanupRoomPlayerSockets(room); // Bug 15 fix
      io.to(roomId).emit("hostLeft");
      delete rooms[roomId];
      console.log(`Oda silindi (host yok): ${roomId}`);
      return;
    }
  }

  emitLobbyUpdate(roomId);
}

// Bug 15 fix: helper to remove all room player entries from playerSockets map
function _cleanupRoomPlayerSockets(room) {
  if (!room) return;
  if (room.gameMode === 'tek') {
    (room.players || []).forEach(p => { if (p && p.id) delete playerSockets[p.id]; });
  } else {
    (room.teams || []).forEach(t => {
      if (t.p1 && t.p1.id) delete playerSockets[t.p1.id];
      if (t.p2 && t.p2.id) delete playerSockets[t.p2.id];
    });
  }
  (room.spectators || []).forEach(p => { if (p && p.id) delete playerSockets[p.id]; });
}

// ============ TELEPATİ FONKSİYONLARI ============

function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  // Bug 2 fix: guard against empty pairs
  if (!room.pairs || room.pairs.length === 0) return;

  // Bug 9 fix: capture roundCount snapshot before loop to avoid stale value
  const totalRoundsSnapshot = room.roundCount;
  // İteratif olarak sıradaki elenmeyen çifti bul
  const maxIterations = room.pairs.length * (totalRoundsSnapshot + 1);
  for (let i = 0; i < maxIterations; i++) {
    room.currentPairIndex++;

    if (room.currentPairIndex >= room.pairs.length) {
      room.currentPairIndex = 0;
      room.currentRound++;

      if (room.currentRound > totalRoundsSnapshot) {
        // En az hata yapan takım kazanır
        const sorted = [...room.pairs].sort(
          (a, b) => a.totalAttempts - b.totalAttempts,
        );
        const winner = sorted[0];
        const winnerIds = [winner.p1.id, winner.p2.id];
        io.to(roomId).emit("telepatiGameOver", {
          winnerTeam: winner.teamName,
          winnerP1: winner.p1.username,
          winnerP2: winner.p2.username,
          winnerIds: winnerIds,
          winnerScore: winner.totalAttempts,
        });
        room.gameStatus = "finished";
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 7000);
        return;
      }

      io.to(roomId).emit("roundChanged", room.currentRound);
    }

    const nextP = room.pairs[room.currentPairIndex];
    if (nextP.isEliminated) {
      const alive = room.pairs.filter((p) => !p.isEliminated);
      if (alive.length === 0) {
        io.to(roomId).emit("gameOver", serverT('all_eliminated'));
        room.gameStatus = "finished";
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 5000);
        return;
      }
      if (alive.length === 1) {
        const winner = alive[0];
        const winnerIds = [winner.p1.id, winner.p2.id];
        io.to(roomId).emit("telepatiGameOver", {
          winnerTeam: winner.teamName,
          winnerP1: winner.p1.username,
          winnerP2: winner.p2.username,
          winnerIds: winnerIds,
          winnerScore: winner.totalAttempts,
          lastStanding: true,
        });
        room.gameStatus = "finished";
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 7000);
        return;
      }
      continue;
    }

    setTimeout(() => { if (!rooms[roomId]) return; startTurn(roomId); }, 1500); // Bug 3 fix
    return;
  }
}

function startTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  if (!room.pairs || room.pairs.length === 0) return; // Bug 2 fix
  const p = room.pairs[room.currentPairIndex];
  if (!p) return; // Bug 2 fix

  room.scoreLocked = false; // Bug 14 fix: reset lock for new turn
  p.currentTurnAttempts = 0;
  room.moves[p.id] = {};

  io.to(roomId).emit("turnStarted", {
    p1: p.p1,
    p2: p.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    totalMistakes: p.totalAttempts || 0,
  });

  // Server-side timeout: auto-submit for players who don't respond
  if (room.telepatiTimer) clearTimeout(room.telepatiTimer);
  room.telepatiTimer = setTimeout(() => {
    // Bug 3 fix: check room still exists via rooms map
    const r = rooms[roomId];
    if (!r || r.gameStatus !== "playing") return;
    const currentPair = r.pairs ? r.pairs[r.currentPairIndex] : null;
    if (!currentPair) return;
    if (!r.moves[currentPair.id]) r.moves[currentPair.id] = {};
    if (r.moves[currentPair.id][currentPair.p1.id] === undefined) r.moves[currentPair.id][currentPair.p1.id] = "⏰";
    if (r.moves[currentPair.id][currentPair.p2.id] === undefined) r.moves[currentPair.id][currentPair.p2.id] = "⏰";
    // Trigger result processing
    const w1 = r.moves[currentPair.id][currentPair.p1.id];
    const w2 = r.moves[currentPair.id][currentPair.p2.id];
    currentPair.currentTurnAttempts++;
    currentPair.totalAttempts++;
    updateLeaderboard(roomId);
    const result = { pairId: currentPair.id, p1Word: w1, p2Word: w2, attempts: currentPair.currentTurnAttempts, totalMistakes: currentPair.totalAttempts, match: false };

    // Elenme kontrolü
    if (currentPair.totalAttempts >= 20 && !currentPair.isEliminated) {
      currentPair.isEliminated = true;
      io.to(roomId).emit("spectatorUpdate", result);
      io.to(roomId).emit("gameOver", currentPair.teamName + " " + serverT('eliminated'));
      const alive = r.pairs.filter((p) => !p.isEliminated);
      if (alive.length > 1) {
        setTimeout(() => { if (!rooms[roomId]) return; nextTurn(roomId); }, 2000); // Bug 3 fix
      } else if (alive.length === 1) {
        const winner = alive[0];
        const winnerIds = [winner.p1.id, winner.p2.id];
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          io.to(roomId).emit("telepatiGameOver", {
            winnerTeam: winner.teamName, winnerP1: winner.p1.username, winnerP2: winner.p2.username,
            winnerIds: winnerIds, winnerScore: winner.totalAttempts, lastStanding: true,
          });
          r.gameStatus = "finished";
          setTimeout(() => { if (!rooms[roomId]) return; r.gameStatus = "waiting"; emitBackToSelect(roomId); }, 7000);
        }, 2000);
      } else {
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          io.to(roomId).emit("gameOver", serverT('all_eliminated'));
          r.gameStatus = "finished";
          setTimeout(() => { if (!rooms[roomId]) return; r.gameStatus = "waiting"; emitBackToSelect(roomId); }, 5000);
        }, 2000);
      }
      return;
    }

    io.to(roomId).emit("spectatorUpdate", result);
    r.moves[currentPair.id] = {};
  }, (room.roundTime + 3) * 1000);
}

function updateLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room || !room.pairs || room.pairs.length === 0) return; // Bug L1 fix

  const sorted = [...room.pairs].sort(
    (a, b) => a.totalAttempts - b.totalAttempts,
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: p.totalAttempts,
    eliminated: p.isEliminated,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ İSİM ŞEHİR FONKSİYONLARI ============

function startIsimSehirRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Pick a random unused letter
  const available = TURKISH_LETTERS.filter(
    (l) => !room.usedLetters.includes(l),
  );
  if (available.length === 0) {
    room.usedLetters = [];
    available.push(...TURKISH_LETTERS);
  }
  const letter = available[Math.floor(Math.random() * available.length)];
  room.usedLetters.push(letter);
  room.currentLetter = letter;
  room.categoryIndex = 0;
  room.currentPairIndex = 0;

  io.to(roomId).emit("letterSelected", {
    letter: letter,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
  });

  const pair = room.pairs[room.currentPairIndex];
  // Harf animasyonu sonrası 3 inputu birden aç
  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    io.to(roomId).emit("allCategoriesStart", {
      letter: letter,
      categories: CATEGORIES,
      p1: pair.p1,
      p2: pair.p2,
      currentRound: room.currentRound,
      totalRounds: room.roundCount,
    });
    // Server-side timeout: auto-submit for players who don't respond
    if (room.isimSehirTimer) clearTimeout(room.isimSehirTimer);
    room.isimSehirTimer = setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      autoSubmitIsimSehir(roomId);
    }, (room.roundTime + 3) * 1000);
  }, 3500);
}

function autoSubmitIsimSehir(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing" || room.gameType !== "isimSehir") return;
  const currentPair = room.pairs[room.currentPairIndex];
  if (!currentPair) return;

  // Auto-fill missing submissions with timeout marker
  CATEGORIES.forEach((cat) => {
    const moveKey = currentPair.id + "_" + cat;
    if (!room.moves[moveKey]) room.moves[moveKey] = {};
    if (room.moves[moveKey][currentPair.p1.id] === undefined) room.moves[moveKey][currentPair.p1.id] = "⏰";
    if (room.moves[moveKey][currentPair.p2.id] === undefined) room.moves[moveKey][currentPair.p2.id] = "⏰";
  });

  // Check if both already submitted (results already processed)
  const firstCatKey = currentPair.id + "_" + CATEGORIES[0];
  const w1 = room.moves[firstCatKey][currentPair.p1.id];
  const w2 = room.moves[firstCatKey][currentPair.p2.id];
  if (w1 !== undefined && w2 !== undefined) {
    // Trigger result processing if not already done
    const allResults = [];
    let matchCount = 0;
    CATEGORIES.forEach((cat) => {
      const moveKey = currentPair.id + "_" + cat;
      const p1w = room.moves[moveKey][currentPair.p1.id];
      const p2w = room.moves[moveKey][currentPair.p2.id];
      const isMatch = p1w === p2w && p1w !== "⏰";
      if (isMatch) { room.isimSehirScores[currentPair.id]++; matchCount++; }
      const bothFailed = p1w === "⏰" && p2w === "⏰";
      const example = bothFailed && EXAMPLES[room.currentLetter] ? EXAMPLES[room.currentLetter][cat] : null;
      allResults.push({ pairId: currentPair.id, p1Word: p1w, p2Word: p2w, match: isMatch, category: cat, example: example });
    });
    updateIsimSehirLeaderboard(roomId);
    if (matchCount > 0) {
      io.to(getSocketId(currentPair.p1.id)).to(getSocketId(currentPair.p2.id)).emit("levelFinished", { success: true });
    }
    room.categoryIndex = CATEGORIES.length - 1;
    io.to(roomId).emit("isimSehirAllResults", { results: allResults, p1: currentPair.p1, p2: currentPair.p2 });
    const animDelay = allResults.length * 2800 + 500;
    setTimeout(() => { if (!rooms[roomId]) return; nextIsimSehirStep(roomId); }, animDelay); // Bug 3 fix
  }
}

function startCategory(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const category = CATEGORIES[room.categoryIndex];
  room.currentCategory = category;
  const pair = room.pairs[room.currentPairIndex];

  const moveKey = pair.id + "_" + category;
  room.moves[moveKey] = {};

  io.to(roomId).emit("categoryStart", {
    category: category,
    letter: room.currentLetter,
    p1: pair.p1,
    p2: pair.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
  });
}

function nextIsimSehirStep(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Tüm kategoriler birden oynandı, sonraki pair'e geç
  room.categoryIndex = 0;
  room.currentPairIndex++;

  if (room.currentPairIndex < room.pairs.length) {
    // Yeni pair, tüm kategorileri birden başlat
    const pair = room.pairs[room.currentPairIndex];
    io.to(roomId).emit("allCategoriesStart", {
      letter: room.currentLetter,
      categories: CATEGORIES,
      p1: pair.p1,
      p2: pair.p2,
      currentRound: room.currentRound,
      totalRounds: room.roundCount,
    });
    // Server-side timeout for new pair
    if (room.isimSehirTimer) clearTimeout(room.isimSehirTimer);
    room.isimSehirTimer = setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      autoSubmitIsimSehir(roomId);
    }, (room.roundTime + 3) * 1000);
    return;
  }

  // All pairs done, next round (new letter)
  room.currentPairIndex = 0;
  room.currentRound++;

  if (room.currentRound > room.roundCount) {
    // Game over
    const sorted = [...room.pairs].sort(
      (a, b) => room.isimSehirScores[b.id] - room.isimSehirScores[a.id],
    );
    const winner = sorted[0];
    const winScore = room.isimSehirScores[winner.id];
    io.to(roomId).emit(
      "isimSehirGameOver",
      `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
    );
    room.gameStatus = "finished";
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      room.gameStatus = "waiting";
      emitBackToSelect(roomId);
    }, 5000);
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    startIsimSehirRound(roomId);
  }, 2000);
}

function updateIsimSehirLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room || !room.pairs || room.pairs.length === 0) return; // Bug L1 fix

  const sorted = [...room.pairs].sort(
    (a, b) =>
      (room.isimSehirScores[b.id] || 0) - (room.isimSehirScores[a.id] || 0),
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: room.isimSehirScores[p.id] || 0,
    eliminated: false,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ PICTIONARY FONKSİYONLARI ============

function startPictionaryRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room._pictionaryRoundEnding = false;

  // Pick unused word
  let available = PICTIONARY_WORDS.filter(
    (w) => !room.pictionaryUsedWords.includes(w),
  );
  if (available.length === 0) {
    room.pictionaryUsedWords = [];
    available = [...PICTIONARY_WORDS];
  }
  const word = available[Math.floor(Math.random() * available.length)];
  room.pictionaryUsedWords.push(word);
  room._currentPictionaryWord = word;
  room.pictionaryGuessOrder = [];

  if (room.gameMode === "tek") {
    // TEK MOD: bir kişi çizer, herkes tahmin eder
    const drawerIndex = room.currentDrawerIndex % room.soloPlayers.length;
    const drawer = room.soloPlayers[drawerIndex];

    const baseData = {
      round: room.currentRound,
      totalRounds: room.roundCount,
      drawerId: drawer.id,
      drawerName: drawer.username,
      gameMode: "tek",
    };

    io.to(getSocketId(drawer.id)).emit("pictionaryRound", { ...baseData, word: word });

    room.soloPlayers.forEach((p) => {
      if (p.id !== drawer.id) {
        io.to(getSocketId(p.id)).emit("pictionaryRound", {
          ...baseData,
          guesserId: p.id,
          guesserName: p.username,
        });
      }
    });

    room.spectators.forEach((s) => {
      io.to(getSocketId(s.id)).emit("pictionaryRound", { ...baseData });
    });
  } else {
    // ÇİFT MOD
    const drawerIsP1 = room.pictionaryDrawerToggle % 2 === 0;

    room.pairs.forEach((pair) => {
      const drawer = drawerIsP1 ? pair.p1 : pair.p2;
      const guesser = drawerIsP1 ? pair.p2 : pair.p1;

      const baseData = {
        round: room.currentRound,
        totalRounds: room.roundCount,
        drawerId: drawer.id,
        guesserId: guesser.id,
        drawerName: drawer.username,
        guesserName: guesser.username,
      };

      io.to(getSocketId(drawer.id)).emit("pictionaryRound", { ...baseData, word: word });
      io.to(getSocketId(guesser.id)).emit("pictionaryRound", { ...baseData });
    });

    const firstPair = room.pairs[0];
    const drawer0 = drawerIsP1 ? firstPair.p1 : firstPair.p2;
    const guesser0 = drawerIsP1 ? firstPair.p2 : firstPair.p1;
    room.spectators.forEach((s) => {
      io.to(getSocketId(s.id)).emit("pictionaryRound", {
        round: room.currentRound,
        totalRounds: room.roundCount,
        drawerId: drawer0.id,
        guesserId: guesser0.id,
        drawerName: drawer0.username,
        guesserName: guesser0.username,
      });
    });
  }

  // 45s timer
  if (room.pictionaryTimer) clearTimeout(room.pictionaryTimer);
  room.pictionaryTimer = setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    endPictionaryRound(roomId);
  }, 45000);
}

function endPictionaryRound(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  // Çift çağrı koruması
  if (room._pictionaryRoundEnding) return;
  room._pictionaryRoundEnding = true;

  if (room.pictionaryTimer) {
    clearTimeout(room.pictionaryTimer);
    room.pictionaryTimer = null;
  }

  io.to(roomId).emit("pictionaryRoundEnd", {
    word: room._currentPictionaryWord,
  });

  updatePictionaryLeaderboard(roomId);

  if (room.gameMode === "tek") {
    room.currentDrawerIndex++;
    // Tüm oyuncular çizdikten sonra tur artsın
    if (room.currentDrawerIndex % room.soloPlayers.length === 0) {
      room.currentRound++;
    }
  } else {
    room.pictionaryDrawerToggle++;
    // Her iki kişi de çizdikten sonra tur artsın
    if (room.pictionaryDrawerToggle % 2 === 0) {
      room.currentRound++;
    }
  }

  if (room.currentRound > room.roundCount) {
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      if (room.gameMode === "tek") {
        const sorted = [...room.soloPlayers].sort(
          (a, b) =>
            (room.pictionaryScores[b.id] || 0) -
            (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit(
          "pictionaryGameOver",
          `${winner.username} kazandı! (${winScore} puan) 🏆`,
        );
      } else {
        const sorted = [...room.pairs].sort(
          (a, b) =>
            (room.pictionaryScores[b.id] || 0) -
            (room.pictionaryScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.pictionaryScores[winner.id] || 0;
        io.to(roomId).emit(
          "pictionaryGameOver",
          `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
        );
      }
      room.gameStatus = "finished";
      // Oyun bittikten sonra lobiye dön
      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        room.gameStatus = "waiting";
        emitBackToSelect(roomId);
      }, 5000);
    }, 2500);
    return;
  }

  // Sadece tur gerçekten değiştiğinde göster
  const roundChanged = room.gameMode === "tek"
    ? (room.currentDrawerIndex % room.soloPlayers.length === 0)
    : (room.pictionaryDrawerToggle % 2 === 0);
  if (roundChanged) {
    io.to(roomId).emit("roundChanged", room.currentRound);
  }
  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    startPictionaryRound(roomId);
  }, 3000);
}

function updatePictionaryLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.gameMode === "tek") {
    const sorted = [...room.soloPlayers].sort(
      (a, b) =>
        (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
    );
    const scores = sorted.map((p, i) => ({
      rank: i + 1,
      name: p.username,
      score: room.pictionaryScores[p.id] || 0,
      eliminated: false,
    }));
    io.to(roomId).emit("updateScoreboard", scores);
  } else {
    const sorted = [...room.pairs].sort(
      (a, b) =>
        (room.pictionaryScores[b.id] || 0) - (room.pictionaryScores[a.id] || 0),
    );
    const scores = sorted.map((p, i) => ({
      rank: i + 1,
      name: p.teamName,
      score: room.pictionaryScores[p.id] || 0,
      eliminated: false,
    }));
    io.to(roomId).emit("updateScoreboard", scores);
  }
}

// ============ TABU FONKSİYONLARI ============

function getPlayerName(room, socketId) {
  for (const pair of room.pairs) {
    if (pair.p1.id === socketId) return pair.p1.username;
    if (pair.p2.id === socketId) return pair.p2.username;
  }
  return "?";
}

function startTabuTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const pair = room.pairs[room.currentPairIndex];
  const describerIsP1 = room.tabuDescriberToggle % 2 === 0;
  const describer = describerIsP1 ? pair.p1 : pair.p2;
  const guesser = describerIsP1 ? pair.p2 : pair.p1;

  room.tabuDescriberId = describer.id;
  room.tabuGuesserId = guesser.id;
  room.tabuPassesLeft = 3;

  io.to(roomId).emit("tabuTurn", {
    pairId: pair.id,
    teamName: pair.teamName,
    describer: describer,
    guesser: guesser,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    roundTime: room.roundTime,
    passesLeft: room.tabuPassesLeft,
  });

  // Send first word
  pickAndSendTabuWord(roomId);

  // Start timer
  if (room.tabuTimer) clearTimeout(room.tabuTimer);
  room.tabuTimer = setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    endTabuTurn(roomId);
  }, room.roundTime * 1000);
}

function pickAndSendTabuWord(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  let available = TABU_WORDS.filter(
    (w) => !room.tabuUsedWords.includes(w.word),
  );
  if (available.length === 0) {
    room.tabuUsedWords = [];
    available = [...TABU_WORDS];
  }
  const wordObj = available[Math.floor(Math.random() * available.length)];
  room.tabuUsedWords.push(wordObj.word);
  room.tabuCurrentWord = wordObj;

  // Send word to everyone except guesser (kartı tahmin eden göremez)
  const guesserSocketId = playerSockets[room.tabuGuesserId];
  const allInRoom = io.sockets.adapter.rooms.get(roomId);
  if (allInRoom) {
    for (const sid of allInRoom) {
      if (sid !== guesserSocketId) {
        io.to(sid).emit("tabuNewWord", {
          word: wordObj.word,
          forbidden: wordObj.forbidden,
        });
      }
    }
  }

  // Tell everyone (including guesser) a new word is active
  io.to(roomId).emit("tabuNewRound");
}

function nextTabuWord(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;
  pickAndSendTabuWord(roomId);
}

function endTabuTurn(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;
  if (!room.pairs || room.pairs.length === 0) return; // Bug L1 fix

  if (room.tabuTimer) {
    clearTimeout(room.tabuTimer);
    room.tabuTimer = null;
  }

  const pair = room.pairs[room.currentPairIndex];
  io.to(roomId).emit("tabuTurnEnd", {
    teamName: pair.teamName,
    score: room.tabuScores[pair.id] || 0,
  });

  // Move to next pair/round
  room.tabuDescriberToggle++;
  room.currentPairIndex++;

  if (room.currentPairIndex >= room.pairs.length) {
    room.currentPairIndex = 0;
    room.currentRound++;

    if (room.currentRound > room.roundCount) {
      // Game over
      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        const sorted = [...room.pairs].sort(
          (a, b) => (room.tabuScores[b.id] || 0) - (room.tabuScores[a.id] || 0),
        );
        const winner = sorted[0];
        const winScore = room.tabuScores[winner.id] || 0;
        io.to(roomId).emit(
          "tabuGameOver",
          `${winner.teamName} kazandı! (${winScore} puan) 🏆`,
        );
        room.gameStatus = "finished";
        setTimeout(() => {
          if (!rooms[roomId]) return; // Bug 3 fix
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 5000);
      }, 2500);
      return;
    }

    io.to(roomId).emit("roundChanged", room.currentRound);
  }

  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    startTabuTurn(roomId);
  }, 3000);
}

function updateTabuLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room || !room.pairs || room.pairs.length === 0) return; // Bug L1 fix

  const sorted = [...room.pairs].sort(
    (a, b) => (room.tabuScores[b.id] || 0) - (room.tabuScores[a.id] || 0),
  );

  const scores = sorted.map((p, i) => ({
    rank: i + 1,
    name: p.teamName,
    score: room.tabuScores[p.id] || 0,
    eliminated: false,
  }));

  io.to(roomId).emit("updateScoreboard", scores);
}

// ============ IMPOSTER FONKSİYONLARI ============

function startImposterRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Kelime seç
  let available = IMPOSTER_WORDS.filter(
    (w) => !room.imposterUsedWords.includes(w.word),
  );
  if (available.length === 0) {
    room.imposterUsedWords = [];
    available = [...IMPOSTER_WORDS];
  }
  const wordObj = available[Math.floor(Math.random() * available.length)];
  room.imposterUsedWords.push(wordObj.word);
  room.imposterCurrentWord = wordObj;
  room.imposterSubmissions1 = {};
  room.imposterSubmissions2 = {};
  room.imposterVotes = {};
  room.imposterPhase = "write1";

  // Rastgele imposter seç
  const imposterIdx = Math.floor(Math.random() * room.players.length);
  room.imposterId = room.players[imposterIdx].id;

  // Herkese gönder
  room.players.forEach((p) => {
    const isImp = p.id === room.imposterId;
    io.to(getSocketId(p.id)).emit("imposterRound", {
      currentRound: room.currentRound,
      totalRounds: room.roundCount,
      roundTime: room.roundTime,
      isImposter: isImp,
      word: isImp ? null : wordObj.word,
      hint: isImp ? wordObj.hint : null,
      phase: "write1",
    });
  });

  // Spectator view - show round info without the word
  if (room.spectators && room.spectators.length > 0) {
    room.spectators.forEach((s) => {
      io.to(getSocketId(s.id)).emit("imposterRound", {
        currentRound: room.currentRound,
        totalRounds: room.roundCount,
        roundTime: room.roundTime,
        isImposter: false,
        word: wordObj.word,
        hint: null,
        phase: "write1",
        isSpectator: true,
      });
    });
  }

  // Timer
  if (room.imposterTimer) clearTimeout(room.imposterTimer);
  room.imposterTimer = setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    endImposterPhase(roomId);
  }, room.roundTime * 1000);
}

function endImposterPhase(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.imposterTimer) {
    clearTimeout(room.imposterTimer);
    room.imposterTimer = null;
  }

  if (room.imposterPhase === "write1") {
    // Faz 1 bitti - boş kalanları doldur
    room.players.forEach((p) => {
      if (!room.imposterSubmissions1[p.id]) {
        room.imposterSubmissions1[p.id] = "⏰";
      }
    });

    const results1 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions1[p.id],
    }));

    // Faz 1 sonuçlarını göster, faz 2'ye geç
    io.to(roomId).emit("imposterPhaseResults", {
      phase: "write1",
      results: results1,
    });

    // Faz 2 başlat
    room.imposterPhase = "write2";
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      io.to(roomId).emit("imposterPhase2Start", {
        roundTime: room.roundTime,
      });

      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        endImposterPhase(roomId);
      }, room.roundTime * 1000);
    }, 3000);
  } else if (room.imposterPhase === "write2") {
    // Faz 2 bitti - boş kalanları doldur
    room.players.forEach((p) => {
      if (!room.imposterSubmissions2[p.id]) {
        room.imposterSubmissions2[p.id] = "⏰";
      }
    });

    const results1 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions1[p.id],
    }));
    const results2 = room.players.map((p) => ({
      username: p.username,
      playerId: p.id,
      word: room.imposterSubmissions2[p.id],
    }));

    // Faz 2 sonuçlarını göster, oylamaya geç
    io.to(roomId).emit("imposterPhaseResults", {
      phase: "write2",
      results1: results1,
      results2: results2,
    });

    room.imposterPhase = "vote";
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      const playerList = room.players.map((p) => ({
        playerId: p.id,
        username: p.username,
      }));
      io.to(roomId).emit("imposterVoteStart", { players: playerList });

      // Oylama için timeout
      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
        if (room.imposterPhase !== "vote") return;
        // Oy vermeyenler çekimser kalır (oy sayılmaz)
        // No action needed - they simply don't have a vote entry
        endImposterVoting(roomId);
      }, 30000);
    }, 3000);
  }
}

function endImposterVoting(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing") return;

  if (room.imposterTimer) {
    clearTimeout(room.imposterTimer);
    room.imposterTimer = null;
  }

  // Oyları say
  const voteCounts = {};
  room.players.forEach((p) => (voteCounts[p.id] = 0));
  Object.values(room.imposterVotes).forEach((votedId) => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  });

  // En çok oy alanı bul (berabere durumda kimse seçilmez = imposter kaçar)
  let maxVotes = 0;
  let maxVotedId = null;
  let tiedPlayers = [];
  for (const [pid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxVotedId = pid;
      tiedPlayers = [pid];
    } else if (count === maxVotes && maxVotes > 0) {
      tiedPlayers.push(pid);
    }
  }
  // If there's a tie, no one is voted out (imposter escapes)
  if (tiedPlayers.length > 1) {
    maxVotedId = null;
  }

  const imposterCaught = maxVotedId !== null && maxVotedId === room.imposterId;
  const imposterPlayer = room.players.find((p) => p.id === room.imposterId);
  const votedPlayer = maxVotedId ? room.players.find((p) => p.id === maxVotedId) : null;

  // Scoring: if imposter is caught, everyone who voted correctly gets 1 point
  // If imposter is not caught, imposter gets 2 points
  if (!room.imposterScores) room.imposterScores = {};
  if (imposterCaught) {
    Object.entries(room.imposterVotes).forEach(([voterId, votedId]) => {
      if (votedId === room.imposterId) {
        room.imposterScores[voterId] = (room.imposterScores[voterId] || 0) + 1;
      }
    });
  } else {
    room.imposterScores[room.imposterId] = (room.imposterScores[room.imposterId] || 0) + 2;
  }

  const voteDetails = room.players.map((p) => {
    const votedFor = room.imposterVotes[p.id];
    const votedForPlayer = room.players.find((v) => v.id === votedFor);
    return {
      username: p.username,
      playerId: p.id,
      votedFor: votedForPlayer ? votedForPlayer.username : "-",
      votedForId: votedFor,
      isImposter: p.id === room.imposterId,
      votes: voteCounts[p.id] || 0,
    };
  });

  io.to(roomId).emit("imposterVoteResult", {
    imposterCaught: imposterCaught,
    imposterId: room.imposterId,
    imposterName: imposterPlayer ? imposterPlayer.username : "?",
    votedPlayerId: maxVotedId,
    votedPlayerName: votedPlayer ? votedPlayer.username : (tiedPlayers.length > 1 ? "Berabere!" : "?"),
    maxVotes: maxVotes,
    tied: tiedPlayers.length > 1,
    secretWord: room.imposterCurrentWord.word,
    voteDetails: voteDetails,
    scores: room.players.map(p => ({
      username: p.username,
      score: room.imposterScores[p.id] || 0,
    })),
  });

  // Sonraki tur
  room.currentRound++;
  if (room.currentRound > room.roundCount) {
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      // Determine winner by score
      const scoreList = room.players.map(p => ({
        playerId: p.id,
        username: p.username,
        score: room.imposterScores[p.id] || 0,
      })).sort((a, b) => b.score - a.score);
      const winner = scoreList[0];
      io.to(roomId).emit("imposterGameOver", {
        message: `${winner.username} kazandı! (${winner.score} puan) 🏆`,
        scores: scoreList,
      });
      room.gameStatus = "finished";
      setTimeout(() => {
        if (!rooms[roomId]) return; // Bug 3 fix
        room.gameStatus = "waiting";
        emitBackToSelect(roomId);
      }, 5000);
    }, 8000);
    return;
  }

  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    io.to(roomId).emit("roundChanged", room.currentRound);
    setTimeout(() => { if (!rooms[roomId]) return; startImposterRound(roomId); }, 2000); // Bug 3 fix
  }, 8000);
}

// ============ SAYI TAHMİN FONKSİYONLARI ============

function startSayiTahminSecretPhase(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const pair = room.pairs[room.currentPairIndex];
  if (!pair) return;

  const pairKey = pair.id;
  room.sayiTahminSecrets[pairKey] = {};
  room.sayiTahminGuesses[pairKey] = { p1: [], p2: [] };

  io.to(roomId).emit("sayiTahminSecretPhase", {
    p1: pair.p1,
    p2: pair.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    teamName: pair.teamName,
    digitCount: room.sayiTahminDigitCount || 4,
  });

  // Server-side timeout for secret phase (60 seconds)
  if (room.sayiTahminTimer) clearTimeout(room.sayiTahminTimer);
  room.sayiTahminTimer = setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    autoSubmitSayiTahminSecret(roomId);
  }, 63000);
}

function startSayiTahminGuessPhase(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const pair = room.pairs[room.currentPairIndex];
  if (!pair) return;

  // Pending guesses'ı sıfırla
  if (!room.sayiTahminPendingGuesses) room.sayiTahminPendingGuesses = {};
  room.sayiTahminPendingGuesses[pair.id] = {};

  // Senkronize: ikisi de aynı anda tahmin girer, ikisi de gönderince sonuçlar açılır
  io.to(roomId).emit("sayiTahminGuessStart", {
    p1: pair.p1,
    p2: pair.p2,
    roundTime: room.roundTime,
    digitCount: room.sayiTahminDigitCount || 4,
  });


  // Server-side timeout for guess phase (90 seconds per guess round)
  if (room.sayiTahminTimer) clearTimeout(room.sayiTahminTimer);
  room.sayiTahminTimer = setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    autoSubmitSayiTahminGuess(roomId);
  }, 93000);
}

function resolveSayiTahminGuessRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const currentPair = room.pairs[room.currentPairIndex];
  if (!currentPair) return;
  const pairKey = currentPair.id;
  const dc = room.sayiTahminDigitCount || 4;
  if (!room.sayiTahminPendingGuesses) return;
  const pending = room.sayiTahminPendingGuesses[pairKey];
  if (!pending || !pending.p1 || !pending.p2) return;

  const bothPayload = { p1Result: pending.p1, p2Result: pending.p2 };
  io.to(getSocketId(currentPair.p1.id)).emit("sayiTahminBothResults", bothPayload);
  io.to(getSocketId(currentPair.p2.id)).emit("sayiTahminBothResults", bothPayload);
  room.spectators.forEach(s => { io.to(getSocketId(s.id)).emit("sayiTahminBothResults", bothPayload); });

  room.sayiTahminPendingGuesses[pairKey] = {};

  const p1Won = pending.p1.greens === dc;
  const p2Won = pending.p2.greens === dc;

  if (p1Won || p2Won) {
    if (p1Won && p2Won && pending.p1.guessCount === pending.p2.guessCount) {
      if (!room.sayiTahminTieCount) room.sayiTahminTieCount = 0;
      room.sayiTahminTieCount++;
      const p1Secret = room.sayiTahminSecrets[pairKey][currentPair.p1.id];
      const p2Secret = room.sayiTahminSecrets[pairKey][currentPair.p2.id];
      io.to(roomId).emit("sayiTahminTie", { p1Name: currentPair.p1.username, p2Name: currentPair.p2.username, p1Secret, p2Secret, guessCount: pending.p1.guessCount, currentRound: room.currentRound, pairId: pairKey, teamName: currentPair.teamName });
      if (room.sayiTahminTieCount >= 3) { room.sayiTahminTieCount = 0; setTimeout(() => { if (!rooms[roomId]) return; nextSayiTahminStep(roomId); }, 3500); } // Bug 3 fix
      else { setTimeout(() => { if (!rooms[roomId]) return; startSayiTahminSecretPhase(roomId); }, 3500); } // Bug 3 fix
      return;
    }
    let winnerId, winnerName, loserName, winnerGuess, targetSecretForWinner, winnerGuessCount;
    if (p1Won && p2Won) {
      if (pending.p1.guessCount < pending.p2.guessCount) { winnerId = currentPair.p1.id; winnerName = currentPair.p1.username; loserName = currentPair.p2.username; winnerGuess = pending.p1.guess; targetSecretForWinner = room.sayiTahminSecrets[pairKey][currentPair.p2.id]; winnerGuessCount = pending.p1.guessCount; }
      else { winnerId = currentPair.p2.id; winnerName = currentPair.p2.username; loserName = currentPair.p1.username; winnerGuess = pending.p2.guess; targetSecretForWinner = room.sayiTahminSecrets[pairKey][currentPair.p1.id]; winnerGuessCount = pending.p2.guessCount; }
    } else if (p1Won) {
      winnerId = currentPair.p1.id; winnerName = currentPair.p1.username; loserName = currentPair.p2.username; winnerGuess = pending.p1.guess; targetSecretForWinner = room.sayiTahminSecrets[pairKey][currentPair.p2.id]; winnerGuessCount = pending.p1.guessCount;
    } else {
      winnerId = currentPair.p2.id; winnerName = currentPair.p2.username; loserName = currentPair.p1.username; winnerGuess = pending.p2.guess; targetSecretForWinner = room.sayiTahminSecrets[pairKey][currentPair.p1.id]; winnerGuessCount = pending.p2.guessCount;
    }
    room.sayiTahminTieCount = 0;
    if (room.sayiTahminScores) room.sayiTahminScores[winnerId] = (room.sayiTahminScores[winnerId] || 0) + 1;
    const winnerSecret = room.sayiTahminSecrets[pairKey][winnerId];
    io.to(roomId).emit("sayiTahminWin", { winnerName, winnerId, loserName, guess: winnerGuess, targetSecret: targetSecretForWinner, winnerSecret, guessCount: winnerGuessCount, pairId: pairKey, teamName: currentPair.teamName });
    setTimeout(() => { if (!rooms[roomId]) return; nextSayiTahminStep(roomId); }, 3500); // Bug 3 fix
    return;
  }

  // Kimse bilmediyse yeni round başlat
  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    io.to(getSocketId(currentPair.p1.id)).emit("sayiTahminNextRoundReady");
    io.to(getSocketId(currentPair.p2.id)).emit("sayiTahminNextRoundReady");
    room.spectators.forEach(s => { io.to(getSocketId(s.id)).emit("sayiTahminNextRoundReady"); });
    if (room.sayiTahminTimer) clearTimeout(room.sayiTahminTimer);
    room.sayiTahminTimer = setTimeout(() => { if (!rooms[roomId]) return; autoSubmitSayiTahminGuess(roomId); }, 93000); // Bug 3 fix
  }, 800);
}

function autoSubmitSayiTahminSecret(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;
  const pair = room.pairs[room.currentPairIndex];
  if (!pair) return;
  const pairKey = pair.id;
  if (!room.sayiTahminSecrets[pairKey]) room.sayiTahminSecrets[pairKey] = {};
  const dc = room.sayiTahminDigitCount || 4;
  if (!room.sayiTahminSecrets[pairKey][pair.p1.id]) room.sayiTahminSecrets[pairKey][pair.p1.id] = randomDigits(dc);
  if (!room.sayiTahminSecrets[pairKey][pair.p2.id]) room.sayiTahminSecrets[pairKey][pair.p2.id] = randomDigits(dc);
  room.sayiTahminGuesses[pairKey] = { p1: [], p2: [] };
  setTimeout(() => { if (!rooms[roomId]) return; startSayiTahminGuessPhase(roomId); }, 1000); // Bug 3 fix
}

function autoSubmitSayiTahminGuess(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;
  // If a player hasn't guessed, skip to next pair
  nextSayiTahminStep(roomId);
}

function nextSayiTahminStep(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.currentPairIndex++;

  if (room.currentPairIndex < room.pairs.length) {
    // Next pair
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      startSayiTahminSecretPhase(roomId);
    }, 1000);
    return;
  }

  // All pairs done, next round
  room.currentPairIndex = 0;
  room.currentRound++;

  if (room.currentRound > room.roundCount) {
    // Game over - skorları hesapla
    const scores = room.sayiTahminScores || {};
    const scoreList = room.pairs.map(pair => ({
      p1: { id: pair.p1.id, name: pair.p1.username, wins: scores[pair.p1.id] || 0 },
      p2: { id: pair.p2.id, name: pair.p2.username, wins: scores[pair.p2.id] || 0 },
      teamName: pair.teamName,
    }));
    io.to(roomId).emit("sayiTahminGameOver", {
      message: "Oyun bitti! 🏆",
      scores: scoreList,
      roundCount: room.roundCount,
    });
    room.gameStatus = "finished";
    setTimeout(() => {
      if (!rooms[roomId]) return; // Bug 3 fix
      room.gameStatus = "waiting";
      emitBackToSelect(roomId);
    }, 5000);
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    if (!rooms[roomId]) return; // Bug 3 fix
    startSayiTahminSecretPhase(roomId);
  }, 1200);
}

function emitBackToSelect(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Oyun state'ini sıfırla
  room.currentRound = 1;
  room.currentPairIndex = 0;
  room.moves = {};
  room.pairs = [];
  room.pictionaryScores = {};
  room.pictionaryUsedWords = [];
  room.pictionaryDrawerToggle = 0;
  room.pictionaryGuessOrder = [];
  room.currentDrawerIndex = 0;
  room.isimSehirScores = {};
  room.usedLetters = [];
  room.categoryIndex = 0;
  room.tabuScores = {};
  room.tabuUsedWords = [];
  room.tabuClues = [];
  room.tabuCurrentWord = null;
  room.imposterUsedWords = [];
  room.sayiTahminSecrets = {};
  room.sayiTahminGuesses = {};
  room.sayiTahminCurrentTurn = null;

  // Mevcut oyuncu listesini oluştur
  let playerList = [];
  if (room.gameMode === "tek") {
    playerList = room.players.map((p) => ({
      username: p.username,
      gender: p.gender,
    }));
  } else {
    room.teams.forEach((t) => {
      if (t.p1)
        playerList.push({ username: t.p1.username, gender: t.p1.gender });
      if (t.p2)
        playerList.push({ username: t.p2.username, gender: t.p2.gender });
    });
    room.spectators.forEach((s) => {
      playerList.push({ username: s.username, gender: s.gender });
    });
  }

  let hostId = null;
  if (room.gameMode === "tek") {
    const host = room.players.find(p => p.isHost);
    hostId = host ? host.id : (room.players.length > 0 ? room.players[0].id : null);
  } else {
    for (const t of room.teams) {
      if (t.p1 && t.p1.isHost) { hostId = t.p1.id; break; }
      if (t.p2 && t.p2.isHost) { hostId = t.p2.id; break; }
    }
    if (!hostId) {
      const specHost = room.spectators.find(s => s.isHost);
      if (specHost) hostId = specHost.id;
    }
    if (!hostId && room.teams[0] && room.teams[0].p1) hostId = room.teams[0].p1.id;
  }

  io.to(roomId).emit("backToSelect", {
    players: playerList,
    hostId: hostId,
    gameMode: room.gameMode,
  });

  // Lobiye dönen oyuncular için lobby update gönder
  emitLobbyUpdate(roomId);
}

function emitLobbyUpdate(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.lastActivity = Date.now();
  let hostId = null;
  if (room.gameMode === "tek") {
    const host = room.players.find(p => p.isHost);
    hostId = host ? host.id : (room.players.length > 0 ? room.players[0].id : null);
  } else {
    for (const t of room.teams) {
      if (t.p1 && t.p1.isHost) { hostId = t.p1.id; break; }
      if (t.p2 && t.p2.isHost) { hostId = t.p2.id; break; }
    }
    // Spectator'larda da host olabilir
    if (!hostId) {
      const specHost = room.spectators.find(s => s.isHost);
      if (specHost) hostId = specHost.id;
    }
    if (!hostId && room.teams[0] && room.teams[0].p1) hostId = room.teams[0].p1.id;
  }
  io.to(roomId).emit("updateLobby", {
    gameMode: room.gameMode,
    teams: room.teams,
    players: room.players || [],
    maxPlayers: room.maxPlayers || 0,
    spectators: room.spectators,
    hostId: hostId,
  });
}

// ============ INACTIVE ROOM CLEANUP ============
// Her 5 dakikada bir hareketsiz odaları temizle
const ROOM_TIMEOUTS = {
  waiting: 30 * 60 * 1000,   // 30 dakika bekleme
  playing: 3 * 60 * 60 * 1000, // 3 saat oyun
  finished: 15 * 60 * 1000,  // 15 dakika bitti
};

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const roomId of Object.keys(rooms)) {
    const room = rooms[roomId];
    const age = now - (room.lastActivity || room.createdAt || now);
    const limit = ROOM_TIMEOUTS[room.gameStatus] || ROOM_TIMEOUTS.waiting;

    if (age > limit) {
      clearAllRoomTimers(room);
      io.to(roomId).emit("gameError", serverT('room_inactive'));
      delete rooms[roomId];
      cleaned++;
      console.log(`Oda temizlendi (hareketsiz, ${Math.round(age / 60000)}dk): ${roomId}`);
    }
  }
  if (cleaned > 0) {
    console.log(`Oda temizliği: ${cleaned} oda silindi. Aktif odalar: ${Object.keys(rooms).length}`);
  }
}, 5 * 60 * 1000);

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda!`));
