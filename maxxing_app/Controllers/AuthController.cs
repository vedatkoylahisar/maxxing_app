using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Email;
using maxxing_app.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace maxxing_app.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> passwordHasher,
    TokenService tokenService,
    EmailCodeService emailCodes,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var userName = request.UserName.ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu e-posta zaten kayıtlı.");

        if (await db.Users.AnyAsync(u => u.UserName == userName))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu kullanıcı adı alınmış.");

        var user = new User
        {
            Id = Guid.CreateVersion7(),
            Email = email,
            UserName = userName,
            TimeZone = request.TimeZone is { } zone && UserClock.IsValidTimeZone(zone) ? zone : UserClock.DefaultTimeZone,
            CreatedAt = DateTime.UtcNow,
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Yukarıdaki kontrolle kayıt arasında aynı e-posta/kullanıcı adıyla başka biri kaydolduysa.
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Bu e-posta veya kullanıcı adı zaten kayıtlı.");
        }

        // Mail gitmese de hesap açılır; kullanıcı kod ekranından tekrar isteyebilir.
        await TrySendVerificationCode(user);

        return CreateAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email);

        var result = user is null
            ? PasswordVerificationResult.Failed
            : passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "E-posta veya şifre hatalı.");

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user!.PasswordHash = passwordHasher.HashPassword(user, request.Password);
            await db.SaveChangesAsync();
        }

        // Onaylanmamış hesap: elinde geçerli bir kod yoksa (süresi dolmuş, hiç gitmemiş) yenisini gönder.
        if (user!.EmailVerifiedAt is null && !await emailCodes.HasActiveCodeAsync(user, EmailCodePurpose.EmailVerification))
            await TrySendVerificationCode(user);

        return CreateAuthResponse(user);
    }

    [Authorize(Policy = AuthPolicies.AllowUnverified)]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me()
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null)
            return Unauthorized();

        return ToResponse(user);
    }

    // Onaydan sonra yeni token döner: eski token'da e-posta hâlâ onaysız görünür.
    [Authorize(Policy = AuthPolicies.AllowUnverified)]
    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail(VerifyEmailRequest request)
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null)
            return Unauthorized();

        // Zaten onaylıysa (örn. buton iki kez basıldı) yeni token ver.
        if (user.EmailVerifiedAt is not null)
            return CreateAuthResponse(user);

        var result = await emailCodes.VerifyAsync(user, EmailCodePurpose.EmailVerification, request.Code);
        switch (result.Status)
        {
            case VerifyCodeStatus.Wrong:
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: $"Kod hatalı. {result.AttemptsLeft} deneme hakkın kaldı.");
            case VerifyCodeStatus.TooManyAttempts:
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Çok fazla hatalı deneme. Yeni kod iste.");
            case VerifyCodeStatus.Expired:
                return Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: "Kodun süresi doldu. Yeni kod iste.");
        }

        user.EmailVerifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    [Authorize(Policy = AuthPolicies.AllowUnverified)]
    [HttpPost("verify-email/resend")]
    public async Task<IActionResult> ResendVerificationCode()
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null)
            return Unauthorized();

        if (user.EmailVerifiedAt is not null)
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "E-postan zaten onaylı.");

        TimeSpan? wait;
        try
        {
            wait = await emailCodes.SendAsync(user, EmailCodePurpose.EmailVerification);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Doğrulama kodu gönderilemedi: {UserId}", user.Id);
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Kod gönderilemedi. Biraz sonra tekrar dene.");
        }

        if (wait is { } remaining)
        {
            var seconds = (int)Math.Ceiling(remaining.TotalSeconds);
            Response.Headers.RetryAfter = seconds.ToString();
            return Problem(statusCode: StatusCodes.Status429TooManyRequests,
                title: $"Yeni kod için {seconds} saniye bekle.");
        }

        return NoContent();
    }

    private async Task TrySendVerificationCode(User user)
    {
        try
        {
            await emailCodes.SendAsync(user, EmailCodePurpose.EmailVerification);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Doğrulama kodu gönderilemedi: {UserId}", user.Id);
        }
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt, ToResponse(user));
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.UserName, user.EmailVerifiedAt is not null, user.CreatedAt);
}
