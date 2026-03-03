# DuoDuels

Socket.IO tabanli cok oyunculu oyun uygulamasi (web + Capacitor iOS/Android).

## Gereksinimler
- Node.js 20+
- npm
- Firebase projesi (Auth + Firestore)

## Kurulum
1. Bagimliliklari kur:
   ```bash
   npm install
   ```
2. Ortam degiskenlerinde en az bir server kimliklendirme yontemi tanimla:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- veya `GOOGLE_APPLICATION_CREDENTIALS` (dosya yolu)
Ornek formatlar icin `.env.example` dosyasina bak.

## Firebase Web Config
`public/firebase-config.js` icindeki `firebaseConfig` degerlerini Firebase Console -> Project Settings -> Your apps (Web) altindan gelen gercek degerlerle doldur.

Not: Placeholder (`YOUR_*`) degerleri birakilirsa uygulama Firebase init etmez.

Opsiyonel: `public/firebase-runtime-config.example.js` dosyasini `firebase-runtime-config.js` olarak kullanip
`window.__DUODUELS_FIREBASE_CONFIG__` uzerinden runtime config verebilirsin.

## Calistirma
```bash
npm start
```

Varsayilan port `3000`.
Doluysa:
```bash
PORT=3001 npm start
```

## Capacitor
Native tarafta local backend baglamak icin:
```bash
CAP_SERVER_URL=http://localhost:3000 npm run cap:sync
```

Prod buildde `CAP_SERVER_URL` vermeyin (web assets `public/` icinden servis edilir).

## Scriptler
- `npm start` -> Node server
- `npm run cap:sync` -> iOS/Android projelerine web degisikliklerini aktarir
- `npm run cap:ios` -> Xcode projesini acar
- `npm run cap:android` -> Android Studio projesini acar

## Notlar
- Firebase Admin credential yoksa server `DEV_AUTH_BYPASS` moduna gecer.
- Prod ortaminda mutlaka Firebase Admin credential tanimlayin.
