using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Npgsql;

namespace maxxing_app.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> passwordHasher,
    TokenService tokenService) : ControllerBase
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

        return CreateAuthResponse(user!);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me()
    {
        if (!Guid.TryParse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var userId))
            return Unauthorized();

        var user = await db.Users.FindAsync(userId);
        if (user is null)
            return Unauthorized();

        return ToResponse(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var (token, expiresAt) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAt, ToResponse(user));
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.UserName, user.CreatedAt);
}
