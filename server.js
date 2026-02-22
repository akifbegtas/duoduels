const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// --- CORS Allowlist ---
const ALLOWED_ORIGINS = [
  'https://duoduels.com',
  'https://www.duoduels.com',
  'https://duoduels.onrender.com',
  'capacitor://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
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
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self' wss://duoduels.onrender.com wss://duoduels.com wss://www.duoduels.com ws://localhost:3000 ws://127.0.0.1:3000;"
  );
  next();
});

app.use(express.static(path.join(__dirname, "public")));

// --- Input Validation Helpers ---
const VALID_GAME_TYPES = ['telepati', 'isimSehir', 'pictionary', 'tabu', 'sayiTahmin', 'imposter'];
const VALID_GENDERS = ['male', 'female'];
const VALID_GAME_MODES = ['cift', 'duo', 'tek'];

function sanitizeString(str, maxLength = 50) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

function isValidRoomId(id) {
  return typeof id === 'string' && /^[A-Z0-9]{5,6}$/.test(id);
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
  socket.use(([event], next) => {
    if (event === 'drawData') return next(); // exempt drawing
    const now = Date.now();
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

const rooms = {};

// --- Player Identity ---
const playerSockets = {}; // playerId -> socketId

function getSocketId(playerId) {
  return playerSockets[playerId] || playerId;
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
  let playerId = null;

  socket.on("registerPlayer", (pid) => {
    if (typeof pid === 'string' && pid.length > 0 && pid.length <= 30) {
      playerId = pid;
      playerSockets[pid] = socket.id;
    }
  });

  // --- ODA OLUŞTURMA ---
  socket.on("createRoom", (data) => {
    const roomId = generateRoomId();

    const gameType = VALID_GAME_TYPES.includes(data.gameType) ? data.gameType : "telepati";
    const gameMode = VALID_GAME_MODES.includes(data.gameMode) ? data.gameMode : "cift";
    const username = sanitizeString(data.username, 12) || "Oyuncu";
    const gender = VALID_GENDERS.includes(data.gender) ? data.gender : "male";

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

    const pid = playerId || socket.id;
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
      gameType: gameType,
      currentPairIndex: 0,
      roundCount: rounds,
      roundTime: time,
      currentRound: 1,
      pairs: [],
      moves: {},
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
      // Tabu specific
      tabuScores: {},
      tabuUsedWords: [],
      tabuTimer: null,
      tabuCurrentWord: null,
      tabuDescriberId: null,
      tabuGuesserId: null,
      tabuClues: [],
      tabuDescriberToggle: 0,
      // Sayı Tahmin specific
      sayiTahminSecrets: {},
      sayiTahminGuesses: {},
      sayiTahminCurrentTurn: null, // p1 or p2
      sayiTahminRound: 1,
    };

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
    const room = rooms[cleanRoomId];
    if (room && room.gameStatus === "waiting") {
      const pid = playerId || socket.id;
      const newPlayer = { id: pid, socketId: socket.id, username: cleanUsername, gender: cleanGender, isHost: false };
      if (room.gameMode === "tek") {
        if (room.maxPlayers > 0 && room.players.length >= room.maxPlayers) {
          socket.emit("gameError", "Oda dolu!");
          return;
        }
        room.players.push(newPlayer);
      } else {
        room.spectators.push(newPlayer);
      }
      socket.join(cleanRoomId);
      socket.emit("joinedRoom", cleanRoomId);
      emitLobbyUpdate(cleanRoomId);
    } else {
      socket.emit("gameError", "Oda bulunamadı!");
    }
  });

  // --- TAKIM SEÇME ---
  socket.on("selectTeam", ({ roomId, teamIndex, slot }) => {
    const room = rooms[roomId];
    if (!room) return;
    const pid = playerId || socket.id;
    const playerIndex = room.spectators.findIndex((p) => p.id === pid);
    if (playerIndex !== -1) {
      const player = room.spectators[playerIndex];
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
    const room = rooms[roomId];
    if (!room) return;

    // --- IMPOSTOR OYUNU ---
    if (room.gameType === "imposter") {
      if (room.gameMode !== "tek") {
        socket.emit("gameError", "Imposter sadece tek modda oynanabilir!");
        return;
      }
      if (!room.players || room.players.length < 3) {
        socket.emit("gameError", "Imposter için en az 3 oyuncu gerekli!");
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

      io.to(roomId).emit("imposterStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      setTimeout(() => startImposterRound(roomId), 2000);
      return;
    }

    // TEK MOD
    if (room.gameMode === "tek") {
      if (room.gameType !== "pictionary") {
        socket.emit("gameError", "Tek modda sadece Resim Çiz oynanabilir!");
        return;
      }
      if (room.players.length < 2) {
        socket.emit("gameError", "En az 2 oyuncu gerekli!");
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
      setTimeout(() => startPictionaryRound(roomId), 2000);
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

    if (validPairs.length < 1) {
      socket.emit("gameError", "Yeterli takım yok!");
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
        startTabuTurn(roomId);
      }, 2000);
    } else if (room.gameType === "sayiTahmin") {
      // Sayı Tahmin
      room.sayiTahminSecrets = {};
      room.sayiTahminGuesses = {};
      room.sayiTahminCurrentTurn = null;
      room.sayiTahminRound = 1;

      io.to(roomId).emit("sayiTahminStart", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
        pairs: validPairs,
      });

      setTimeout(() => {
        startSayiTahminSecretPhase(roomId);
      }, 2000);
    } else {
      // Telepati
      io.to(roomId).emit("gameInit", {
        roundCount: room.roundCount,
        roundTime: room.roundTime,
      });

      updateLeaderboard(roomId);

      setTimeout(() => {
        startTurn(roomId);
      }, 2000);
    }
  });

  // --- TELEPATİ: KELİME GÖNDERME ---
  socket.on("submitWord", ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing") return socket.emit("gameError", "Oda bulunamadı!");
    const pid = playerId || socket.id;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id)
      return;
    if (!room.moves[currentPair.id]) room.moves[currentPair.id] = {};

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
        io.to(roomId).emit("gameOver", `${currentPair.teamName} ELENDİ! 💀`);
        setTimeout(() => nextTurn(roomId), 2000);
        return;
      }

      setTimeout(() => {
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
  socket.on("submitAllIsimSehir", ({ roomId, answers }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing") {
      console.log("[IS] REJECTED: room not found or not playing", roomId);
      return;
    }

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) {
      console.log("[IS] REJECTED: no currentPair at index", room.currentPairIndex);
      return;
    }

    const pid = playerId || socket.id;
    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id) {
      console.log("[IS] REJECTED: player not in pair", pid, "p1:", currentPair.p1.id, "p2:", currentPair.p2.id);
      return;
    }

    const who = pid === currentPair.p1.id ? "P1" : "P2";
    console.log(`[IS] ${who} submitted:`, answers);

    // Her kategori için cevabı kaydet
    CATEGORIES.forEach((cat) => {
      const moveKey = currentPair.id + "_" + cat;
      if (!room.moves[moveKey]) room.moves[moveKey] = {};
      let cleanWord = answers[cat] ? answers[cat].trim().toLocaleUpperCase("tr-TR") : "⏰";
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
        console.log(`[IS] Emitting isimSehirAllResults to room ${roomId}`);
        io.to(roomId).emit("isimSehirAllResults", {
          results: allResults,
          p1: currentPair.p1,
          p2: currentPair.p2,
        });
        // Animasyon süresi: sonuç başına 2.8sn + 0.5sn buffer
        const animDelay = allResults.length * 2800 + 500;
        setTimeout(() => {
          nextIsimSehirStep(roomId);
        }, animDelay);
      }, 500);
    }
  });

  // --- PICTIONARY: DRAW DATA ---
  socket.on("drawData", (data) => {
    const room = rooms[data.roomId];
    if (!room || room.gameType !== "pictionary") return;
    // Relay to everyone else in room
    socket.to(data.roomId).emit("drawData", data);
  });

  // --- PICTIONARY: GUESS ---
  socket.on("pictionaryGuess", ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (
      !room ||
      room.gameStatus !== "playing" ||
      room.gameType !== "pictionary"
    )
      return;

    const cleanGuess = guess.trim().toLocaleUpperCase("tr-TR");
    const word = room._currentPictionaryWord;
    if (!word) return;

    if (room.gameMode === "tek") {
      // TEK MOD: bireysel tahmin
      const pid = playerId || socket.id;
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
        const points = pairCount - order;

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

  // --- TABU: İPUCU ---
  socket.on("tabuClue", ({ roomId, clue }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = playerId || socket.id;
    if (pid !== room.tabuDescriberId) return;

    const currentWord = room.tabuCurrentWord;
    if (!currentWord) return;

    const cleanClue = sanitizeString(clue, 100);
    if (!cleanClue) return;

    // Check forbidden words
    const clueUpper = cleanClue.toLocaleUpperCase("tr-TR");
    const wordUpper = currentWord.word.toLocaleUpperCase("tr-TR");
    const allForbidden = [
      wordUpper,
      ...currentWord.forbidden.map((f) => f.toLocaleUpperCase("tr-TR")),
    ];

    let usedForbidden = null;
    for (const fw of allForbidden) {
      if (clueUpper.includes(fw)) {
        usedForbidden = fw;
        break;
      }
    }

    if (usedForbidden) {
      // Forbidden word used - warn and skip word
      io.to(roomId).emit("tabuForbidden", {
        clue: cleanClue,
        forbiddenWord: usedForbidden,
        describerName: getPlayerName(room, pid),
      });
      // Skip to next word
      nextTabuWord(roomId);
      return;
    }

    // Valid clue - broadcast to everyone
    room.tabuClues.push({ text: cleanClue, type: "clue" });
    io.to(roomId).emit("tabuClue", {
      clue: cleanClue,
      describerName: getPlayerName(room, pid),
    });
  });

  // --- TABU: TAHMİN ---
  socket.on("tabuGuess", ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = playerId || socket.id;
    if (pid !== room.tabuGuesserId) return;

    const currentWord = room.tabuCurrentWord;
    if (!currentWord) return;

    const cleanGuess = sanitizeString(guess, 50);
    if (!cleanGuess) return;

    const guessUpper = cleanGuess.toLocaleUpperCase("tr-TR");
    const wordUpper = currentWord.word.toLocaleUpperCase("tr-TR");

    // Broadcast guess to everyone
    room.tabuClues.push({ text: cleanGuess, type: "guess" });
    io.to(roomId).emit("tabuGuessMsg", {
      guess: cleanGuess,
      guesserName: getPlayerName(room, pid),
    });

    if (guessUpper === wordUpper) {
      // Correct guess!
      const pair = room.pairs[room.currentPairIndex];
      room.tabuScores[pair.id] = (room.tabuScores[pair.id] || 0) + 1;
      updateTabuLeaderboard(roomId);

      io.to(roomId).emit("tabuCorrect", {
        word: currentWord.word,
        teamName: pair.teamName,
        score: room.tabuScores[pair.id],
      });

      // Next word
      setTimeout(() => nextTabuWord(roomId), 1000);
    }
  });

  // --- TABU: PAS ---
  socket.on("tabuPass", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "tabu")
      return;
    const pid = playerId || socket.id;
    if (pid !== room.tabuDescriberId) return;

    io.to(roomId).emit("tabuPassed", {
      word: room.tabuCurrentWord ? room.tabuCurrentWord.word : "",
    });

    nextTabuWord(roomId);
  });

  // --- IMPOSTER: KELİME GÖNDERME ---
  socket.on("submitImposterWord", ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "write1" && room.imposterPhase !== "write2")
      return;

    const pid = playerId || socket.id;
    const player = room.players.find((p) => p.id === pid);
    if (!player) return;

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

    if (Object.keys(subs).length >= room.players.length) {
      endImposterPhase(roomId);
    }
  });

  // --- IMPOSTER: OY VERME ---
  socket.on("submitImposterVote", ({ roomId, votedPlayerId }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "imposter")
      return;
    if (room.imposterPhase !== "vote") return;

    const pid = playerId || socket.id;
    const player = room.players.find((p) => p.id === pid);
    if (!player) return;
    if (room.imposterVotes[pid]) return;
    if (pid === votedPlayerId) return;

    room.imposterVotes[pid] = votedPlayerId;

    io.to(roomId).emit("imposterPlayerVoted", {
      username: player.username,
      playerId: pid,
    });

    if (Object.keys(room.imposterVotes).length >= room.players.length) {
      endImposterVoting(roomId);
    }
  });

  // --- SAYI TAHMİN: GİZLİ SAYI GÖNDERME ---
  socket.on("submitSecretNumber", ({ roomId, number }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;
    const pid = playerId || socket.id;
    if (pid !== currentPair.p1.id && pid !== currentPair.p2.id) return;

    // Validate: 4 digits
    const str = String(number);
    if (str.length !== 4 || !/^\d{4}$/.test(str)) {
      socket.emit("sayiTahminError", "4 haneli bir sayı girin!");
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
      // Start guessing phase - p1 goes first
      room.sayiTahminCurrentTurn = "p1";
      room.sayiTahminGuesses[pairKey] = { p1: [], p2: [] };
      setTimeout(() => {
        startSayiTahminGuessPhase(roomId);
      }, 1000);
    }
  });

  // --- SAYI TAHMİN: TAHMİN GÖNDERME ---
  socket.on("submitNumberGuess", ({ roomId, guess }) => {
    const room = rooms[roomId];
    if (!room || room.gameStatus !== "playing" || room.gameType !== "sayiTahmin") return;

    const currentPair = room.pairs[room.currentPairIndex];
    if (!currentPair) return;

    const pid = playerId || socket.id;
    const isP1 = pid === currentPair.p1.id;
    const isP2 = pid === currentPair.p2.id;
    if (!isP1 && !isP2) return;

    // Check if it's this player's turn
    const expectedTurn = room.sayiTahminCurrentTurn;
    if ((expectedTurn === "p1" && !isP1) || (expectedTurn === "p2" && !isP2)) return;

    // Validate guess
    const str = String(guess);
    if (str.length !== 4 || !/^\d{4}$/.test(str)) {
      socket.emit("sayiTahminError", "4 haneli bir sayı girin!");
      return;
    }

    const pairKey = currentPair.id;
    const targetSecret = isP1
      ? room.sayiTahminSecrets[pairKey][currentPair.p2.id]
      : room.sayiTahminSecrets[pairKey][currentPair.p1.id];

    // Calculate greens and yellows
    let greens = 0;
    let yellows = 0;
    const targetDigits = targetSecret.split("");
    const guessDigits = str.split("");

    for (let i = 0; i < 4; i++) {
      if (guessDigits[i] === targetDigits[i]) {
        greens++;
      } else if (targetDigits.includes(guessDigits[i])) {
        yellows++;
      }
    }

    const who = isP1 ? "p1" : "p2";
    const guesserName = isP1 ? currentPair.p1.username : currentPair.p2.username;
    room.sayiTahminGuesses[pairKey][who].push({ guess: str, greens, yellows });

    // Broadcast result to both players
    io.to(getSocketId(currentPair.p1.id)).to(getSocketId(currentPair.p2.id)).emit("sayiTahminGuessResult", {
      who: who,
      guesserName: guesserName,
      guess: str,
      greens: greens,
      yellows: yellows,
      guessCount: room.sayiTahminGuesses[pairKey][who].length,
    });

    // Broadcast to spectators too
    room.spectators.forEach(s => {
      io.to(getSocketId(s.id)).emit("sayiTahminGuessResult", {
        who: who,
        guesserName: guesserName,
        guess: str,
        greens: greens,
        yellows: yellows,
        guessCount: room.sayiTahminGuesses[pairKey][who].length,
      });
    });

    // Check if correct (4 greens)
    if (greens === 4) {
      const winnerName = guesserName;
      const loserName = isP1 ? currentPair.p2.username : currentPair.p1.username;
      const winnerSecret = isP1
        ? room.sayiTahminSecrets[pairKey][currentPair.p1.id]
        : room.sayiTahminSecrets[pairKey][currentPair.p2.id];

      io.to(roomId).emit("sayiTahminWin", {
        winnerName: winnerName,
        winnerId: pid,
        loserName: loserName,
        guess: str,
        targetSecret: targetSecret,
        winnerSecret: winnerSecret,
        guessCount: room.sayiTahminGuesses[pairKey][who].length,
        pairId: pairKey,
        teamName: currentPair.teamName,
      });

      // Next pair or next round
      setTimeout(() => {
        nextSayiTahminStep(roomId);
      }, 5000);
      return;
    }

    // Switch turn
    room.sayiTahminCurrentTurn = room.sayiTahminCurrentTurn === "p1" ? "p2" : "p1";
    startSayiTahminGuessPhase(roomId);
  });

  // --- ODA AYARLARINI GÜNCELLE (oyun bitince tekrar seçim) ---
  socket.on("updateRoom", (data) => {
    const room = rooms[data.roomId];
    if (!room || room.gameStatus !== "waiting") return socket.emit("gameError", "Oda bulunamadı!");

    room.gameType = VALID_GAME_TYPES.includes(data.gameType) ? data.gameType : "telepati";
    room.roundCount = Math.min(Math.max(parseInt(data.roundCount) || 5, 1), 20);
    room.roundTime = Math.min(Math.max(parseInt(data.roundTime) || 10, 5), 120);

    io.to(data.roomId).emit("joinedRoom", data.roomId);
    emitLobbyUpdate(data.roomId);
  });

  // --- REJOIN (reconnection) ---
  socket.on("rejoinRoom", ({ roomId, playerId: pid }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("rejoinFailed");
      return;
    }
    const player = findPlayerInRoom(room, pid);
    if (!player) {
      socket.emit("rejoinFailed");
      return;
    }
    // Reconnect
    player.disconnected = false;
    player.disconnectedAt = null;
    player.socketId = socket.id;
    playerSockets[pid] = socket.id;
    playerId = pid;

    socket.join(roomId);
    socket.emit("rejoinSuccess", { roomId, gameStatus: room.gameStatus, gameType: room.gameType });
    io.to(roomId).emit("playerReconnected", { playerId: pid, username: player.username });
    emitLobbyUpdate(roomId);
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    const pid = playerId || socket.id;
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      const player = findPlayerInRoom(room, pid);
      if (!player) continue;

      // Grace period: 30sn içinde geri bağlanabilir
      player.disconnected = true;
      player.disconnectedAt = Date.now();
      io.to(roomId).emit("playerDisconnected", { playerId: pid, username: player.username });

      setTimeout(() => {
        const r = rooms[roomId];
        if (!r) return;
        const p = findPlayerInRoom(r, pid);
        if (p && p.disconnected) {
          removePlayerFromRoom(roomId, pid);
        }
      }, 30000);
    }
    if (playerId) delete playerSockets[playerId];
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

