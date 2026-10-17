using Microsoft.EntityFrameworkCore;

namespace maxxing_app.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
