/**
 * CONFIG.JS - Konfigurasi Manual Sistem Monitoring Pterodactyl
 * 
 * Anda dapat mengedit file ini secara langsung menggunakan file manager atau text editor VPS.
 * Perubahan pada file ini akan otomatis terbaca saat sistem dijalankan.
 */

module.exports = {
  // === CONFIG BOT TELEGRAM ===
  // Token bot Telegram Anda (Dapatkan dari @BotFather)
  token: "",

  // ID Owner / Chat ID penerima alert Telegram
  ownerId: "",

  // === CONFIG PANEL PTERODACTYL ===
  // Domain panel Pterodactyl Anda (Sertakan http:// atau https://)
  // Contoh: "https://panel.xyzhosting.com"
  domain: "https://panel.example.com",

  // Pterodactyl Application API Key (Diawali dengan 'ptla_')
  // Digunakan untuk mengakses kontrol administratif seluruh server
  ptla: "",

  // Pterodactyl Client API Key (Diawali dengan 'ptlc_')
  // Digunakan untuk mengakses server yang terhubung di akun client Anda
  ptlc: "",

  // === THRESHOLD MONITORING LIMITS (BATAS ALARM) ===
  // Batas penggunaan CPU (%) sebelum mengirim peringatan
  cpuLimit: 80,

  // Batas penggunaan RAM (%) sebelum mengirim peringatan
  ramLimit: 90,

  // Batas penggunaan Disk (%) sebelum mengirim peringatan
  diskLimit: 85,

  // === SYSTEM TUNING ===
  // Interval scan API Key Pterodactyl untuk memantau status kontainer/server (dalam menit)
  // Contoh: 5 berarti scan setiap 5 menit
  scanInterval: 5
};
