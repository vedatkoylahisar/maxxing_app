using System.ComponentModel.DataAnnotations;

namespace maxxing_app.Contracts;

public record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, RegularExpression("^[a-zA-Z0-9_.]{3,20}$",
        ErrorMessage = "Kullanıcı adı 3-20 karakter olmalı; sadece harf, rakam, _ ve . içerebilir.")]
    string UserName,
    [Required, MinLength(8), MaxLength(128)] string Password);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password);

public record UserResponse(Guid Id, string Email, string UserName, DateTime CreatedAt);

public record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
