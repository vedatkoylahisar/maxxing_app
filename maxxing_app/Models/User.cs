namespace maxxing_app.Models;

public class User
{
    public Guid Id { get; set; }

    // Küçük harfe çevrilmiş olarak saklanır.
    public required string Email { get; set; }

    // Küçük harfe çevrilmiş olarak saklanır.
    public required string UserName { get; set; }

    public string PasswordHash { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}
