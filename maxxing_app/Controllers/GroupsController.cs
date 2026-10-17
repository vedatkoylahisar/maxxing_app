using System.Security.Cryptography;
using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Models;
using maxxing_app.Progress;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace maxxing_app.Controllers;

[ApiController]
[Authorize]
[Route("groups")]
public class GroupsController(AppDbContext db) : ControllerBase
{
    private const int MaxGroupsPerUser = 10;
    private const int MaxMembersPerGroup = 50;

    // 0/O, 1/I/L gibi karışan karakterler yok; kod sesli söylenip elle yazılabilsin.
    private const string CodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int CodeLength = 6;

    [HttpGet]
    public async Task<ActionResult<List<GroupResponse>>> List()
    {
        var userId = User.GetUserId();
        var groups = await db.Groups
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .OrderBy(g => g.CreatedAt)
            .Select(g => new GroupResponse(g.Id, g.Name, g.InviteCode, g.Members.Count, g.OwnerId == userId))
            .ToListAsync();

        return groups;
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponse>> Create(CreateGroupRequest request)
    {
        var userId = User.GetUserId();
        var name = request.Name.Trim();
        if (name.Length == 0)
        {
            ModelState.AddModelError(nameof(request.Name), "Grup adı gerekli.");
            return ValidationProblem(ModelState);
        }
        if (await MembershipCount(userId) >= MaxGroupsPerUser)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: $"En fazla {MaxGroupsPerUser} grupta olabilirsin.");

        var now = DateTime.UtcNow;
        var group = new Group
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            InviteCode = NewCode(),
            OwnerId = userId,
            CreatedAt = now,
            Members = [new GroupMember { UserId = userId, JoinedAt = now }],
        };
        db.Groups.Add(group);

        // Kod çakışırsa (çok düşük ihtimal) yeni kodla tekrar dene.
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                await db.SaveChangesAsync();
                break;
            }
            catch (DbUpdateException ex) when (attempt < 3 && IsUniqueViolation(ex))
            {
                group.InviteCode = NewCode();
            }
        }

        return Created($"/groups/{group.Id}", new GroupResponse(group.Id, group.Name, group.InviteCode, 1, true));
    }

    [HttpPost("join")]
    public async Task<ActionResult<GroupResponse>> Join(JoinGroupRequest request)
    {
        var userId = User.GetUserId();
        var code = NormalizeCode(request.Code);

        var group = await db.Groups.Include(g => g.Members).SingleOrDefaultAsync(g => g.InviteCode == code);
        if (group is null)
            return Problem(statusCode: StatusCodes.Status404NotFound, title: "Bu koda ait bir grup yok.");

        // Zaten üyeyse hata verme, grubu dön.
        if (group.Members.All(m => m.UserId != userId))
        {
            if (group.Members.Count >= MaxMembersPerGroup)
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Bu grup dolu.");
            if (await MembershipCount(userId) >= MaxGroupsPerUser)
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: $"En fazla {MaxGroupsPerUser} grupta olabilirsin.");

            group.Members.Add(new GroupMember { UserId = userId, JoinedAt = DateTime.UtcNow });
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                // Aynı anda iki kez "katıl" basıldı; ilki zaten ekledi.
            }
        }

        return new GroupResponse(group.Id, group.Name, group.InviteCode, group.Members.Count, group.OwnerId == userId);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupDetailResponse>> Get(Guid id)
    {
        var userId = User.GetUserId();
        var group = await db.Groups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .AsNoTracking()
            .SingleOrDefaultAsync(g => g.Id == id && g.Members.Any(m => m.UserId == userId));
        if (group is null) return NotFound();

        var memberIds = group.Members.Select(m => m.UserId).ToList();
        var routinesByUser = (await db.Routines
                .Include(r => r.Entries)
                .Where(r => memberIds.Contains(r.UserId))
                .AsNoTracking()
                .ToListAsync())
            .ToLookup(r => r.UserId);

        var members = group.Members
            .Select(m =>
            {
                // Her üyenin "bugün"ü kendi saat dilimine göre.
                var today = UserClock.Today(m.User!);
                var progress = new ProgressCalculator(routinesByUser[m.UserId].ToList());
                var (completed, total) = progress.DayProgress(today);
                return new GroupMemberResponse(
                    m.UserId,
                    m.User!.UserName,
                    m.UserId == userId,
                    m.UserId == group.OwnerId,
                    completed,
                    total,
                    progress.IsDayCompleted(today),
                    progress.OverallStreak(today));
            })
            .OrderByDescending(m => m.TodayCompleted)
            .ThenByDescending(m => m.Streak)
            .ThenBy(m => m.UserName)
            .ToList();

        return new GroupDetailResponse(group.Id, group.Name, group.InviteCode, group.OwnerId == userId, members);
    }

    // Sahip ayrılırsa grup en eski üyeye geçer; son üye ayrılırsa grup silinir.
    [HttpPost("{id:guid}/leave")]
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = User.GetUserId();
        var group = await db.Groups.Include(g => g.Members).SingleOrDefaultAsync(g => g.Id == id);
        var me = group?.Members.SingleOrDefault(m => m.UserId == userId);
        if (group is null || me is null) return NotFound();

        group.Members.Remove(me);
        if (group.Members.Count == 0)
            db.Groups.Remove(group);
        else if (group.OwnerId == userId)
            group.OwnerId = group.Members.OrderBy(m => m.JoinedAt).First().UserId;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // Kod istenmeyen birine ulaştıysa sahip yenisini üretir; eski kod çalışmaz.
    [HttpPost("{id:guid}/invite-code")]
    public async Task<ActionResult<GroupResponse>> ResetInviteCode(Guid id)
    {
        var userId = User.GetUserId();
        var group = await db.Groups.Include(g => g.Members).SingleOrDefaultAsync(g => g.Id == id && g.Members.Any(m => m.UserId == userId));
        if (group is null) return NotFound();
        if (group.OwnerId != userId)
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Davet kodunu sadece grubun sahibi yenileyebilir.");

        for (var attempt = 0; ; attempt++)
        {
            group.InviteCode = NewCode();
            try
            {
                await db.SaveChangesAsync();
                break;
            }
            catch (DbUpdateException ex) when (attempt < 3 && IsUniqueViolation(ex))
            {
            }
        }

        return new GroupResponse(group.Id, group.Name, group.InviteCode, group.Members.Count, true);
    }

    private Task<int> MembershipCount(Guid userId) => db.GroupMembers.CountAsync(m => m.UserId == userId);

    private static string NewCode() =>
        string.Create(CodeLength, 0, (chars, _) =>
        {
            for (var i = 0; i < chars.Length; i++)
                chars[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
        });

    // "k7m-2qx" gibi yazılsa da bulunsun.
    private static string NormalizeCode(string code) =>
        new(code.ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
