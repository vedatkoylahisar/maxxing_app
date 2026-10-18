using maxxing_app.Models;
using Microsoft.EntityFrameworkCore;

namespace maxxing_app.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Routine> Routines => Set<Routine>();
    public DbSet<RoutineEntry> RoutineEntries => Set<RoutineEntry>();
    public DbSet<DayNote> DayNotes => Set<DayNote>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<EmailCode> EmailCodes => Set<EmailCode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Email).HasMaxLength(256);
            user.Property(u => u.UserName).HasMaxLength(20);
            user.Property(u => u.TimeZone).HasMaxLength(64).HasDefaultValue(UserClock.DefaultTimeZone);
            user.Property(u => u.Language).HasMaxLength(8);
            user.Property(u => u.DisplayName).HasMaxLength(40);
            user.Property(u => u.Bio).HasMaxLength(160);
            user.Property(u => u.Areas).HasDefaultValueSql("'{}'");
            user.HasIndex(u => u.Email).IsUnique();
            user.HasIndex(u => u.UserName).IsUnique();
        });

        modelBuilder.Entity<Routine>(routine =>
        {
            routine.Property(r => r.Name).HasMaxLength(40);
            routine.Property(r => r.Unit).HasMaxLength(16);
            routine.Property(r => r.Type).HasConversion<string>().HasMaxLength(16);
            routine.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
            routine.HasIndex(r => r.UserId);
        });

        modelBuilder.Entity<RoutineEntry>(entry =>
        {
            entry.HasOne(e => e.Routine).WithMany(r => r.Entries).HasForeignKey(e => e.RoutineId).OnDelete(DeleteBehavior.Cascade);
            entry.HasIndex(e => new { e.RoutineId, e.Date }).IsUnique();
        });

        modelBuilder.Entity<DayNote>(note =>
        {
            note.Property(n => n.Text).HasMaxLength(2000);
            note.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
            note.HasIndex(n => new { n.UserId, n.Date }).IsUnique();
        });

        modelBuilder.Entity<Group>(group =>
        {
            group.Property(g => g.Name).HasMaxLength(40);
            group.Property(g => g.InviteCode).HasMaxLength(6);
            group.HasIndex(g => g.InviteCode).IsUnique();
        });

        modelBuilder.Entity<GroupMember>(member =>
        {
            member.HasKey(m => new { m.GroupId, m.UserId });
            member.HasOne(m => m.Group).WithMany(g => g.Members).HasForeignKey(m => m.GroupId).OnDelete(DeleteBehavior.Cascade);
            member.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);
            member.HasIndex(m => m.UserId);
        });

        modelBuilder.Entity<EmailCode>(code =>
        {
            code.Property(c => c.Purpose).HasConversion<string>().HasMaxLength(32);
            code.Property(c => c.CodeHash).HasMaxLength(64);
            code.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
            code.HasIndex(c => new { c.UserId, c.Purpose }).IsUnique();
        });
    }
}
