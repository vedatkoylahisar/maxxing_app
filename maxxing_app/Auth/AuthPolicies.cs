namespace maxxing_app.Auth;

public static class AuthPolicies
{
    // Token'da e-postanın onaylı olup olmadığı: "true" / "false".
    public const string EmailVerifiedClaim = "email_verified";

    // Varsayılan [Authorize] onaylı e-posta ister. Onaysız hesaplar sadece bu politikayı kullanan
    // endpoint'lere girebilir: /auth/me, kodu gir, kodu tekrar gönder.
    public const string AllowUnverified = "AllowUnverified";
}