function clearAllRoomTimers(room) {
  if (room.pictionaryTimer) { clearTimeout(room.pictionaryTimer); room.pictionaryTimer = null; }
  if (room.tabuTimer) { clearTimeout(room.tabuTimer); room.tabuTimer = null; }
  if (room.imposterTimer) { clearTimeout(room.imposterTimer); room.imposterTimer = null; }
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
      io.to(roomId).emit("hostLeft");
      delete rooms[roomId];
      console.log(`Oda silindi (host yok): ${roomId}`);
      return;
    }
  }

  emitLobbyUpdate(roomId);
}

// ============ TELEPATİ FONKSİYONLARI ============

function nextTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // İteratif olarak sıradaki elenmeyen çifti bul
  const maxIterations = room.pairs.length * (room.roundCount + 1);
  for (let i = 0; i < maxIterations; i++) {
    room.currentPairIndex++;

    if (room.currentPairIndex >= room.pairs.length) {
      room.currentPairIndex = 0;
      room.currentRound++;

      if (room.currentRound > room.roundCount) {
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
        io.to(roomId).emit("gameOver", "Herkes Elendi! 💀");
        room.gameStatus = "finished";
        setTimeout(() => {
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
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 7000);
        return;
      }
      continue;
    }

    setTimeout(() => startTurn(roomId), 1500);
    return;
  }
}

