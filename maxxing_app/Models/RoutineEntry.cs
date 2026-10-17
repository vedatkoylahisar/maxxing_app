namespace maxxing_app.Models;

// Bir rutinin bir gündeki kaydı. Check türünde Value = 1, Count türünde girilen miktar.
public class RoutineEntry
{
    public Guid Id { get; set; }

    public Guid RoutineId { get; set; }
    public Routine? Routine { get; set; }

    public DateOnly Date { get; set; }

    public int Value { get; set; }

    public DateTime UpdatedAt { get; set; }
}
