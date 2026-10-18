import i18n from '@/i18n';

// API'deki kurallarla aynı (maxxing_app/Contracts/AuthContracts.cs). Asıl kontrol API'de yapılır;
// bunlar kullanıcıya hatayı istek atmadan, hemen göstermek için.

export function validateEmail(email: string) {
  if (!email.trim()) return i18n.t('validation.emailRequired');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return i18n.t('validation.emailInvalid');
}

export function validateUserName(userName: string) {
  if (!userName) return i18n.t('validation.userNameRequired');
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(userName)) return i18n.t('validation.userNameInvalid');
}

export function validatePassword(password: string) {
  if (!password) return i18n.t('validation.passwordRequired');
  if (password.length < 8) return i18n.t('validation.passwordTooShort');
}
