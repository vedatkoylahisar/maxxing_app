namespace maxxing_app.Models;

public enum EmailCodePurpose
{
    // Kayıttan sonra e-postayı onaylamak için
    EmailVerification,
}

// E-postaya gönderilen 6 haneli kod. Kullanıcı başına her amaç için en fazla bir kod tutulur; yenisi eskisinin yerine geçer.
public class EmailCode
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public EmailCodePurpose Purpose { get; set; }

    // Kodun kendisi saklanmaz, sadece hash'i.
    public required string CodeHash { get; set; }

    public DateTime ExpiresAt { get; set; }

    // Bu kod için yapılan deneme sayısı; sınıra ulaşınca kod geçersiz olur.
    public int Attempts { get; set; }

    // Son gönderim zamanı; "kodu tekrar gönder" bekleme süresi buna göre hesaplanır.
    public DateTime SentAt { get; set; }
}
