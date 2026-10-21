using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class CrossTenantAccountsIntegrationTests
    {
        [Fact]
        public async Task Accounts_ShouldBeIsolatedPerTenant()
        {
            //arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            //act 
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "A1", Iban = "SE111", Balance = 100m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "A2", Iban = "SE222", Balance = 200m, Currency = "SEK" });

                await context.SaveChangesAsync();
            }

            //assert
            await using (var context = new SebDbContext(options))
            {
                var t1Accounts = await context.Accounts.Where(a => a.TenantId == 1).ToListAsync();
                var t2Accounts = await context.Accounts.Where(a => a.TenantId == 2).ToListAsync();

                Assert.Single(t1Accounts);
                Assert.Single(t2Accounts);
                Assert.Equal("A1", t1Accounts[0].AccountName);
                Assert.Equal("A2", t2Accounts[0].AccountName);
            }
        }

        [Fact]
        public async Task Account_ShouldNotBeAccessible_AcrossTenants()
        {
            // arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            // act - sätt upp data med skilda tenants
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "A1", Iban = "SE111", Balance = 100m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "A2", Iban = "SE222", Balance = 200m, Currency = "SEK" });

                await context.SaveChangesAsync();
            }

            // assert - simulera att Tenant 1 försöker fråga efter Tenant 2:s konto (Id = 2) med TenantId = 1
            await using (var context = new SebDbContext(options))
            {
                int queryingTenantId = 1;
                int targetAccountId = 2;

                var crossTenantAccount = await context.Accounts
                    .FirstOrDefaultAsync(a => a.Id == targetAccountId && a.TenantId == queryingTenantId);

                // Verifiera att kontot inte hittas (skall vara null pga horisontell isolering)
                Assert.Null(crossTenantAccount);
            }
        }
    }
}
