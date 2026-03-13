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
    auth_slogan:         "Çiftler için en eğlenceli bilgi yarışması!",
    how_to_play:         "NASIL OYNANIR?",
    nav_login:           "GİRİŞ YAP",
    nav_play:            "HEMEN OYNA",
    htp_isim_sehir:      "Verilen harfle isim, şehir, hayvan, renk gibi kategorilere kelime bul!",
    htp_tabu:            "Yasaklı kelimeleri kullanmadan verilen kelimeyi anlat!",
    htp_pictionary:      "Çizilen resmi tahmin et veya sen çiz, karşı taraf tahmin etsin!",
    htp_emoji:           "Emojilerden filmi, şarkıyı veya kelimeyi tahmin et!",
    htp_duello:          "Bilgi sorularıyla rakibine karşı yarış!",
    auth_required_title: "Giriş Gerekli",
    auth_required_text:  "Rastgele Eşleş için Google veya Facebook ile giriş yapmalısın.",
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
    mode_private_sub:    "QR veya kod ile arkadaşlarını davet et",
    mode_random:         "Rastgele Eşleş",
    mode_random_sub:     "Online partner bul ve diğer çiftlerle yarış",
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
    game_bil_bakalim:    "Bil Bakalım",
    game_settings:       " - Ayarlar",

    // Bil Bakalım
    bb_question_no:      "Soru",
    bb_target_score:     "Hedef:",
    bb_your_turn:        "Sıra sende — tahmini yaz!",
    bb_watching:         "İzliyorsunuz...",
    bb_ph_answer:        "Tahminin...",
    bb_send:             "Gönder 🎯",
    bb_answered:         "Cevabın alındı ✓",
    bb_opponent_answered:"Rakip cevapladı ✓",
    bb_correct_answer:   "Doğru Cevap:",
    bb_men_group:        "💙 Erkekler",
    bb_women_group:      "🩷 Kadınlar",
    bb_point_earned:     "Bu çift +1 puan kazandı!",
    bb_tie:              "Beraberlik — puan verilmedi",
    bb_wins:             "kazandı!",
    bb_final_rankings:   "Final Sonuçları 🏆",
    bb_champion:         "Şampiyon Çift",
    bb_back_lobby:       "Lobiye Dön",

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

    // Friends
    friends_title:         "Arkadaşlar",
    friends_code_label:    "Arkadaş Kodun",
    friends_code_placeholder: "Arkadaş kodunu gir",
    friends_send_btn:      "Ekle",
    friends_tab_list:      "Arkadaşlar",
    friends_tab_requests:  "İstekler",
    friends_online:        "Çevrimiçi",
    friends_offline:       "Çevrimdışı",
    friends_in_game:       "Oyunda",
    friends_invite:        "Davet Et",
    friends_remove:        "Kaldır",
    friends_remove_confirm:"'{name}' adlı arkadaşı kaldırmak istediğinden emin misin?",
    friends_request_sent:  "İstek Gönderildi!",
    friends_request_accepted: "arkadaşlık isteğini kabul etti!",
    friends_request_received_hint: "sana arkadaşlık isteği gönderdi!",
    friends_already_friends:"Zaten arkadaşsınız!",
    friends_request_pending:"İstek zaten gönderilmiş!",
    friends_not_found:     "Kullanıcı bulunamadı.",
    friends_cant_add_self: "Kendini ekleyemezsin!",
    friends_code_invalid:  "Geçerli bir arkadaş kodu gir.",
    friends_invite_received:"seni oyuna davet ediyor!",
    friends_invite_sent:   "Davet gönderildi!",
    friends_invite_title:  "Arkadaş Davet Et",
    friends_no_online:     "Çevrimiçi arkadaşın yok.",
    friends_empty:         "Henüz arkadaşın yok.",
    friends_requests_empty:"Bekleyen istek yok.",
    friends_lobby_title:   "Arkadaşlar",
    friends_lobby_sub:     "Arkadaş ekle, davet et",
    // Stats
    stats_title:           "İstatistikler",
    stats_lobby_title:     "İstatistikler",
    stats_lobby_sub:       "Oyun geçmişin ve başarıların",
    stats_games_played:    "Oyun",
    stats_games_won:       "Galibiyet",
    stats_win_rate:        "Kazanma",
    stats_best_streak:     "En İyi Seri",
    stats_by_game:         "Oyun Türlerine Göre",
    stats_recent:          "Son Oyunlar",
    stats_no_games:        "Henüz oyun geçmişi yok.",
    // Leaderboard
    lb_title:              "Liderlik Tablosu",
    lb_lobby_title:        "Liderlik Tablosu",
    lb_lobby_sub:          "En iyi oyuncuları gör",
    lb_tab_global:         "Global",
    lb_tab_friends:        "Arkadaşlar",
    lb_sort_wins:          "En Çok Galibiyet",
    lb_sort_played:        "En Çok Oyun",
    lb_sort_streak:        "En İyi Seri",
    lb_empty:              "Henüz veri yok.",
    // Sound settings
    settings_sound:        "Ses Efektleri",
    settings_sound_label:  "Ses efektleri",
    settings_haptics_label:"Titreşim",
    // Achievements
    stats_ach_title:       "Başarımlar",
    achievement_unlocked:  "Başarım Açıldı!",
    ach_first_game:        "İlk Oyun",
    ach_first_win:         "İlk Galibiyet",
    ach_games_5:           "5 Oyun",
    ach_games_10:          "10 Oyun",
    ach_games_25:          "25 Oyun",
    ach_games_50:          "50 Oyun",
    ach_games_100:         "100 Oyun",
    ach_wins_5:            "5 Galibiyet",
    ach_wins_10:           "10 Galibiyet",
    ach_wins_25:           "25 Galibiyet",
    ach_streak_3:          "3'lü Seri",
    ach_streak_5:          "5'li Seri",
    ach_streak_10:         "10'lu Seri",
    ach_all_games:         "Hepsini Oynadı",
    ach_friend_1:          "İlk Arkadaş",
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
    auth_slogan:         "The most fun trivia game for couples!",
    how_to_play:         "HOW TO PLAY?",
    nav_login:           "SIGN IN",
    nav_play:            "PLAY NOW",
    htp_isim_sehir:      "Find words for categories like name, city, animal with the given letter!",
    htp_tabu:            "Describe the word without using the forbidden words!",
    htp_pictionary:      "Guess the drawing or draw for your partner to guess!",
    htp_emoji:           "Guess the movie, song, or word from emojis!",
    htp_duello:          "Compete against your rival with trivia questions!",
    auth_required_title: "Login Required",
    auth_required_text:  "You need to sign in with Google or Facebook for Random Match.",
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
    mode_private_sub:    "Invite friends via QR or room code",
    mode_random:         "Random Match",
    mode_random_sub:     "Find a partner online and compete with other couples",
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
    game_bil_bakalim:    "Bil Bakalım",
    game_settings:       " - Settings",

    // Bil Bakalım
    bb_question_no:      "Question",
    bb_target_score:     "Target:",
    bb_your_turn:        "Your turn — enter your guess!",
    bb_watching:         "Watching...",
    bb_ph_answer:        "Your guess...",
    bb_send:             "Send 🎯",
    bb_answered:         "Answer received ✓",
    bb_opponent_answered:"Opponent answered ✓",
    bb_correct_answer:   "Correct Answer:",
    bb_men_group:        "💙 Men",
    bb_women_group:      "🩷 Women",
    bb_point_earned:     "This couple earned +1 point!",
    bb_tie:              "Tie — no point awarded",
    bb_wins:             "wins!",
    bb_final_rankings:   "Final Results 🏆",
    bb_champion:         "Champion Couple",
    bb_back_lobby:       "Back to Lobby",

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

    // Friends
    friends_title:         "Friends",
    friends_code_label:    "Your Friend Code",
    friends_code_placeholder: "Enter friend code",
    friends_send_btn:      "Add",
    friends_tab_list:      "Friends",
    friends_tab_requests:  "Requests",
    friends_online:        "Online",
    friends_offline:       "Offline",
    friends_in_game:       "In Game",
    friends_invite:        "Invite",
    friends_remove:        "Remove",
    friends_remove_confirm:"Are you sure you want to remove '{name}'?",
    friends_request_sent:  "Request Sent!",
    friends_request_accepted: "accepted your friend request!",
    friends_request_received_hint: "sent you a friend request!",
    friends_already_friends:"You're already friends!",
    friends_request_pending:"Request already sent!",
    friends_not_found:     "User not found.",
    friends_cant_add_self: "You can't add yourself!",
    friends_code_invalid:  "Enter a valid friend code.",
    friends_invite_received:"is inviting you to a game!",
    friends_invite_sent:   "Invite sent!",
    friends_invite_title:  "Invite Friend",
    friends_no_online:     "No friends online.",
    friends_empty:         "No friends yet.",
    friends_requests_empty:"No pending requests.",
    friends_lobby_title:   "Friends",
    friends_lobby_sub:     "Add friends, invite to games",
    // Stats
    stats_title:           "Statistics",
    stats_lobby_title:     "Statistics",
    stats_lobby_sub:       "Your game history and achievements",
    stats_games_played:    "Games",
    stats_games_won:       "Wins",
    stats_win_rate:        "Win Rate",
    stats_best_streak:     "Best Streak",
    stats_by_game:         "By Game Type",
    stats_recent:          "Recent Games",
    stats_no_games:        "No game history yet.",
    // Leaderboard
    lb_title:              "Leaderboard",
    lb_lobby_title:        "Leaderboard",
    lb_lobby_sub:          "See the best players",
    lb_tab_global:         "Global",
    lb_tab_friends:        "Friends",
    lb_sort_wins:          "Most Wins",
    lb_sort_played:        "Most Games",
    lb_sort_streak:        "Best Streak",
    lb_empty:              "No data yet.",
    // Sound settings
    settings_sound:        "Sound Effects",
    settings_sound_label:  "Sound effects",
    settings_haptics_label:"Vibration",
    // Achievements
    stats_ach_title:       "Achievements",
    achievement_unlocked:  "Achievement Unlocked!",
    ach_first_game:        "First Game",
    ach_first_win:         "First Win",
    ach_games_5:           "5 Games",
    ach_games_10:          "10 Games",
    ach_games_25:          "25 Games",
    ach_games_50:          "50 Games",
    ach_games_100:         "100 Games",
    ach_wins_5:            "5 Wins",
    ach_wins_10:           "10 Wins",
    ach_wins_25:           "25 Wins",
    ach_streak_3:          "3-Win Streak",
    ach_streak_5:          "5-Win Streak",
    ach_streak_10:         "10-Win Streak",
    ach_all_games:         "Played All Games",
    ach_friend_1:          "First Friend",
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
    auth_slogan:         "أكثر لعبة معلومات ممتعة للأزواج!",
    how_to_play:         "كيف تلعب؟",
    nav_login:           "تسجيل الدخول",
    nav_play:            "العب الآن",
    htp_isim_sehir:      "اعثر على كلمات للفئات مثل الاسم والمدينة والحيوان بالحرف المعطى!",
    htp_tabu:            "صِف الكلمة دون استخدام الكلمات المحظورة!",
    htp_pictionary:      "خمّن الرسم أو ارسم ليخمّن شريكك!",
    htp_emoji:           "خمّن الفيلم أو الأغنية أو الكلمة من الرموز التعبيرية!",
    htp_duello:          "تنافس ضد خصمك بأسئلة المعلومات!",
    auth_required_title: "تسجيل الدخول مطلوب",
    auth_required_text:  "يجب تسجيل الدخول عبر Google أو Facebook للمطابقة العشوائية.",
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
    mode_private_sub:    "ادعُ أصدقاءك عبر QR أو رمز الغرفة",
    mode_random:         "مطابقة عشوائية",
    mode_random_sub:     "ابحث عن شريك وتنافس مع أزواج آخرين",
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
    game_bil_bakalim:    "بيل بَكَلِم",
    game_settings:       " - إعدادات",

    // Bil Bakalım
    bb_question_no:      "سؤال",
    bb_target_score:     "الهدف:",
    bb_your_turn:        "دورك — أدخل تخمينك!",
    bb_watching:         "يشاهد...",
    bb_ph_answer:        "تخمينك...",
    bb_send:             "إرسال 🎯",
    bb_answered:         "تم استلام الإجابة ✓",
    bb_opponent_answered:"أجاب الخصم ✓",
    bb_correct_answer:   "الإجابة الصحيحة:",
    bb_men_group:        "💙 الرجال",
    bb_women_group:      "🩷 النساء",
    bb_point_earned:     "هذا الزوج ربح نقطة!",
    bb_tie:              "تعادل — لا نقاط",
    bb_wins:             "فاز!",
    bb_final_rankings:   "النتائج النهائية 🏆",
    bb_champion:         "الزوج البطل",
    bb_back_lobby:       "العودة إلى اللوبي",

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

    // Friends
    friends_title:         "الأصدقاء",
    friends_code_label:    "رمز صديقك",
    friends_code_placeholder: "أدخل رمز الصديق",
    friends_send_btn:      "إضافة",
    friends_tab_list:      "الأصدقاء",
    friends_tab_requests:  "الطلبات",
    friends_online:        "متصل",
    friends_offline:       "غير متصل",
    friends_in_game:       "في اللعبة",
    friends_invite:        "دعوة",
    friends_remove:        "إزالة",
    friends_remove_confirm:"هل أنت متأكد من إزالة '{name}'؟",
    friends_request_sent:  "تم إرسال الطلب!",
    friends_request_accepted: "قبل طلب صداقتك!",
    friends_request_received_hint: "أرسل لك طلب صداقة!",
    friends_already_friends:"أنتما أصدقاء بالفعل!",
    friends_request_pending:"تم إرسال الطلب مسبقاً!",
    friends_not_found:     "المستخدم غير موجود.",
    friends_cant_add_self: "لا يمكنك إضافة نفسك!",
    friends_code_invalid:  "أدخل رمز صديق صالح.",
    friends_invite_received:"يدعوك إلى لعبة!",
    friends_invite_sent:   "تم إرسال الدعوة!",
    friends_invite_title:  "دعوة صديق",
    friends_no_online:     "لا أصدقاء متصلين.",
    friends_empty:         "لا أصدقاء بعد.",
    friends_requests_empty:"لا طلبات معلقة.",
    friends_lobby_title:   "الأصدقاء",
    friends_lobby_sub:     "أضف أصدقاء، ادعُهم للعب",
    // Stats
    stats_title:           "الإحصائيات",
    stats_lobby_title:     "الإحصائيات",
    stats_lobby_sub:       "سجل ألعابك وإنجازاتك",
    stats_games_played:    "ألعاب",
    stats_games_won:       "انتصارات",
    stats_win_rate:        "نسبة الفوز",
    stats_best_streak:     "أفضل سلسلة",
    stats_by_game:         "حسب نوع اللعبة",
    stats_recent:          "الألعاب الأخيرة",
    stats_no_games:        "لا يوجد سجل ألعاب بعد.",
    // Leaderboard
    lb_title:              "لوحة المتصدرين",
    lb_lobby_title:        "لوحة المتصدرين",
    lb_lobby_sub:          "شاهد أفضل اللاعبين",
    lb_tab_global:         "عالمي",
    lb_tab_friends:        "الأصدقاء",
    lb_sort_wins:          "أكثر انتصارات",
    lb_sort_played:        "أكثر ألعاب",
    lb_sort_streak:        "أفضل سلسلة",
    lb_empty:              "لا توجد بيانات بعد.",
    // Sound settings
    settings_sound:        "المؤثرات الصوتية",
    settings_sound_label:  "المؤثرات الصوتية",
    settings_haptics_label:"الاهتزاز",
    // Achievements
    stats_ach_title:       "الإنجازات",
    achievement_unlocked:  "تم فتح إنجاز!",
    ach_first_game:        "أول لعبة",
    ach_first_win:         "أول فوز",
    ach_games_5:           "5 ألعاب",
    ach_games_10:          "10 ألعاب",
    ach_games_25:          "25 لعبة",
    ach_games_50:          "50 لعبة",
    ach_games_100:         "100 لعبة",
    ach_wins_5:            "5 انتصارات",
    ach_wins_10:           "10 انتصارات",
    ach_wins_25:           "25 انتصار",
    ach_streak_3:          "سلسلة 3",
    ach_streak_5:          "سلسلة 5",
    ach_streak_10:         "سلسلة 10",
    ach_all_games:         "لعب الكل",
    ach_friend_1:          "أول صديق",
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
  _setText('auth-slogan',          t('auth_slogan'));
  _setText('how-to-play-btn',      t('how_to_play'));
  _setText('nav-login-btn',        t('nav_login'));
  _setText('nav-play-btn',         t('nav_play'));
  _setText('htp-title',            t('how_to_play'));
  _setText('htp-desc-1',           t('htp_isim_sehir'));
  _setText('htp-desc-2',           t('htp_tabu'));
  _setText('htp-desc-3',           t('htp_pictionary'));
  _setText('htp-desc-4',           t('htp_emoji'));
  _setText('htp-desc-5',           t('htp_duello'));
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

  // Bil Bakalım screen (static elements)
  _setAttr('bb-answer-input', 'placeholder', t('bb_ph_answer'));
  _setText('bb-send-btn', t('bb_send'));

  // Friends
  _setText('friends-title',       t('friends_title'));
  _setText('friends-code-label',  t('friends_code_label'));
  _setAttr('friend-code-input', 'placeholder', t('friends_code_placeholder'));
  _setText('friends-send-btn',    t('friends_send_btn'));
  _setText('friends-tab-list',    t('friends_tab_list'));
  _setText('friends-empty-msg',   t('friends_empty'));
  _setText('friends-requests-empty-msg', t('friends_requests_empty'));
  _setText('lmc-title-friends',   t('friends_lobby_title'));
  _setText('lmc-sub-friends',     t('friends_lobby_sub'));

  // Stats screen
  _setText('stats-title',          t('stats_title'));
  _setText('stat-label-played',    t('stats_games_played'));
  _setText('stat-label-won',       t('stats_games_won'));
  _setText('stat-label-winrate',   t('stats_win_rate'));
  _setText('stat-label-streak',    t('stats_best_streak'));
  _setText('stats-by-game-title',  t('stats_by_game'));
  _setText('stats-recent-title',   t('stats_recent'));
  _setText('stats-no-games',       t('stats_no_games'));
  _setText('lmc-title-stats',      t('stats_lobby_title'));
  _setText('lmc-sub-stats',        t('stats_lobby_sub'));

  // Achievements
  _setText('stats-ach-title',      t('stats_ach_title'));

  // Sound settings
  _setText('settings-sound-sec',   t('settings_sound'));
  _setText('settings-sound-label', t('settings_sound_label'));
  _setText('settings-haptics-label', t('settings_haptics_label'));

  // Leaderboard screen
  _setText('leaderboard-title',    t('lb_title'));
  _setText('lb-tab-global-text',   t('lb_tab_global'));
  _setText('lb-tab-friends-text',  t('lb_tab_friends'));
  _setText('lmc-title-leaderboard', t('lb_lobby_title'));
  _setText('lmc-sub-leaderboard',  t('lb_lobby_sub'));
  // Leaderboard select options
  const lbSortWins = document.getElementById('lb-sort-wins');
  const lbSortPlayed = document.getElementById('lb-sort-played');
  const lbSortStreak = document.getElementById('lb-sort-streak');
  if (lbSortWins) lbSortWins.textContent = t('lb_sort_wins');
  if (lbSortPlayed) lbSortPlayed.textContent = t('lb_sort_played');
  if (lbSortStreak) lbSortStreak.textContent = t('lb_sort_streak');

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
