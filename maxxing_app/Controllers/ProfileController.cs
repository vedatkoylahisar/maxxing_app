using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Models;
using maxxing_app.Profiles;
using maxxing_app.Progress;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace maxxing_app.Controllers;

[ApiController]
[Authorize]
[Route("profile")]
public class ProfileController(AppDbContext db, IPasswordHasher<User> passwordHasher) : ControllerBase
{
    private const int MaxAreaLength = 30;

    // "Ne için buradasın?" seçenekleri ve her birine önerilen rutinler.
    [AllowAnonymous]
    [HttpGet("areas")]
    public List<AreaCatalogResponse> Areas() =>
        AreaCatalog.All.Select(a => new AreaCatalogResponse(a.Key, a.Label, a.Suggestions)).ToList();

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> Me()
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return Unauthorized();
        return await BuildProfile(user, isMe: true);
    }

    [HttpPut("me")]
    public async Task<ActionResult<ProfileResponse>> Update(UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return Unauthorized();

        var areas = (request.Areas ?? [])
            .Select(a => a.Trim())
            .Where(a => a.Length > 0)
            .DistinctBy(a => a.ToLowerInvariant())
            .ToList();
        if (areas.Any(a => a.Length > MaxAreaLength))
        {
            ModelState.AddModelError(nameof(request.Areas), $"Bir alan en fazla {MaxAreaLength} karakter olabilir.");
            return ValidationProblem(ModelState);
        }

        user.DisplayName = NullIfEmpty(request.DisplayName);
        user.Bio = NullIfEmpty(request.Bio);
        user.Areas = areas;
        await db.SaveChangesAsync();

        return await BuildProfile(user, isMe: true);
    }

    // Başkasının profili sadece aynı grupta olunursa görünür. Rutin adları ve notlar burada da yok.
    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<ProfileResponse>> Get(Guid userId)
    {
        var me = User.GetUserId();
        if (userId != me)
        {
            var sharesGroup = await db.GroupMembers
                .AnyAsync(m => m.UserId == userId && db.GroupMembers.Any(o => o.GroupId == m.GroupId && o.UserId == me));
            if (!sharesGroup) return NotFound();
        }

        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();
        return await BuildProfile(user, isMe: userId == me);
    }

    [HttpPost("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var user = await db.Users.FindAsync(User.GetUserId());
        if (user is null) return Unauthorized();

        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
        {
            ModelState.AddModelError(nameof(request.CurrentPassword), "Mevcut şifre yanlış.");
            return ValidationProblem(ModelState);
        }

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ProfileResponse> BuildProfile(User user, bool isMe)
    {
        var routines = await db.Routines.Include(r => r.Entries).Where(r => r.UserId == user.Id).AsNoTracking().ToListAsync();
        var progress = new ProgressCalculator(routines);
        var today = UserClock.Today(user);
        var (completedDays, longest) = progress.History(today);

        return new ProfileResponse(
            user.Id,
            user.UserName,
            user.DisplayName,
            user.Bio,
            user.Areas.Select(a => new AreaResponse(AreaCatalog.Find(a)?.Key, AreaCatalog.LabelOf(a))).ToList(),
            new ProfileStatsResponse(progress.OverallStreak(today), longest, completedDays, user.CreatedAt),
            isMe,
            isMe ? user.Email : null);
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
