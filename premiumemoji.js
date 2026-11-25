// =================================================================
//  KAMUS EMOJI PREMIUM CUSTOM (Telegram Bot API)
// =================================================================
//  File terpisah agar ID emoji premium mudah di-maintain / di-set
//  secara manual tanpa harus edit server.ts.
//
//  CARA PAKAI dari server.ts:
//    import { EMOJI_POOL, getEmojiTag, ALL_PREMIUM_IDS } from "./premiumemoji.js";
//    const html = `<h3>${getEmojiTag("fire")} Heading</h3>`;
//
//  Atau langsung pakai ID:
//    const html = `<tg-emoji emoji-id="${EMOJI_POOL.fire.id}"></tg-emoji>`;
//
//  SUMBER ID:
//    - Topics       — 112 ID via getForumTopicIconStickers
//    - HandEmoji    — emoji jempol standar Telegram
//    - Tambah sendiri pakai getCustomEmojiStickers / dari pesan
//      chat yang memuat premium emoji.
//
//  CATATAN:
//    - Premium emoji hanya render animasi di pengguna Telegram
//      Premium; user non-premium melihat emoji fallback standar
//      sesuai field `emoji`.
//    - Untuk set/ganti ID manual: edit nilai `id` di object
//      `EMOJI_POOL` di bawah, atau tambahkan key baru.
// =================================================================

export const EMOJI_POOL = {
  // ---- Umum / UI ----
  fire:        { id: "5312241539987020022", emoji: "🔥",  set: "Topics",    desc: "Api / performa tinggi / LIVE / welcome" },
  bolt:        { id: "5312016608254762256", emoji: "⚡️", set: "Topics",    desc: "Petir / kecepatan / bandwidth" },
  alert:       { id: "5379748062124056162", emoji: "❗️", set: "Topics",    desc: "Peringatan / alert" },
  doubleAlert: { id: "5377498341074542641", emoji: "‼️",  set: "Topics",    desc: "Peringatan ganda / bahaya" },
  question:    { id: "5377316857231450742", emoji: "❓",  set: "Topics",    desc: "Tanya / info" },
  idea:        { id: "5312536423851630001", emoji: "💡",  set: "Topics",    desc: "Info / bantuan (HELP)" },
  notes:       { id: "5373251851074415873", emoji: "📝",  set: "Topics",    desc: "Catatan / detail (CPU)" },
  search:      { id: "5309965701241379366", emoji: "🔎",  set: "Topics",    desc: "Monitor / cari" },
  megaphone:   { id: "5309984423003823246", emoji: "📣",  set: "Topics",    desc: "Broadcast / announce" },
  speak:       { id: "5370870893004203704", emoji: "🗣",  set: "Topics",    desc: "Speak / suara" },
  mic:         { id: "5377544228505134960", emoji: "🎙",  set: "Topics",    desc: "Mic / broadcast" },
  cool:        { id: "5420216386448270341", emoji: "🆒",  set: "Topics",    desc: "Cool / ok" },
  heart:       { id: "5312138559556164615", emoji: "❤️",  set: "Topics",    desc: "Aktif / online / love" },
  crown:       { id: "5357107601584693888", emoji: "👑",  set: "Topics",    desc: "Crown / premium / VIP" },
  gem:         { id: "5309958691854754293", emoji: "💎",  set: "Topics",    desc: "Gem / premium" },
  trophy:      { id: "5312315739842026755", emoji: "🏆",  set: "Topics",    desc: "Trophy / juara" },
  flag:        { id: "5408906741125490282", emoji: "🏁",  set: "Topics",    desc: "Flag / start" },
  party:       { id: "5310228579009699834", emoji: "🎉",  set: "Topics",    desc: "Party / selamat" },
  check:       { id: "5237699328843200968", emoji: "✅",  set: "Topics",    desc: "Check / success" },
  star:        { id: "5235579393115438657", emoji: "⭐️", set: "Topics",    desc: "Star / bintang" },
  robot:       { id: "5309832892262654231", emoji: "🤖",  set: "Topics",    desc: "Robot / bot" },

  // ---- Sistem / VPS ----
  laptop:      { id: "5350554349074391003", emoji: "💻",  set: "Topics",    desc: "Laptop / komputer (CPU)" },
  phone:       { id: "5409357944619802453", emoji: "📱",  set: "Topics",    desc: "Phone / device" },
  folder:      { id: "5357315181649076022", emoji: "📁",  set: "Topics",    desc: "Folder / data (RAM / DISK)" },
  news:        { id: "5434144690511290129", emoji: "📰",  set: "Topics",    desc: "Berita / info (SWAP)" },
  calendar:    { id: "5433614043006903194", emoji: "📆",  set: "Topics",    desc: "Kalender / uptime" },
  top:         { id: "5418085807791545980", emoji: "🔝",  set: "Topics",    desc: "Top / peak" },
  book:        { id: "5350481781306958339", emoji: "📚",  set: "Topics",    desc: "Books / dokumentasi" },
  chartUp:     { id: "5350305691942788490", emoji: "📈",  set: "Topics",    desc: "Chart naik (TX / upload)" },
  chartDown:   { id: "5350713563512052787", emoji: "📉",  set: "Topics",    desc: "Chart turun (RX / download)" },
  download:    { id: "5350713563512052787", emoji: "📉",  set: "Topics",    desc: "Alias chartDown — RX masuk" },
  upload:      { id: "5350305691942788490", emoji: "📈",  set: "Topics",    desc: "Alias chartUp — TX keluar" },

  // ---- HandEmoji (standar Telegram) ----
  thumbsup:    { id: "5368324170671202286", emoji: "👍",  set: "HandEmoji", desc: "Thumbs up (HandEmoji)" },
};

