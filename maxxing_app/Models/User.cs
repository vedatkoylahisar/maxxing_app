using maxxing_app.Localization;

namespace maxxing_app.Models;

public class User
{
    public Guid Id { get; set; }

    // Küçük harfe çevrilmiş olarak saklanır.
    public required string Email { get; set; }

    // Küçük harfe çevrilmiş olarak saklanır.
    public required string UserName { get; set; }

    public string PasswordHash { get; set; } = "";

    // Boşsa kullanıcı adı gösterilir.
    public string? DisplayName { get; set; }

    public string? Bio { get; set; }

    // "Ne için buradasın?": listedeki alanların anahtarı (örn. "yks") ya da kullanıcının kendi yazdığı alan.
    public List<string> Areas { get; set; } = [];

    // IANA saat dilimi (örn. "Europe/Istanbul"). "Bugün"ün hangi gün olduğu buna göre hesaplanır.
    public string TimeZone { get; set; } = UserClock.DefaultTimeZone;

    // "tr" ya da "en": kullanıcının uygulamayı en son kullandığı dil (kayıt ve girişte güncellenir). Mailler bu dilde gider.
    public string Language { get; set; } = Languages.Default;

    // Boşsa e-posta henüz onaylanmamıştır; kullanıcı kodu girene kadar uygulamaya giremez.
    public DateTime? EmailVerifiedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
