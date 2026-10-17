using maxxing_app.Models;
using Microsoft.EntityFrameworkCore;

namespace maxxing_app.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Email).HasMaxLength(256);
            user.Property(u => u.UserName).HasMaxLength(20);
            user.HasIndex(u => u.Email).IsUnique();
            user.HasIndex(u => u.UserName).IsUnique();
        });
    }
}
