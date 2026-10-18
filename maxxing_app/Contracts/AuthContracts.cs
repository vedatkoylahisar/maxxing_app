using System.ComponentModel.DataAnnotations;

namespace maxxing_app.Contracts;

public record RegisterRequest(
    [Required(ErrorMessage = "EmailRequired")]
    [EmailAddress(ErrorMessage = "EmailInvalid")]
    [MaxLength(256, ErrorMessage = "EmailTooLong")]
    string Email,
    [Required(ErrorMessage = "UserNameRequired")]
    [RegularExpression("^[a-zA-Z0-9_.]{3,20}$",
        ErrorMessage = "UserNameInvalid")]
    string UserName,
    [Required(ErrorMessage = "PasswordRequired")]
    [MinLength(8, ErrorMessage = "PasswordTooShort")]
    [MaxLength(128, ErrorMessage = "PasswordTooLong")]
    string Password,
    // Cihazın IANA saat dilimi (örn. "Europe/Istanbul"). Gönderilmezse ya da geçersizse varsayılan kullanılır.
    [MaxLength(64)] string? TimeZone = null);

public record LoginRequest(
    [Required(ErrorMessage = "EmailRequired")] string Email,
    [Required(ErrorMessage = "PasswordRequired")] string Password);

public record VerifyEmailRequest(
    [Required(ErrorMessage = "CodeRequired")]
    [RegularExpression("^[0-9]{6}$", ErrorMessage = "CodeInvalid")]
    string Code);

public record UserResponse(Guid Id, string Email, string UserName, bool EmailVerified, DateTime CreatedAt);

public record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
