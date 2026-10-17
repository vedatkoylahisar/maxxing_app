// API'deki kurallarla aynı (maxxing_app/Contracts/AuthContracts.cs). Asıl kontrol API'de yapılır;
// bunlar kullanıcıya hatayı istek atmadan, hemen göstermek için.

export function validateEmail(email: string) {
  if (!email.trim()) return 'E-posta gerekli.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Geçerli bir e-posta gir.';
}

export function validateUserName(userName: string) {
  if (!userName) return 'Kullanıcı adı gerekli.';
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(userName))
    return '3-20 karakter; sadece harf, rakam, _ ve . kullanabilirsin.';
}

export function validatePassword(password: string) {
  if (!password) return 'Şifre gerekli.';
  if (password.length < 8) return 'Şifre en az 8 karakter olmalı.';
}
