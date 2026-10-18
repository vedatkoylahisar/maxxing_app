using System.ComponentModel.DataAnnotations;

namespace maxxing_app.Contracts;

public record RegisterRequest(
    [Required(ErrorMessage = "E-posta gerekli.")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta gir.")]
    [MaxLength(256, ErrorMessage = "E-posta en fazla 256 karakter olabilir.")]
    string Email,
    [Required(ErrorMessage = "Kullanıcı adı gerekli.")]
    [RegularExpression("^[a-zA-Z0-9_.]{3,20}$",
        ErrorMessage = "Kullanıcı adı 3-20 karakter olmalı; sadece harf, rakam, _ ve . içerebilir.")]
    string UserName,
    [Required(ErrorMessage = "Şifre gerekli.")]
    [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalı.")]
    [MaxLength(128, ErrorMessage = "Şifre en fazla 128 karakter olabilir.")]
    string Password,
    // Cihazın IANA saat dilimi (örn. "Europe/Istanbul"). Gönderilmezse ya da geçersizse varsayılan kullanılır.
    [MaxLength(64)] string? TimeZone = null);

public record LoginRequest(
    [Required(ErrorMessage = "E-posta gerekli.")] string Email,
    [Required(ErrorMessage = "Şifre gerekli.")] string Password);

public record VerifyEmailRequest(
    [Required(ErrorMessage = "Kod gerekli.")]
    [RegularExpression("^[0-9]{6}$", ErrorMessage = "Kod 6 haneli olmalı.")]
    string Code);

public record UserResponse(Guid Id, string Email, string UserName, bool EmailVerified, DateTime CreatedAt);

public record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
