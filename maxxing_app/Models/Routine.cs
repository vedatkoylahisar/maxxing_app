namespace maxxing_app.Models;

public enum RoutineType
{
    // Yaptım / yapmadım (spor, cilt bakımı)
    Check,

    // Hedefe ulaşınca tamamlanır (10.000 adım, 2 L su)
    Count,
}

public class Routine
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public required string Name { get; set; }

    public RoutineType Type { get; set; }

    // Sadece Count türünde dolu.
    public int? Target { get; set; }
    public string? Unit { get; set; }

    public int SortOrder { get; set; }

    // Rutinin aktif olduğu ilk gün (kullanıcının saat dilimine göre).
    public DateOnly StartDate { get; set; }

    // Silinen rutin arşivlenir; bu günden itibaren aktif sayılmaz. Geçmiş seriler bozulmasın diye kayıtları tutulur.
    public DateOnly? ArchivedOn { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<RoutineEntry> Entries { get; set; } = [];

    public bool IsActiveOn(DateOnly date) => StartDate <= date && (ArchivedOn is null || date < ArchivedOn);

    public bool IsCompletedBy(int value) => Type == RoutineType.Check ? value >= 1 : value >= (Target ?? 1);
}
