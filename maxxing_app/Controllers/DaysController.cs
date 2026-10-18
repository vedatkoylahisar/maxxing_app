using maxxing_app.Auth;
using maxxing_app.Contracts;
using maxxing_app.Data;
using maxxing_app.Models;
using maxxing_app.Progress;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Npgsql;

namespace maxxing_app.Controllers;

[ApiController]
[Authorize]
[Route("days")]
public class DaysController(AppDbContext db, IStringLocalizer<SharedResource> localizer) : ControllerBase
{
    private const int MaxHistoryDays = 120;

    [HttpGet("today")]
    public async Task<ActionResult<DayResponse>> Today()
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();
        return await BuildDay(user, UserClock.Today(user));
    }

    [HttpGet("{date}")]
    public async Task<ActionResult<DayResponse>> Get(DateOnly date)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();
        if (date > UserClock.Today(user))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: localizer["FutureDay"]);

        return await BuildDay(user, date);
    }

    // Takvim / ızgara için: aralıktaki her günün kaç rutininin tamamlandığı.
    [HttpGet]
    public async Task<ActionResult<List<DaySummaryResponse>>> History([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();

        var today = UserClock.Today(user);
        if (to > today) to = today;
        if (from > to || to.DayNumber - from.DayNumber >= MaxHistoryDays)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: localizer["HistoryRangeTooLong", MaxHistoryDays]);

        var progress = new ProgressCalculator(await LoadRoutines(user.Id));
        var days = new List<DaySummaryResponse>();
        for (var day = from; day <= to; day = day.AddDays(1))
        {
            var (completed, total) = progress.DayProgress(day);
            days.Add(new DaySummaryResponse(day, completed, total));
        }
        return days;
    }

    [HttpPut("{date}/routines/{routineId:guid}")]
    public async Task<ActionResult<DayResponse>> SetEntry(DateOnly date, Guid routineId, SetEntryRequest request)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();
        if (!IsEditable(user, date)) return NotEditable();

        var routine = await db.Routines.SingleOrDefaultAsync(r => r.Id == routineId && r.UserId == user.Id);
        if (routine is null) return NotFound();
        if (!routine.IsActiveOn(date))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: localizer["RoutineNotActive"]);
        if (routine.Type == RoutineType.Check && request.Value > 1)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: localizer["CheckValueInvalid"]);

        var entry = await db.RoutineEntries.SingleOrDefaultAsync(e => e.RoutineId == routineId && e.Date == date);
        if (request.Value == 0)
        {
            if (entry is not null) db.RoutineEntries.Remove(entry);
        }
        else if (entry is null)
        {
            db.RoutineEntries.Add(new RoutineEntry
            {
                Id = Guid.CreateVersion7(),
                RoutineId = routineId,
                Date = date,
                Value = request.Value,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            entry.Value = request.Value;
            entry.UpdatedAt = DateTime.UtcNow;
        }

        if (!await TrySave()) return Conflict();
        return await BuildDay(user, date);
    }

    [HttpPut("{date}/note")]
    public async Task<ActionResult<DayResponse>> SetNote(DateOnly date, SetNoteRequest request)
    {
        var user = await CurrentUser();
        if (user is null) return Unauthorized();
        if (!IsEditable(user, date)) return NotEditable();

        var text = request.Text?.Trim() ?? "";
        var note = await db.DayNotes.SingleOrDefaultAsync(n => n.UserId == user.Id && n.Date == date);
        if (text.Length == 0)
        {
            if (note is not null) db.DayNotes.Remove(note);
        }
        else if (note is null)
        {
            db.DayNotes.Add(new DayNote
            {
                Id = Guid.CreateVersion7(),
                UserId = user.Id,
                Date = date,
                Text = text,
                UpdatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            note.Text = text;
            note.UpdatedAt = DateTime.UtcNow;
        }

        if (!await TrySave()) return Conflict();
        return await BuildDay(user, date);
    }

    private async Task<DayResponse> BuildDay(User user, DateOnly date)
    {
        var today = UserClock.Today(user);
        var routines = await LoadRoutines(user.Id);
        var progress = new ProgressCalculator(routines);
        var note = await db.DayNotes.Where(n => n.UserId == user.Id && n.Date == date).Select(n => n.Text).SingleOrDefaultAsync();

        var dayRoutines = routines
            .Where(r => r.IsActiveOn(date))
            .OrderBy(r => r.SortOrder)
            .Select(r => new DayRoutineResponse(
                r.Id, r.Name, r.Type, r.Target, r.Unit,
                progress.ValueOf(r, date),
                progress.IsCompleted(r, date),
                progress.RoutineStreak(r, today)))
            .ToList();

        return new DayResponse(
            date,
            date == today,
            IsEditable(user, date),
            dayRoutines,
            note,
            dayRoutines.Count(r => r.Completed),
            dayRoutines.Count,
            new StreakResponse(progress.OverallStreak(today), progress.IsDayCompleted(today)));
    }

    private Task<List<Routine>> LoadRoutines(Guid userId) =>
        db.Routines.Include(r => r.Entries).Where(r => r.UserId == userId).AsNoTracking().ToListAsync();

    private Task<User?> CurrentUser() => db.Users.FindAsync(User.GetUserId()).AsTask();

    // Sadece bugün ve dün düzenlenebilir: gece yarısını kaçıran dünü tamamlayabilir, geçmiş şişirilemez.
    private static bool IsEditable(User user, DateOnly date)
    {
        var today = UserClock.Today(user);
        return date == today || date == today.AddDays(-1);
    }

    private ObjectResult NotEditable() =>
        Problem(statusCode: StatusCodes.Status400BadRequest, title: localizer["DayNotEditable"]);

    // Aynı anda iki istek aynı kaydı oluşturmaya çalışırsa ikincisi 409 alır; istemci tekrar dener.
    private async Task<bool> TrySave()
    {
        try
        {
            await db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return false;
        }
    }
}
