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
    string Password);

public record LoginRequest(
    [Required(ErrorMessage = "E-posta gerekli.")] string Email,
    [Required(ErrorMessage = "Şifre gerekli.")] string Password);

public record UserResponse(Guid Id, string Email, string UserName, DateTime CreatedAt);

public record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
