namespace maxxing_app.Models;

public static class UserClock
{
    public const string DefaultTimeZone = "Europe/Istanbul";

    public static bool IsValidTimeZone(string timeZone) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out _);

    // Kullanıcının saat dilimine göre bugünün tarihi.
    public static DateOnly Today(User user)
    {
        var zone = TimeZoneInfo.TryFindSystemTimeZoneById(user.TimeZone, out var found)
            ? found
            : TimeZoneInfo.FindSystemTimeZoneById(DefaultTimeZone);
        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone));
    }
}
