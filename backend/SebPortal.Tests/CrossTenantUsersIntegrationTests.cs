using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class CrossTenantUsersIntegrationTests
    {
        [Fact]
        public async Task Users_ShouldBeIsolatedPerTenant()
        {
            //arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            //act
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                var tenant1 = new Tenant { Id = 1, Name = "Tenant One" };
                var tenant2 = new Tenant { Id = 2, Name = "Tenant Two" };

                context.Tenants.AddRange(tenant1, tenant2);

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "User A", Email = "a@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "User B", Email = "b@t2.test", PasswordHash = "x", Role = "User" });

                await context.SaveChangesAsync();
            }

            //assert
            await using (var context = new SebDbContext(options))
            {
                var t1Users = await context.Users.Where(u => u.TenantId == 1).ToListAsync();
                var t2Users = await context.Users.Where(u => u.TenantId == 2).ToListAsync();

                Assert.Single(t1Users);
                Assert.Single(t2Users);
                Assert.Equal("a@t1.test", t1Users[0].Email);
                Assert.Equal("b@t2.test", t2Users[0].Email);
            }
        }

        [Fact]
        public async Task User_ShouldNotBeAccessible_AcrossTenants()
        {
            // arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            // act - sätt upp data med skilda tenants och användare
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                var tenant1 = new Tenant { Id = 1, Name = "Tenant One" };
                var tenant2 = new Tenant { Id = 2, Name = "Tenant Two" };

                context.Tenants.AddRange(tenant1, tenant2);

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "User A", Email = "a@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "User B", Email = "b@t2.test", PasswordHash = "x", Role = "User" });

                await context.SaveChangesAsync();
            }

            // assert - simulera att Tenant 1 försöker hämta User B (Id = 2, som tillhör Tenant 2)
            await using (var context = new SebDbContext(options))
            {
                int queryingTenantId = 1;
                int targetUserId = 2;

                var crossTenantUser = await context.Users
                    .FirstOrDefaultAsync(u => u.Id == targetUserId && u.TenantId == queryingTenantId);

                // Verifiera att användaren inte hittas pga horisontell isolering
                Assert.Null(crossTenantUser);
            }
        }
    }
}