// Daftar lengkap 112 ID dari set "Topics" (untuk referensi & manual setting).
// Tambahkan sendiri ID dari sticker set lain via getCustomEmojiStickers.
export const ALL_PREMIUM_IDS = [
  { id: "5434144690511290129", emoji: "📰",  set: "Topics" },
  { id: "5312536423851630001", emoji: "💡",  set: "Topics" },
  { id: "5312016608254762256", emoji: "⚡️", set: "Topics" },
  { id: "5377544228505134960", emoji: "🎙",  set: "Topics" },
  { id: "5418085807791545980", emoji: "🔝",  set: "Topics" },
  { id: "5370870893004203704", emoji: "🗣",  set: "Topics" },
  { id: "5420216386448270341", emoji: "🆒",  set: "Topics" },
  { id: "5379748062124056162", emoji: "❗️", set: "Topics" },
  { id: "5373251851074415873", emoji: "📝",  set: "Topics" },
  { id: "5433614043006903194", emoji: "📆",  set: "Topics" },
  { id: "5357315181649076022", emoji: "📁",  set: "Topics" },
  { id: "5309965701241379366", emoji: "🔎",  set: "Topics" },
  { id: "5309984423003823246", emoji: "📣",  set: "Topics" },
  { id: "5312241539987020022", emoji: "🔥",  set: "Topics" },
  { id: "5312138559556164615", emoji: "❤️",  set: "Topics" },
  { id: "5377316857231450742", emoji: "❓",  set: "Topics" },
  { id: "5350305691942788490", emoji: "📈",  set: "Topics" },
  { id: "5350713563512052787", emoji: "📉",  set: "Topics" },
  { id: "5309958691854754293", emoji: "💎",  set: "Topics" },
  { id: "5350452584119279096", emoji: "💰",  set: "Topics" },
  { id: "5309929258443874898", emoji: "💸",  set: "Topics" },
  { id: "5377690785674175481", emoji: "🪙",  set: "Topics" },
  { id: "5310107765874632305", emoji: "💱",  set: "Topics" },
  { id: "5377438129928020693", emoji: "⁉️", set: "Topics" },
  { id: "5309950797704865693", emoji: "🎮",  set: "Topics" },
  { id: "5350554349074391003", emoji: "💻",  set: "Topics" },
  { id: "5409357944619802453", emoji: "📱",  set: "Topics" },
  { id: "5312322066328853156", emoji: "🚗",  set: "Topics" },
  { id: "5312486108309757006", emoji: "🏠",  set: "Topics" },
  { id: "5310029292527164639", emoji: "💘",  set: "Topics" },
  { id: "5310228579009699834", emoji: "🎉",  set: "Topics" },
  { id: "5377498341074542641", emoji: "‼️",  set: "Topics" },
  { id: "5312315739842026755", emoji: "🏆",  set: "Topics" },
  { id: "5408906741125490282", emoji: "🏁",  set: "Topics" },
  { id: "5368653135101310687", emoji: "🎬",  set: "Topics" },
  { id: "5310045076531978942", emoji: "🎵",  set: "Topics" },
  { id: "5420331611830886484", emoji: "🔞",  set: "Topics" },
  { id: "5350481781306958339", emoji: "📚",  set: "Topics" },
  { id: "5357107601584693888", emoji: "👑",  set: "Topics" },
  { id: "5375159220280762629", emoji: "⚽️", set: "Topics" },
  { id: "5384327463629233871", emoji: "🏀",  set: "Topics" },
  { id: "5350513667144163474", emoji: "📺",  set: "Topics" },
  { id: "5357121491508928442", emoji: "👀",  set: "Topics" },
  { id: "5357185426392096577", emoji: "🫦",  set: "Topics" },
  { id: "5310157398516703416", emoji: "🍓",  set: "Topics" },
  { id: "5310262535021142850", emoji: "💄",  set: "Topics" },
  { id: "5368741306484925109", emoji: "👠",  set: "Topics" },
  { id: "5348436127038579546", emoji: "✈️", set: "Topics" },
  { id: "5357120306097956843", emoji: "🧳",  set: "Topics" },
  { id: "5310303848311562896", emoji: "🏖",  set: "Topics" },
  { id: "5350424168615649565", emoji: "⛅️", set: "Topics" },
  { id: "5413625003218313783", emoji: "🦄",  set: "Topics" },
  { id: "5350699789551935589", emoji: "🛍",  set: "Topics" },
  { id: "5377478880577724584", emoji: "👜",  set: "Topics" },
  { id: "5431492767249342908", emoji: "🛒",  set: "Topics" },
  { id: "5350497316203668441", emoji: "🚂",  set: "Topics" },
  { id: "5350422527938141909", emoji: "🛥",  set: "Topics" },
  { id: "5418196338774907917", emoji: "🏔",  set: "Topics" },
  { id: "5350648297189023928", emoji: "🏕",  set: "Topics" },
  { id: "5309832892262654231", emoji: "🤖",  set: "Topics" },
  { id: "5350751634102166060", emoji: "🪩",  set: "Topics" },
  { id: "5377624166436445368", emoji: "🎟",  set: "Topics" },
  { id: "5386395194029515402", emoji: "🏴\u200d☠️", set: "Topics" },
  { id: "5350387571199319521", emoji: "🗳",  set: "Topics" },
  { id: "5357419403325481346", emoji: "🎓",  set: "Topics" },
  { id: "5368585403467048206", emoji: "🔭",  set: "Topics" },
  { id: "5377580546748588396", emoji: "🔬",  set: "Topics" },
  { id: "5377317729109811382", emoji: "🎶",  set: "Topics" },
  { id: "5382003830487523366", emoji: "🎤",  set: "Topics" },
  { id: "5357298525765902091", emoji: "🕺",  set: "Topics" },
  { id: "5357370526597653193", emoji: "💃",  set: "Topics" },
  { id: "5357188789351490453", emoji: "🪖",  set: "Topics" },
  { id: "5348227245599105972", emoji: "💼",  set: "Topics" },
  { id: "5411138633765757782", emoji: "🧪",  set: "Topics" },
  { id: "5386435923204382258", emoji: "👨\u200d👩\u200d👧\u200d👦", set: "Topics" },
  { id: "5377675010259297233", emoji: "👶",  set: "Topics" },
  { id: "5386609083400856174", emoji: "🤰",  set: "Topics" },
  { id: "5368808634392257474", emoji: "💅",  set: "Topics" },
  { id: "5350548830041415279", emoji: "🏛",  set: "Topics" },
  { id: "5355127101970194557", emoji: "🧮",  set: "Topics" },
  { id: "5386379624773066504", emoji: "🖨",  set: "Topics" },
  { id: "5377494501373780436", emoji: "👮\u200d♂️", set: "Topics" },
  { id: "5350307998340226571", emoji: "🩺",  set: "Topics" },
  { id: "5310094636159607472", emoji: "💊",  set: "Topics" },
  { id: "5310139157790596888", emoji: "💉",  set: "Topics" },
  { id: "5377468357907849200", emoji: "🧼",  set: "Topics" },
  { id: "5418115271267197333", emoji: "🪪",  set: "Topics" },
  { id: "5372819184658949787", emoji: "🛃",  set: "Topics" },
  { id: "5350344462612570293", emoji: "🍽",  set: "Topics" },
  { id: "5384574037701696503", emoji: "🐟",  set: "Topics" },
  { id: "5310039132297242441", emoji: "🎨",  set: "Topics" },
  { id: "5350658016700013471", emoji: "🎭",  set: "Topics" },
  { id: "5357504778685392027", emoji: "🎩",  set: "Topics" },
  { id: "5350367161514732241", emoji: "🔮",  set: "Topics" },
  { id: "5350520238444126134", emoji: "🍹",  set: "Topics" },
  { id: "5310132165583840589", emoji: "🎂",  set: "Topics" },
  { id: "5350392020785437399", emoji: "☕️", set: "Topics" },
  { id: "5350406176997646350", emoji: "🍣",  set: "Topics" },
  { id: "5350403544182694064", emoji: "🍔",  set: "Topics" },
  { id: "5350444672789519765", emoji: "🍕",  set: "Topics" },
  { id: "5312424913615723286", emoji: "🦠",  set: "Topics" },
  { id: "5417915203100613993", emoji: "💬",  set: "Topics" },
  { id: "5312054580060625569", emoji: "🎄",  set: "Topics" },
  { id: "5309744892677727325", emoji: "🎃",  set: "Topics" },
  { id: "5238156910363950406", emoji: "✍️", set: "Topics" },
  { id: "5235579393115438657", emoji: "⭐️", set: "Topics" },
  { id: "5237699328843200968", emoji: "✅",  set: "Topics" },
  { id: "5238027455754680851", emoji: "🎖",  set: "Topics" },
  { id: "5238234236955148254", emoji: "🤡",  set: "Topics" },
  { id: "5237889595894414384", emoji: "🧠",  set: "Topics" },
  { id: "5237999392438371490", emoji: "🦮",  set: "Topics" },
  { id: "5235912661102773458", emoji: "🐈",  set: "Topics" },
];

// Helper: hasilkan tag <tg-emoji> siap pakai.
export function getEmojiTag(name) {
  const e = EMOJI_POOL[name];
  if (!e) return "";
  return `<tg-emoji emoji-id="${e.id}"></tg-emoji>`;
}
