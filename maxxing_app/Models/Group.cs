namespace maxxing_app.Models;

public class Group
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    // Arkadaşın bu kodu girip katılır. Büyük harf, karışan karakterler (0/O, 1/I/L) yok.
    public required string InviteCode { get; set; }

    // Grubu kuran; ayrılırsa en eski üyeye devredilir.
    public Guid OwnerId { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<GroupMember> Members { get; set; } = [];
}

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Group? Group { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public DateTime JoinedAt { get; set; }
}
