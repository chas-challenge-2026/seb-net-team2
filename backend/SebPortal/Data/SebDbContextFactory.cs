
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SebPortal.Data;

public class SebDbContextFactory : IDesignTimeDbContextFactory<SebDbContext>
{
    public SebDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Database=seb;Username=seb;Password=design_time";

        var options = new DbContextOptionsBuilder<SebDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new SebDbContext(options);
    }
}
