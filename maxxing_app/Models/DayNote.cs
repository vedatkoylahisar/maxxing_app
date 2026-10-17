namespace maxxing_app.Models;

// Kullanıcının bir güne yazdığı not. Günde en fazla bir tane.
public class DayNote
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public DateOnly Date { get; set; }

    public required string Text { get; set; }

    public DateTime UpdatedAt { get; set; }
}
