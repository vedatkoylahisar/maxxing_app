using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace maxxing_app.Controllers;

[ApiController]
[Authorize]
[Route("routines")]
public class RoutinesController(AppDbContext db) : ControllerBase
{
    private const int MaxActiveRoutines = 20;

    [HttpGet]
    public async Task<ActionResult<List<RoutineResponse>>> List()
    {
        var userId = User.GetUserId();
        var routines = await db.Routines
            .Where(r => r.UserId == userId && r.ArchivedOn == null)
            .OrderBy(r => r.SortOrder)
            .ToListAsync();

        return routines.Select(ToResponse).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<RoutineResponse>> Create(CreateRoutineRequest request)
    {
        var userId = User.GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        var name = request.Name.Trim();
        if (name.Length == 0)
            return FieldError(nameof(request.Name), "Rutin adı gerekli.");

        var type = request.Type!.Value;
        if (type == RoutineType.Count && request.Target is null)
            return FieldError(nameof(request.Target), "Sayılı rutin için bir hedef gir.");

        var active = await db.Routines.Where(r => r.UserId == userId && r.ArchivedOn == null).ToListAsync();
        if (active.Count >= MaxActiveRoutines)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: $"En fazla {MaxActiveRoutines} rutinin olabilir.");

        var routine = new Routine
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Name = name,
            Type = type,
            Target = type == RoutineType.Count ? request.Target : null,
            Unit = type == RoutineType.Count ? NullIfEmpty(request.Unit) : null,
            SortOrder = active.Count == 0 ? 0 : active.Max(r => r.SortOrder) + 1,
            StartDate = UserClock.Today(user),
            CreatedAt = DateTime.UtcNow,
        };

        db.Routines.Add(routine);
        await db.SaveChangesAsync();

        return Created($"/routines/{routine.Id}", ToResponse(routine));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RoutineResponse>> Update(Guid id, UpdateRoutineRequest request)
    {
        var userId = User.GetUserId();
        var routine = await db.Routines.SingleOrDefaultAsync(r => r.Id == id && r.UserId == userId && r.ArchivedOn == null);
        if (routine is null) return NotFound();

        var name = request.Name.Trim();
        if (name.Length == 0)
            return FieldError(nameof(request.Name), "Rutin adı gerekli.");

        if (routine.Type == RoutineType.Count)
        {
            if (request.Target is null)
                return FieldError(nameof(request.Target), "Sayılı rutin için bir hedef gir.");
            routine.Target = request.Target;
            routine.Unit = NullIfEmpty(request.Unit);
        }
        routine.Name = name;

        await db.SaveChangesAsync();
        return ToResponse(routine);
    }

    // Hiç kaydı olmayan rutin tamamen silinir; kaydı olan arşivlenir ki geçmiş seriler bozulmasın.
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        var routine = await db.Routines.SingleOrDefaultAsync(r => r.Id == id && r.UserId == userId && r.ArchivedOn == null);
        if (routine is null) return NotFound();

        var hasEntries = await db.RoutineEntries.AnyAsync(e => e.RoutineId == id);
        if (hasEntries)
        {
            var user = await db.Users.FindAsync(userId);
            routine.ArchivedOn = UserClock.Today(user!);
        }
        else
        {
            db.Routines.Remove(routine);
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    private ActionResult FieldError(string field, string message)
    {
        ModelState.AddModelError(field, message);
        return ValidationProblem(ModelState);
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static RoutineResponse ToResponse(Routine r) => new(r.Id, r.Name, r.Type, r.Target, r.Unit, r.StartDate);
}
