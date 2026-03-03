// DuoDuels — i18n
// Supported: tr, en, ar

const TRANSLATIONS = {
  tr: {
    auth_subtitle:       "Oynamak için giriş yap",
    btn_google:          "Google ile Giriş Yap",
    btn_facebook:        "Facebook ile Giriş Yap",
    btn_apple:           "Apple ile Giriş Yap",
    btn_guest:           "Misafir Olarak Devam Et",
    lobby_welcome:       "Hoşgeldin,",
    mode_passplay:       "Tek Cihazda Oyna",
    mode_passplay_sub:   "Arkadaşınla aynı telefondan",
    mode_private:        "Özel Oda",
    mode_private_sub:    "QR veya kodla davet et",
    mode_random:         "Rastgele Eşleş",
    mode_random_sub:     "Online rakip bul",
    ph_room_code:        "ODA KODU",
    btn_join:            "Katıl",
    profile_title:       "Profilini Oluştur",
    profile_subtitle:    "Oyunlarda kullanılacak bilgilerini gir",
    ph_username:         "Kullanıcı Adı",
    gender_male:         "Erkek 💙",
    gender_female:       "Kadın 🩷",
    btn_continue:        "Devam Et",
    settings_title:      "Ayarlar",
    settings_photo_sec:  "Profil Fotoğrafı",
    settings_photo_btn:  "Fotoğraf Değiştir",
    settings_lang_sec:   "Dil",
    btn_back:            "Geri",
    saving:              "Kaydediliyor...",
    saved:               "Kaydedildi ✓",
  },
  en: {
    auth_subtitle:       "Sign in to play",
    btn_google:          "Sign in with Google",
    btn_facebook:        "Sign in with Facebook",
    btn_apple:           "Sign in with Apple",
    btn_guest:           "Continue as Guest",
    lobby_welcome:       "Welcome,",
    mode_passplay:       "Play Together",
    mode_passplay_sub:   "On the same phone",
    mode_private:        "Private Room",
    mode_private_sub:    "Invite via QR or code",
    mode_random:         "Random Match",
    mode_random_sub:     "Find an online opponent",
    ph_room_code:        "ROOM CODE",
    btn_join:            "Join",
    profile_title:       "Create Your Profile",
    profile_subtitle:    "Enter your in-game info",
    ph_username:         "Username",
    gender_male:         "Male 💙",
    gender_female:       "Female 🩷",
    btn_continue:        "Continue",
    settings_title:      "Settings",
    settings_photo_sec:  "Profile Photo",
    settings_photo_btn:  "Change Photo",
    settings_lang_sec:   "Language",
    btn_back:            "Back",
    saving:              "Saving...",
    saved:               "Saved ✓",
  },
  ar: {
    auth_subtitle:       "سجّل الدخول للعب",
    btn_google:          "الدخول بـ Google",
    btn_facebook:        "الدخول بـ Facebook",
    btn_apple:           "الدخول بـ Apple",
    btn_guest:           "المتابعة كضيف",
    lobby_welcome:       "أهلاً،",
    mode_passplay:       "العب معاً",
    mode_passplay_sub:   "على نفس الهاتف",
    mode_private:        "غرفة خاصة",
    mode_private_sub:    "ادعُ بـ QR أو رمز",
    mode_random:         "مطابقة عشوائية",
    mode_random_sub:     "ابحث عن خصم عبر الإنترنت",
    ph_room_code:        "رمز الغرفة",
    btn_join:            "انضم",
    profile_title:       "أنشئ ملفك الشخصي",
    profile_subtitle:    "أدخل معلوماتك في اللعبة",
    ph_username:         "اسم المستخدم",
    gender_male:         "ذكر 💙",
    gender_female:       "أنثى 🩷",
    btn_continue:        "متابعة",
    settings_title:      "الإعدادات",
    settings_photo_sec:  "صورة الملف الشخصي",
    settings_photo_btn:  "تغيير الصورة",
    settings_lang_sec:   "اللغة",
    btn_back:            "رجوع",
    saving:              "جاري الحفظ...",
    saved:               "تم الحفظ ✓",
  }
};

let currentLang = localStorage.getItem('dd_lang') || 'tr';

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
      || TRANSLATIONS['tr'][key]
      || key;
}

function applyTranslations() {
  const lang = currentLang;
  const isRtl = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

  // Auth
  _setText('auth-subtitle',        t('auth_subtitle'));
  _setText('btn-text-google',      t('btn_google'));
  _setText('btn-text-facebook',    t('btn_facebook'));
  _setText('btn-text-apple',       t('btn_apple'));
  _setText('btn-text-guest',       t('btn_guest'));

  // Profile setup
  _setText('profile-setup-title',    t('profile_title'));
  _setText('profile-setup-subtitle', t('profile_subtitle'));
  _setAttr('setup-username', 'placeholder', t('ph_username'));
  _setText('gender-male-label',   t('gender_male'));
  _setText('gender-female-label', t('gender_female'));
  _setText('btn-continue-profile', t('btn_continue'));

  // Lobby
  _setText('lobby-welcome-text', t('lobby_welcome'));
  _setText('lmc-title-passplay',  t('mode_passplay'));
  _setText('lmc-sub-passplay',    t('mode_passplay_sub'));
  _setText('lmc-title-private',   t('mode_private'));
  _setText('lmc-sub-private',     t('mode_private_sub'));
  _setText('lmc-title-random',    t('mode_random'));
  _setText('lmc-sub-random',      t('mode_random_sub'));
  _setAttr('roomCodeInput', 'placeholder', t('ph_room_code'));
  _setText('btn-join',            t('btn_join'));

  // Settings
  _setText('settings-title',      t('settings_title'));
  _setText('settings-photo-sec',  t('settings_photo_sec'));
  _setText('settings-photo-btn',  t('settings_photo_btn'));
  _setText('settings-lang-sec',   t('settings_lang_sec'));

  // Active language highlight
  ['tr','en','ar'].forEach(l => {
    const btn = document.getElementById('lang-btn-' + l);
    if (btn) btn.classList.toggle('lang-active', l === lang);
  });
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('dd_lang', lang);
  applyTranslations();
}

function _setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function _setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el) el.setAttribute(attr, val);
}

// Auto-apply on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyTranslations);
} else {
  applyTranslations();
}
