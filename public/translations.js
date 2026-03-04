// DuoDuels — i18n
// Supported: tr, en, ar

const TRANSLATIONS = {
  tr: {
    // Auth
    auth_subtitle:       "Oynamak için giriş yap",
    btn_google:          "Google ile Giriş Yap",
    btn_facebook:        "Facebook ile Giriş Yap",
    btn_apple:           "Apple ile Giriş Yap",
    btn_guest:           "Misafir Olarak Devam Et",
    auth_error:          "Giriş Hatası",
    auth_account_exists: "Hesap Mevcut",
    auth_account_exists_text: "Bu e-posta ile daha önce farklı bir yöntemle giriş yapılmış. Lütfen o yöntemi kullanın.",
    auth_apple_disabled: "Bu platformda kapalı",
    auth_apple_disabled_text: "Apple ile giriş sadece iOS'ta aktif.",
    auth_guest_failed:   "Misafir girişi başarısız. Firebase Authentication > Anonymous provider'ı açın.",
    auth_or:             "veya",
    auth_skip:           "Giriş yapmadan oyna",
    auth_skip_note:      "Sadece Tek Cihazda Oyna modu kullanılabilir",
    auth_required_title: "Giriş Gerekli",
    auth_required_text:  "Çok oyunculu modlar için Google veya Facebook ile giriş yapmalısın.",
    auth_required_login: "Giriş Yap",
    cancel:              "İptal",

    // Profile
    profile_title:       "Profilini Oluştur",
    profile_subtitle:    "Oyunlarda kullanılacak bilgilerini gir",
    ph_username:         "Kullanıcı Adı",
    gender_male:         "Erkek 💙",
    gender_female:       "Kadın 🩷",
    btn_continue:        "Devam Et",
    warn_username_empty: "Kullanıcı adı giriniz",
    warn_username_long:  "Kullanıcı adı en fazla 12 karakter olabilir",
    warn_gender:         "Cinsiyet seçiniz",
    error_profile_save:  "Profil kaydedilemedi: ",
    warning:             "Uyarı",
    error:               "Hata",

    // Lobby
    lobby_welcome:       "Hoşgeldin,",
    mode_passplay:       "Tek Cihazda Oyna",
    mode_passplay_sub:   "Arkadaşınla aynı telefondan",
    mode_private:        "Özel Oda",
    mode_private_sub:    "QR veya kodla davet et",
    mode_random:         "Rastgele Eşleş",
    mode_random_sub:     "Online rakip bul",
    ph_room_code:        "ODA KODU",
    btn_join:            "Katıl",
    warn_room_code:      "Oda kodunu giriniz",
    warn_name_long:      "İsimler en fazla 12 karakter olabilir",

    // Settings
    settings_title:      "Ayarlar",
    settings_photo_sec:  "Profil Fotoğrafı",
    settings_photo_btn:  "Fotoğraf Değiştir",
    settings_lang_sec:   "Dil",
    btn_back:            "Geri",
    saving:              "Kaydediliyor...",
    saved:               "Kaydedildi ✓",

    // QR
    qr_scanner_failed:   "QR Tarayıcı Yüklenemedi",
    qr_scanner_failed_text: "Lütfen internet bağlantınızı kontrol edin.",
    qr_cancel:           "İptal",
    qr_camera_failed:    "Kamera Açılamadı",

    // Matchmaking
    mm_searching:        "Oyuncu Aranıyor...",
    mm_waiting_gender:   "Karşı cinsten bir oyuncu bekleniyor",
    mm_match_found:      "Eşleşme Bulundu!",
    mm_select_game:      "En az 1 oyun seçmelisin!",

    // Connection
    conn_copied:         "Kopyalandı!",
    conn_sent:           "Gönderildi!",
    conn_lost:           "Bağlantı koptu! Yeniden bağlanılıyor...",
    conn_reconnecting:   "Yeniden bağlanılıyor...",
    conn_room_gone:      "Bağlantı Koptu",
    conn_room_gone_text: "Oyun odası artık mevcut değil.",
    conn_room_closed:    "Oda Kapandı",
    conn_room_closed_text: "Tüm oyuncular ayrıldı.",

    // Round / General game
    round_transition:    "Tura Geçiliyor",
    starting:            "Başlıyor!",
    finished:            "BİTTİ",
    scores:              "SKORLAR",
    your_turn:           "SIRA SİZDE!",
    writing:             "Yazıyor...",
    spectator_msg:       "Seyirci olarak izliyorsunuz. Boş slota tıklayın.",
    waiting_host:        "Kurucunun oyunu başlatması bekleniyor...",
    error_count:         "HATA",
    error_eliminate:     "20 Hata = ELENİR!",

    // Telepati
    telepati_your_turn:  "SIRA SİZDE! 🚀",

    // Isim Sehir
    is_starting:         "İsim Şehir Başlıyor!",
    is_fill_all:         "SIRA SİZDE! 🚀 Hepsini doldurun",

    // Pictionary
    pic_draw:            "ÇİZ! Herkes tahmin edecek",
    pic_guess:           "TAHMİN ET!",
    pic_drawing:         "çiziyor",
    pic_guessing:        "tahmin ediyor",
    pic_draw_you:        "ÇİZ!",
    pic_you_drawing:     "(sen) çiziyorsun",
    pic_correct:         "bildi!",
    pic_points:          "puan",
    pic_place:           "sıra",

    // Tabu
    tabu_starting:       "Tabu Başlıyor!",
    tabu_guess:          "TAHMİN ET!",
    tabu_describing:     "anlatıyor",
    tabu_correct:        "DOĞRU!",
    tabu_forbidden:      "YASAKLI KELİME!",
    tabu_forbidden_used: "yasaklı kelime kullandı:",
    tabu_word_skipped:   "Kelime geçildi!",
    tabu_pass:           "PAS",
    tabu_skipped:        "geçildi",
    tabu_time_up:        "Süre doldu!",

    // Imposter
    imp_impostor:        "IMPOSTOR",
    imp_hint:            "İpucu:",
    imp_submitted:       "yazdı",
    imp_round1:          "1. Tur Cevapları",
    imp_round2:          "2. Tur Cevapları",
    imp_voted:           "oy verdi",
    imp_caught:          "Impostor yakalandı!",
    imp_won:             "Impostor kazandı!",
    imp_was:             "impostor'du!",
    imp_result:          "Sonuç",

    // Sayi Tahmin
    st_enter_digit:      "haneli bir sayı gir!",
    st_same_digits:      "Tüm rakamlar aynı olamaz!",
    st_title:            "Sayı Tahmin",
    st_digits:           "basamak",
    st_enter_secret:     "Haneli Gizli Sayını Gir",
    st_pick_digits:      "arası rakamlarla",
    st_pick_number:      "haneli bir sayı seç",
    st_enter_secret_btn: "GİZLİ SAYINI GİR! 🔒",
    st_selecting:        "sayı seçiyor...",
    st_players_selecting: "Oyuncular gizli sayılarını seçiyor...",
    st_guess_number:     "sayısını tahmin et! 🎯",
    st_guess_digit:      "haneli sayısını tahmin et",
    st_players_guessing: "Oyuncular birbirlerinin sayılarını tahmin ediyor...",
    st_guess_p1:         "P1'in sayısını tahmin et! 🎯",
    st_opponent_sent:    "Rakip tahminini gönderdi! Seni bekliyor...",
    st_new_guess:        "🎯 Yeni tahmin gir!",

    // Server error messages
    err_room_not_found:  "Oda bulunamadı!",
    err_only_host_start: "Sadece kurucu oyunu başlatabilir!",
    err_imposter_tek:    "Imposter sadece tek modda oynanabilir!",
    err_imposter_min3:   "Imposter için en az 3 oyuncu gerekli!",
    err_tek_pictionary:  "Tek modda sadece Resim Çiz oynanabilir!",
    err_min2_players:    "En az 2 oyuncu gerekli!",
    err_not_enough_teams: "Yeterli takım yok!",
    err_only_host_settings: "Sadece kurucu ayarları değiştirebilir!",
    err_room_inactive:   "Oda hareketsizlik nedeniyle kapatıldı.",
    err_wait_opponent:   "Rakibin tahminini bekle!",
    err_enter_digit:     "haneli bir sayı girin!",
    err_same_digits:     "Tüm rakamlar aynı olamaz!",

    // Game over
    go_eliminated:       "ELENDİ! 💀",
    go_all_eliminated:   "Herkes Elendi! 💀",

    // Pass & Play
    pp_player2:          "Oyuncu 2",
    pp_give_phone:       "Telefonu {name}'e ver",
    pp_wait:             "Dur bir dakika!",
    pp_select_couples:   "Önce kaç çift oynayacak onu seç 💑",
    pp_select_players:   "Önce kaç kişi oynayacak onu seç 🧑‍🤝‍🧑",
    pp_got_it:           "Anladım! 👍",
    pp_imp_min3:         "Imposter en az 3 kişi gerektirir!",
    pp_imp_min3_text:    "Lütfen en az 3 kişi seçin",
    btn_ok:              "Tamam",

    // Game names
    game_telepati:       "Telepati",
    game_isim_sehir:     "İsim Şehir",
    game_pictionary:     "Resim Çiz",
    game_tabu:           "Tabu",
    game_imposter:       "Imposter",
    game_sayi_tahmin:    "Sayı Tahmin",
    game_settings:       " - Ayarlar",

    // Room / Lobby
    host_label:          "KURUCU",
    join_slot:           "+ KATIL",
    spectators:          "İzleyiciler",
    lobby_select_team:   "Lobidekiler (Takım Seçin)",
    players_label:       "Oyuncular",
    you_label:           "Sen",
    host_changed:        "Kurucu Değişti",
    new_host:            "yeni kurucu oldu!",

    // Share
    share_msg:           "DuoDuels'a gel! 💖\n\nOda Kodu: {code}\n\n{url}",
    share_title:         "Arkadaşlarını davet et",

    // General game
    round_label:         "Tur:",
    playing:             "Oynuyor...",
    submitted:           "YAZDI!",
    match_yes:           "EŞLEŞME! ✅",
    match_no:            "EŞLEŞMEDİ ❌",
    retry:               "Tekrar...",
    points_suffix:       " puan",
    matched:             "EŞLEŞTİ!",
    round_n:             "TUR",
    you_won:             "KAZANDINIZ! 🏆",
    last_standing:       "Son hayatta kalan takım!",
    least_errors:        "En az hatayla bitirdiniz!",
    great_job:           "Harikayız! 💪",
    you_lost:            "KAYBETTİNİZ 😔",
    winner_prefix:       "Kazanan: ",
    winner_suffix:       " kazandı!",
    next_time:           "Bir dahaki sefere! 💪",
    btn_retry:           "Tekrar Dene",
    game_over:           "OYUN BİTTİ! 🏆",
    example_prefix:      "Örnek: ",
    score_wins:          "En çok puan kazanır! 🏆",

    // Pictionary specific
    pic_starting:        "Resim Çiz Başlıyor!",
    pic_first_guess:     "İlk bilene en çok puan! 🏆",
    pic_word:            "Kelime:",
    pic_correct_title:   "Doğru!",
    pic_answer:          "Cevap:",
    pic_describe:        "ANLAT!",
    pic_will_guess:      "tahmin edecek",

    // Tabu specific
    tabu_most_words:     "En çok kelime bilen kazanır! 🏆",
    tabu_correct_title:  "DOĞRU!",

    // Imposter specific
    imp_starting:        "Imposter Başlıyor!",
    imp_write_round1:    "1. Yazma Turu",
    imp_write_round2:    "2. Yazma Turu",
    imp_watching:        "İzliyorsunuz...",
    imp_word:            "Kelime",
    imp_you_impostor:    "Sen IMPOSTOR'sun! Yakalanma! 🕵️",
    imp_write_clue:      "Kelimeyle ilgili bir şey yaz! 🔍",
    imp_answers_revealed: "Cevaplar açıklandı!",
    imp_round2_prep:     "2. tur hazırlanıyor...",
    imp_vote_prep:       "Oylama hazırlanıyor...",
    imp_round2_impostor: "2. Tur - Tekrar yaz! Yakalanma! 🕵️",
    imp_round2_normal:   "2. Tur - Tekrar bir şey yaz! 🔍",
    imp_vote_phase:      "Oylama",
    imp_vote_prompt:     "Imposter kim? Oy ver! 🗳️",
    imp_votes:           "oy",

    // Sayi Tahmin specific
    st_only_digits:      "Sadece rakam gir!",
    st_waiting:          "Rakip bekleniyor...",
    st_vs:               "vs",
    st_example:          "Örn:",
    st_partner_ready:    "Rakip girdi, seni bekliyor!",
    st_me:               "(Ben)",
    st_guessing:         "Tahmin ediyorlar!",
    st_round_tie:        "Tur Tekrar Ediliyor!",
    st_both_guessed:     "İkisi de {count} tahminde bildi!",
    btn_continue_game:   "Devam",
    st_you_won:          "BİLDİN!",
    st_player_won:       "BİLDİ!",
    st_in_guesses:       "tahminde bildi!",
    st_great:            "Harika! 💪",
    st_rounds_done:      "Tur Tamamlandı",

    // Matchmaking server
    mm_server_searching: "Karşı cinsten oyuncu aranıyor...",
  },
  en: {
    // Auth
    auth_subtitle:       "Sign in to play",
    btn_google:          "Sign in with Google",
    btn_facebook:        "Sign in with Facebook",
    btn_apple:           "Sign in with Apple",
    btn_guest:           "Continue as Guest",
    auth_error:          "Sign-in Error",
    auth_account_exists: "Account Exists",
    auth_account_exists_text: "This email was previously signed in with a different method. Please use that method.",
    auth_apple_disabled: "Disabled on this platform",
    auth_apple_disabled_text: "Apple sign-in is only available on iOS.",
    auth_guest_failed:   "Guest sign-in failed. Enable Firebase Authentication > Anonymous provider.",
    auth_or:             "or",
    auth_skip:           "Play without signing in",
    auth_skip_note:      "Only Pass & Play mode will be available",
    auth_required_title: "Login Required",
    auth_required_text:  "You need to sign in with Google or Facebook for multiplayer modes.",
    auth_required_login: "Sign In",
    cancel:              "Cancel",

    // Profile
    profile_title:       "Create Your Profile",
    profile_subtitle:    "Enter your in-game info",
    ph_username:         "Username",
    gender_male:         "Male 💙",
    gender_female:       "Female 🩷",
    btn_continue:        "Continue",
    warn_username_empty: "Please enter a username",
    warn_username_long:  "Username can be at most 12 characters",
    warn_gender:         "Please select a gender",
    error_profile_save:  "Could not save profile: ",
    warning:             "Warning",
    error:               "Error",

    // Lobby
    lobby_welcome:       "Welcome,",
    mode_passplay:       "Play Together",
    mode_passplay_sub:   "On the same phone",
    mode_private:        "Private Room",
    mode_private_sub:    "Invite via QR or code",
    mode_random:         "Random Match",
    mode_random_sub:     "Find an online opponent",
    ph_room_code:        "ROOM CODE",
    btn_join:            "Join",
    warn_room_code:      "Please enter a room code",
    warn_name_long:      "Names can be at most 12 characters",

    // Settings
    settings_title:      "Settings",
    settings_photo_sec:  "Profile Photo",
    settings_photo_btn:  "Change Photo",
    settings_lang_sec:   "Language",
    btn_back:            "Back",
    saving:              "Saving...",
    saved:               "Saved ✓",

    // QR
    qr_scanner_failed:   "QR Scanner Failed",
    qr_scanner_failed_text: "Please check your internet connection.",
    qr_cancel:           "Cancel",
    qr_camera_failed:    "Camera Failed to Open",

    // Matchmaking
    mm_searching:        "Searching for Player...",
    mm_waiting_gender:   "Waiting for an opponent",
    mm_match_found:      "Match Found!",
    mm_select_game:      "You must select at least 1 game!",

    // Connection
    conn_copied:         "Copied!",
    conn_sent:           "Sent!",
    conn_lost:           "Connection lost! Reconnecting...",
    conn_reconnecting:   "Reconnecting...",
    conn_room_gone:      "Connection Lost",
    conn_room_gone_text: "The game room no longer exists.",
    conn_room_closed:    "Room Closed",
    conn_room_closed_text: "All players have left.",

    // Round / General game
    round_transition:    "Moving to Round",
    starting:            "Starting!",
    finished:            "FINISHED",
    scores:              "SCORES",
    your_turn:           "YOUR TURN!",
    writing:             "Writing...",
    spectator_msg:       "You are spectating. Click an empty slot to join.",
    waiting_host:        "Waiting for the host to start the game...",
    error_count:         "ERRORS",
    error_eliminate:     "20 Errors = ELIMINATED!",

    // Telepati
    telepati_your_turn:  "YOUR TURN! 🚀",

    // Isim Sehir
    is_starting:         "Name City Starting!",
    is_fill_all:         "YOUR TURN! 🚀 Fill them all",

    // Pictionary
    pic_draw:            "DRAW! Everyone will guess",
    pic_guess:           "GUESS!",
    pic_drawing:         "is drawing",
    pic_guessing:        "is guessing",
    pic_draw_you:        "DRAW!",
    pic_you_drawing:     "(you) are drawing",
    pic_correct:         "guessed it!",
    pic_points:          "points",
    pic_place:           "place",

    // Tabu
    tabu_starting:       "Taboo Starting!",
    tabu_guess:          "GUESS!",
    tabu_describing:     "is describing",
    tabu_correct:        "CORRECT!",
    tabu_forbidden:      "FORBIDDEN WORD!",
    tabu_forbidden_used: "used a forbidden word:",
    tabu_word_skipped:   "Word skipped!",
    tabu_pass:           "PASS",
    tabu_skipped:        "skipped",
    tabu_time_up:        "Time's up!",

    // Imposter
    imp_impostor:        "IMPOSTOR",
    imp_hint:            "Hint:",
    imp_submitted:       "submitted",
    imp_round1:          "Round 1 Answers",
    imp_round2:          "Round 2 Answers",
    imp_voted:           "voted",
    imp_caught:          "Impostor caught!",
    imp_won:             "Impostor won!",
    imp_was:             "was the impostor!",
    imp_result:          "Result",

    // Sayi Tahmin
    st_enter_digit:      "-digit number required!",
    st_same_digits:      "All digits can't be the same!",
    st_title:            "Number Guess",
    st_digits:           "digits",
    st_enter_secret:     "-Digit Secret Number",
    st_pick_digits:      "digits using 0-9",
    st_pick_number:      "-digit number",
    st_enter_secret_btn: "ENTER SECRET NUMBER! 🔒",
    st_selecting:        "is selecting...",
    st_players_selecting: "Players are selecting their secret numbers...",
    st_guess_number:     "'s number! 🎯",
    st_guess_digit:      "-digit number",
    st_players_guessing: "Players are guessing each other's numbers...",
    st_guess_p1:         "Guess Player 1's number! 🎯",
    st_opponent_sent:    "Opponent sent a guess! Waiting for you...",
    st_new_guess:        "🎯 Enter a new guess!",

    // Server error messages
    err_room_not_found:  "Room not found!",
    err_only_host_start: "Only the host can start the game!",
    err_imposter_tek:    "Imposter can only be played in single mode!",
    err_imposter_min3:   "Imposter requires at least 3 players!",
    err_tek_pictionary:  "Only Pictionary is available in single mode!",
    err_min2_players:    "At least 2 players required!",
    err_not_enough_teams: "Not enough teams!",
    err_only_host_settings: "Only the host can change settings!",
    err_room_inactive:   "Room closed due to inactivity.",
    err_wait_opponent:   "Wait for your opponent's guess!",
    err_enter_digit:     "-digit number required!",
    err_same_digits:     "All digits can't be the same!",

    // Game over
    go_eliminated:       "ELIMINATED! 💀",
    go_all_eliminated:   "Everyone Eliminated! 💀",

    // Pass & Play
    pp_player2:          "Player 2",
    pp_give_phone:       "Give the phone to {name}",
    pp_wait:             "Wait a moment!",
    pp_select_couples:   "First select how many couples will play 💑",
    pp_select_players:   "First select how many players 🧑‍🤝‍🧑",
    pp_got_it:           "Got it! 👍",
    pp_imp_min3:         "Imposter requires at least 3 players!",
    pp_imp_min3_text:    "Please select at least 3 players",
    btn_ok:              "OK",

    // Game names
    game_telepati:       "Telepathy",
    game_isim_sehir:     "Name City",
    game_pictionary:     "Pictionary",
    game_tabu:           "Taboo",
    game_imposter:       "Imposter",
    game_sayi_tahmin:    "Number Guess",
    game_settings:       " - Settings",

    // Room / Lobby
    host_label:          "HOST",
    join_slot:           "+ JOIN",
    spectators:          "Spectators",
    lobby_select_team:   "Lobby (Select Team)",
    players_label:       "Players",
    you_label:           "You",
    host_changed:        "Host Changed",
    new_host:            "is the new host!",

    // Share
    share_msg:           "Come play DuoDuels! 💖\n\nRoom Code: {code}\n\n{url}",
    share_title:         "Invite your friends",

    // General game
    round_label:         "Round:",
    playing:             "Playing...",
    submitted:           "DONE!",
    match_yes:           "MATCH! ✅",
    match_no:            "NO MATCH ❌",
    retry:               "Retry...",
    points_suffix:       " pts",
    matched:             "MATCHED!",
    round_n:             "ROUND",
    you_won:             "YOU WON! 🏆",
    last_standing:       "Last team standing!",
    least_errors:        "Fewest errors!",
    great_job:           "Great job! 💪",
    you_lost:            "YOU LOST 😔",
    winner_prefix:       "Winner: ",
    winner_suffix:       " won!",
    next_time:           "Next time! 💪",
    btn_retry:           "Try Again",
    game_over:           "GAME OVER! 🏆",
    example_prefix:      "Example: ",
    score_wins:          "Most points wins! 🏆",

    // Pictionary specific
    pic_starting:        "Pictionary Starting!",
    pic_first_guess:     "First to guess gets most points! 🏆",
    pic_word:            "Word:",
    pic_correct_title:   "Correct!",
    pic_answer:          "Answer:",
    pic_describe:        "DESCRIBE!",
    pic_will_guess:      "will guess",

    // Tabu specific
    tabu_most_words:     "Most words guessed wins! 🏆",
    tabu_correct_title:  "CORRECT!",

    // Imposter specific
    imp_starting:        "Imposter Starting!",
    imp_write_round1:    "Round 1 Writing",
    imp_write_round2:    "Round 2 Writing",
    imp_watching:        "Watching...",
    imp_word:            "Word",
    imp_you_impostor:    "You are the IMPOSTOR! Don't get caught! 🕵️",
    imp_write_clue:      "Write something about the word! 🔍",
    imp_answers_revealed: "Answers revealed!",
    imp_round2_prep:     "Preparing round 2...",
    imp_vote_prep:       "Preparing vote...",
    imp_round2_impostor: "Round 2 - Write again! Don't get caught! 🕵️",
    imp_round2_normal:   "Round 2 - Write something again! 🔍",
    imp_vote_phase:      "Voting",
    imp_vote_prompt:     "Who is the Impostor? Vote! 🗳️",
    imp_votes:           "votes",

    // Sayi Tahmin specific
    st_only_digits:      "Enter digits only!",
    st_waiting:          "Waiting for opponent...",
    st_vs:               "vs",
    st_example:          "Ex:",
    st_partner_ready:    "Opponent entered, waiting for you!",
    st_me:               "(Me)",
    st_guessing:         "They're guessing!",
    st_round_tie:        "Round Replaying!",
    st_both_guessed:     "Both guessed in {count} tries!",
    btn_continue_game:   "Continue",
    st_you_won:          "YOU GOT IT!",
    st_player_won:       "GOT IT!",
    st_in_guesses:       "guesses to get it!",
    st_great:            "Awesome! 💪",
    st_rounds_done:      "Rounds Completed",

    // Matchmaking server
    mm_server_searching: "Searching for an opponent...",
  },
  ar: {
    // Auth
    auth_subtitle:       "سجّل الدخول للعب",
    btn_google:          "الدخول بـ Google",
    btn_facebook:        "الدخول بـ Facebook",
    btn_apple:           "الدخول بـ Apple",
    btn_guest:           "المتابعة كضيف",
    auth_error:          "خطأ في تسجيل الدخول",
    auth_account_exists: "الحساب موجود",
    auth_account_exists_text: "تم تسجيل الدخول بهذا البريد الإلكتروني مسبقاً بطريقة أخرى. يرجى استخدام تلك الطريقة.",
    auth_apple_disabled: "غير متاح على هذه المنصة",
    auth_apple_disabled_text: "تسجيل الدخول بـ Apple متاح فقط على iOS.",
    auth_guest_failed:   "فشل تسجيل الدخول كضيف. قم بتفعيل Firebase Authentication > Anonymous provider.",
    auth_or:             "أو",
    auth_skip:           "العب بدون تسجيل دخول",
    auth_skip_note:      "فقط وضع اللعب على جهاز واحد متاح",
    auth_required_title: "تسجيل الدخول مطلوب",
    auth_required_text:  "يجب تسجيل الدخول عبر Google أو Facebook لأوضاع اللعب الجماعي.",
    auth_required_login: "تسجيل الدخول",
    cancel:              "إلغاء",

    // Profile
    profile_title:       "أنشئ ملفك الشخصي",
    profile_subtitle:    "أدخل معلوماتك في اللعبة",
    ph_username:         "اسم المستخدم",
    gender_male:         "ذكر 💙",
    gender_female:       "أنثى 🩷",
    btn_continue:        "متابعة",
    warn_username_empty: "يرجى إدخال اسم مستخدم",
    warn_username_long:  "اسم المستخدم يجب أن لا يتجاوز 12 حرفاً",
    warn_gender:         "يرجى اختيار الجنس",
    error_profile_save:  "تعذر حفظ الملف الشخصي: ",
    warning:             "تحذير",
    error:               "خطأ",

    // Lobby
    lobby_welcome:       "أهلاً،",
    mode_passplay:       "العب معاً",
    mode_passplay_sub:   "على نفس الهاتف",
    mode_private:        "غرفة خاصة",
    mode_private_sub:    "ادعُ بـ QR أو رمز",
    mode_random:         "مطابقة عشوائية",
    mode_random_sub:     "ابحث عن خصم عبر الإنترنت",
    ph_room_code:        "رمز الغرفة",
    btn_join:            "انضم",
    warn_room_code:      "يرجى إدخال رمز الغرفة",
    warn_name_long:      "الأسماء يجب أن لا تتجاوز 12 حرفاً",

    // Settings
    settings_title:      "الإعدادات",
    settings_photo_sec:  "صورة الملف الشخصي",
    settings_photo_btn:  "تغيير الصورة",
    settings_lang_sec:   "اللغة",
    btn_back:            "رجوع",
    saving:              "جاري الحفظ...",
    saved:               "تم الحفظ ✓",

    // QR
    qr_scanner_failed:   "فشل تحميل ماسح QR",
    qr_scanner_failed_text: "يرجى التحقق من اتصال الإنترنت.",
    qr_cancel:           "إلغاء",
    qr_camera_failed:    "فشل فتح الكاميرا",

    // Matchmaking
    mm_searching:        "البحث عن لاعب...",
    mm_waiting_gender:   "في انتظار خصم",
    mm_match_found:      "تم العثور على مباراة!",
    mm_select_game:      "يجب اختيار لعبة واحدة على الأقل!",

    // Connection
    conn_copied:         "تم النسخ!",
    conn_sent:           "تم الإرسال!",
    conn_lost:           "انقطع الاتصال! جاري إعادة الاتصال...",
    conn_reconnecting:   "جاري إعادة الاتصال...",
    conn_room_gone:      "انقطع الاتصال",
    conn_room_gone_text: "غرفة اللعب لم تعد موجودة.",
    conn_room_closed:    "الغرفة مغلقة",
    conn_room_closed_text: "غادر جميع اللاعبين.",

    // Round / General game
    round_transition:    "الانتقال إلى الجولة",
    starting:            "يبدأ!",
    finished:            "انتهى",
    scores:              "النتائج",
    your_turn:           "دورك!",
    writing:             "يكتب...",
    spectator_msg:       "أنت تشاهد. انقر على مكان فارغ للانضمام.",
    waiting_host:        "في انتظار المضيف لبدء اللعبة...",
    error_count:         "أخطاء",
    error_eliminate:     "20 خطأ = إقصاء!",

    // Telepati
    telepati_your_turn:  "دورك! 🚀",

    // Isim Sehir
    is_starting:         "اسم مدينة تبدأ!",
    is_fill_all:         "دورك! 🚀 املأ الكل",

    // Pictionary
    pic_draw:            "ارسم! الجميع سيخمن",
    pic_guess:           "خمّن!",
    pic_drawing:         "يرسم",
    pic_guessing:        "يخمّن",
    pic_draw_you:        "ارسم!",
    pic_you_drawing:     "(أنت) ترسم",
    pic_correct:         "خمّن صح!",
    pic_points:          "نقاط",
    pic_place:           "ترتيب",

    // Tabu
    tabu_starting:       "تابو تبدأ!",
    tabu_guess:          "خمّن!",
    tabu_describing:     "يصف",
    tabu_correct:        "صحيح!",
    tabu_forbidden:      "كلمة محظورة!",
    tabu_forbidden_used: "استخدم كلمة محظورة:",
    tabu_word_skipped:   "تم تخطي الكلمة!",
    tabu_pass:           "تخطي",
    tabu_skipped:        "تم التخطي",
    tabu_time_up:        "انتهى الوقت!",

    // Imposter
    imp_impostor:        "المحتال",
    imp_hint:            "تلميح:",
    imp_submitted:       "أرسل",
    imp_round1:          "إجابات الجولة 1",
    imp_round2:          "إجابات الجولة 2",
    imp_voted:           "صوّت",
    imp_caught:          "تم القبض على المحتال!",
    imp_won:             "المحتال فاز!",
    imp_was:             "كان المحتال!",
    imp_result:          "النتيجة",

    // Sayi Tahmin
    st_enter_digit:      "أرقام مطلوبة!",
    st_same_digits:      "لا يمكن أن تكون جميع الأرقام متشابهة!",
    st_title:            "تخمين الرقم",
    st_digits:           "أرقام",
    st_enter_secret:     "أدخل رقمك السري",
    st_pick_digits:      "أرقام من 0 إلى 9",
    st_pick_number:      "رقم",
    st_enter_secret_btn: "أدخل الرقم السري! 🔒",
    st_selecting:        "يختار...",
    st_players_selecting: "اللاعبون يختارون أرقامهم السرية...",
    st_guess_number:     "خمّن رقم اللاعب! 🎯",
    st_guess_digit:      "رقم",
    st_players_guessing: "اللاعبون يخمنون أرقام بعضهم...",
    st_guess_p1:         "خمّن رقم اللاعب 1! 🎯",
    st_opponent_sent:    "الخصم أرسل تخمينه! في انتظارك...",
    st_new_guess:        "🎯 أدخل تخميناً جديداً!",

    // Server error messages
    err_room_not_found:  "الغرفة غير موجودة!",
    err_only_host_start: "فقط المضيف يمكنه بدء اللعبة!",
    err_imposter_tek:    "المحتال متاح فقط في الوضع الفردي!",
    err_imposter_min3:   "المحتال يتطلب 3 لاعبين على الأقل!",
    err_tek_pictionary:  "فقط الرسم متاح في الوضع الفردي!",
    err_min2_players:    "يجب وجود لاعبين على الأقل!",
    err_not_enough_teams: "لا توجد فرق كافية!",
    err_only_host_settings: "فقط المضيف يمكنه تغيير الإعدادات!",
    err_room_inactive:   "تم إغلاق الغرفة بسبب عدم النشاط.",
    err_wait_opponent:   "انتظر تخمين خصمك!",
    err_enter_digit:     "أرقام مطلوبة!",
    err_same_digits:     "لا يمكن أن تكون جميع الأرقام متشابهة!",

    // Game over
    go_eliminated:       "تم الإقصاء! 💀",
    go_all_eliminated:   "تم إقصاء الجميع! 💀",

    // Pass & Play
    pp_player2:          "اللاعب 2",
    pp_give_phone:       "أعطِ الهاتف لـ {name}",
    pp_wait:             "انتظر لحظة!",
    pp_select_couples:   "اختر عدد الأزواج أولاً 💑",
    pp_select_players:   "اختر عدد اللاعبين أولاً 🧑‍🤝‍🧑",
    pp_got_it:           "فهمت! 👍",
    pp_imp_min3:         "المحتال يتطلب 3 لاعبين على الأقل!",
    pp_imp_min3_text:    "يرجى اختيار 3 لاعبين على الأقل",
    btn_ok:              "حسناً",

    // Game names
    game_telepati:       "تخاطر",
    game_isim_sehir:     "اسم مدينة",
    game_pictionary:     "ارسم وخمّن",
    game_tabu:           "تابو",
    game_imposter:       "المحتال",
    game_sayi_tahmin:    "تخمين الرقم",
    game_settings:       " - إعدادات",

    // Room / Lobby
    host_label:          "المضيف",
    join_slot:           "+ انضم",
    spectators:          "المشاهدون",
    lobby_select_team:   "اللوبي (اختر فريق)",
    players_label:       "اللاعبون",
    you_label:           "أنت",
    host_changed:        "تغيّر المضيف",
    new_host:            "أصبح المضيف الجديد!",

    // Share
    share_msg:           "تعال العب DuoDuels! 💖\n\nرمز الغرفة: {code}\n\n{url}",
    share_title:         "ادعُ أصدقاءك",

    // General game
    round_label:         "الجولة:",
    playing:             "يلعبون...",
    submitted:           "أرسل!",
    match_yes:           "تطابق! ✅",
    match_no:            "لا تطابق ❌",
    retry:               "إعادة...",
    points_suffix:       " نقاط",
    matched:             "تطابق!",
    round_n:             "الجولة",
    you_won:             "فزتم! 🏆",
    last_standing:       "آخر فريق صامد!",
    least_errors:        "أقل أخطاء!",
    great_job:           "رائعون! 💪",
    you_lost:            "خسرتم 😔",
    winner_prefix:       "الفائز: ",
    winner_suffix:       " فاز!",
    next_time:           "في المرة القادمة! 💪",
    btn_retry:           "حاول مجدداً",
    game_over:           "انتهت اللعبة! 🏆",
    example_prefix:      "مثال: ",
    score_wins:          "أكثر نقاط يفوز! 🏆",

    // Pictionary specific
    pic_starting:        "ارسم وخمّن تبدأ!",
    pic_first_guess:     "أول من يخمّن يحصل على أكثر نقاط! 🏆",
    pic_word:            "الكلمة:",
    pic_correct_title:   "صحيح!",
    pic_answer:          "الجواب:",
    pic_describe:        "صِف!",
    pic_will_guess:      "سيخمّن",

    // Tabu specific
    tabu_most_words:     "أكثر كلمات مخمّنة يفوز! 🏆",
    tabu_correct_title:  "صحيح!",

    // Imposter specific
    imp_starting:        "المحتال تبدأ!",
    imp_write_round1:    "الجولة 1 كتابة",
    imp_write_round2:    "الجولة 2 كتابة",
    imp_watching:        "تشاهدون...",
    imp_word:            "الكلمة",
    imp_you_impostor:    "أنت المحتال! لا تنكشف! 🕵️",
    imp_write_clue:      "اكتب شيئاً عن الكلمة! 🔍",
    imp_answers_revealed: "تم كشف الإجابات!",
    imp_round2_prep:     "تجهيز الجولة 2...",
    imp_vote_prep:       "تجهيز التصويت...",
    imp_round2_impostor: "الجولة 2 - اكتب مجدداً! لا تنكشف! 🕵️",
    imp_round2_normal:   "الجولة 2 - اكتب شيئاً آخر! 🔍",
    imp_vote_phase:      "التصويت",
    imp_vote_prompt:     "من هو المحتال؟ صوّت! 🗳️",
    imp_votes:           "أصوات",

    // Sayi Tahmin specific
    st_only_digits:      "أدخل أرقاماً فقط!",
    st_waiting:          "في انتظار الخصم...",
    st_vs:               "ضد",
    st_example:          "مثال:",
    st_partner_ready:    "الخصم أدخل، في انتظارك!",
    st_me:               "(أنا)",
    st_guessing:         "يخمّنون!",
    st_round_tie:        "إعادة الجولة!",
    st_both_guessed:     "كلاهما خمّن في {count} محاولات!",
    btn_continue_game:   "متابعة",
    st_you_won:          "خمّنت!",
    st_player_won:       "خمّن!",
    st_in_guesses:       "محاولات للتخمين!",
    st_great:            "رائع! 💪",
    st_rounds_done:      "جولات مكتملة",

    // Matchmaking server
    mm_server_searching: "البحث عن خصم...",
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
  _setText('auth-or-text',         t('auth_or'));
  _setText('btn-text-skip',        t('auth_skip'));
  _setText('auth-skip-note',       t('auth_skip_note'));

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