function startTurn(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  const p = room.pairs[room.currentPairIndex];

  p.currentTurnAttempts = 0;
  room.moves[p.id] = {};

  io.to(roomId).emit("turnStarted", {
    p1: p.p1,
    p2: p.p2,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    totalMistakes: p.totalAttempts || 0,
  });
}

function updateLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

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
    io.to(roomId).emit("allCategoriesStart", {
      letter: letter,
      categories: CATEGORIES,
      p1: pair.p1,
      p2: pair.p2,
      currentRound: room.currentRound,
      totalRounds: room.roundCount,
    });
  }, 3500);
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
      room.gameStatus = "waiting";
      emitBackToSelect(roomId);
    }, 5000);
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    startIsimSehirRound(roomId);
  }, 2000);
}

function updateIsimSehirLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

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
  room.tabuClues = [];

  io.to(roomId).emit("tabuTurn", {
    pairId: pair.id,
    teamName: pair.teamName,
    describer: describer,
    guesser: guesser,
    currentRound: room.currentRound,
    totalRounds: room.roundCount,
    roundTime: room.roundTime,
  });

  // Send first word
  pickAndSendTabuWord(roomId);

  // Start timer
  if (room.tabuTimer) clearTimeout(room.tabuTimer);
  room.tabuTimer = setTimeout(() => {
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
  room.tabuClues = [];

  // Send word to everyone except guesser
  const allInRoom = io.sockets.adapter.rooms.get(roomId);
  if (allInRoom) {
    for (const sid of allInRoom) {
      if (sid !== getSocketId(room.tabuGuesserId)) {
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
          room.gameStatus = "waiting";
          emitBackToSelect(roomId);
        }, 5000);
      }, 2500);
      return;
    }

    io.to(roomId).emit("roundChanged", room.currentRound);
  }

  setTimeout(() => {
    startTabuTurn(roomId);
  }, 3000);
}

function updateTabuLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return;

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

  // Timer
  if (room.imposterTimer) clearTimeout(room.imposterTimer);
  room.imposterTimer = setTimeout(() => {
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
      io.to(roomId).emit("imposterPhase2Start", {
        roundTime: room.roundTime,
      });

      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
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
      const playerList = room.players.map((p) => ({
        playerId: p.id,
        username: p.username,
      }));
      io.to(roomId).emit("imposterVoteStart", { players: playerList });

      // Oylama için timeout
      if (room.imposterTimer) clearTimeout(room.imposterTimer);
      room.imposterTimer = setTimeout(() => {
        if (room.imposterPhase !== "vote") return;
        // Oy vermeyenleri rastgele doldur
        room.players.forEach((p) => {
          if (!room.imposterVotes[p.id]) {
            const others = room.players.filter((o) => o.id !== p.id);
            if (others.length > 0) {
              room.imposterVotes[p.id] = others[Math.floor(Math.random() * others.length)].id;
            }
          }
        });
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

  // En çok oy alanı bul
  let maxVotes = 0;
  let maxVotedId = null;
  for (const [pid, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxVotedId = pid;
    }
  }

  const imposterCaught = maxVotedId === room.imposterId;
  const imposterPlayer = room.players.find((p) => p.id === room.imposterId);
  const votedPlayer = room.players.find((p) => p.id === maxVotedId);

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
    votedPlayerName: votedPlayer ? votedPlayer.username : "?",
    maxVotes: maxVotes,
    secretWord: room.imposterCurrentWord.word,
    voteDetails: voteDetails,
  });

  // Sonraki tur
  room.currentRound++;
  if (room.currentRound > room.roundCount) {
    setTimeout(() => {
      io.to(roomId).emit("imposterGameOver", "Oyun bitti! 🏆");
      room.gameStatus = "finished";
      setTimeout(() => {
        room.gameStatus = "waiting";
        emitBackToSelect(roomId);
      }, 5000);
    }, 8000);
    return;
  }

  setTimeout(() => {
    io.to(roomId).emit("roundChanged", room.currentRound);
    setTimeout(() => startImposterRound(roomId), 2000);
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
  });
}

function startSayiTahminGuessPhase(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const pair = room.pairs[room.currentPairIndex];
  if (!pair) return;

  const turn = room.sayiTahminCurrentTurn;
  const guesser = turn === "p1" ? pair.p1 : pair.p2;
  const target = turn === "p1" ? pair.p2 : pair.p1;

  io.to(roomId).emit("sayiTahminGuessTurn", {
    turn: turn,
    guesserId: guesser.id,
    guesserName: guesser.username,
    targetName: target.username,
    p1: pair.p1,
    p2: pair.p2,
    roundTime: room.roundTime,
  });
}

function nextSayiTahminStep(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.currentPairIndex++;

  if (room.currentPairIndex < room.pairs.length) {
    // Next pair
    setTimeout(() => {
      startSayiTahminSecretPhase(roomId);
    }, 1500);
    return;
  }

  // All pairs done, next round
  room.currentPairIndex = 0;
  room.currentRound++;

  if (room.currentRound > room.roundCount) {
    // Game over
    io.to(roomId).emit("sayiTahminGameOver", "Oyun bitti! 🏆");
    room.gameStatus = "finished";
    setTimeout(() => {
      room.gameStatus = "waiting";
      emitBackToSelect(roomId);
    }, 5000);
    return;
  }

  io.to(roomId).emit("roundChanged", room.currentRound);
  setTimeout(() => {
    startSayiTahminSecretPhase(roomId);
  }, 2000);
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
    hostId = room.players.length > 0 ? room.players[0].id : null;
  } else {
    hostId = room.teams[0] && room.teams[0].p1 ? room.teams[0].p1.id : null;
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
  let hostId = null;
  if (room.gameMode === "tek") {
    hostId = room.players.length > 0 ? room.players[0].id : null;
  } else {
    hostId = room.teams[0] && room.teams[0].p1 ? room.teams[0].p1.id : null;
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda!`));
