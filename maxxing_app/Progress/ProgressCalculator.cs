using maxxing_app.Models;

namespace maxxing_app.Progress;

// Seri ve gün tamamlama kuralları. Rutinlerin kayıtları (Entries) yüklenmiş olmalı.
//
// - Bir rutin o gün "aktif"se o günün toplamına girer (StartDate <= gün < ArchivedOn).
// - Gün, aktif rutinlerinin hepsi tamamlanınca tamamdır. Aktif rutini olmayan gün tamam sayılmaz.
// - Seri: bugünden geriye kesintisiz tamam günler. Bugün henüz tamam değilse seri bozulmaz, dünden sayılır.
public class ProgressCalculator(IReadOnlyList<Routine> routines)
{
    private readonly Dictionary<Guid, Dictionary<DateOnly, int>> _values = routines.ToDictionary(
        r => r.Id,
        r => r.Entries.ToDictionary(e => e.Date, e => e.Value));

    public int ValueOf(Routine routine, DateOnly date) =>
        _values.TryGetValue(routine.Id, out var byDate) && byDate.TryGetValue(date, out var value) ? value : 0;

    public bool IsCompleted(Routine routine, DateOnly date) =>
        routine.IsActiveOn(date) && routine.IsCompletedBy(ValueOf(routine, date));

    public (int Completed, int Total) DayProgress(DateOnly date)
    {
        var active = routines.Where(r => r.IsActiveOn(date)).ToList();
        return (active.Count(r => IsCompleted(r, date)), active.Count);
    }

    public bool IsDayCompleted(DateOnly date)
    {
        var (completed, total) = DayProgress(date);
        return total > 0 && completed == total;
    }

    public int OverallStreak(DateOnly today) => CountBack(today, IsDayCompleted);

    public int RoutineStreak(Routine routine, DateOnly today) => CountBack(today, d => IsCompleted(routine, d));

    private int CountBack(DateOnly today, Func<DateOnly, bool> isCompleted)
    {
        if (routines.Count == 0) return 0;
        var earliest = routines.Min(r => r.StartDate);

        var day = isCompleted(today) ? today : today.AddDays(-1);
        var streak = 0;
        while (day >= earliest && isCompleted(day))
        {
            streak++;
            day = day.AddDays(-1);
        }
        return streak;
    }
}
