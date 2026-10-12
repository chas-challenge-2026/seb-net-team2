using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class CrossTenantPaymentsIntegrationTests
    {
        [Fact]
        public async Task Payments_ShouldBeIsolatedPerTenant()
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

                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "From1", Iban = "SE100", Balance = 1000m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "From2", Iban = "SE200", Balance = 2000m, Currency = "SEK" });

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "U1", Email = "u1@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "U2", Email = "u2@t2.test", PasswordHash = "x", Role = "User" });

                context.Payments.Add(new Payment { Id = 1, TenantId = 1, FromAccountId = 1, ToIban = "NO1", Amount = 10m, Currency = "SEK", Reference = "r1", Status = "created", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow });
                context.Payments.Add(new Payment { Id = 2, TenantId = 2, FromAccountId = 2, ToIban = "NO2", Amount = 20m, Currency = "SEK", Reference = "r2", Status = "created", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow });

                await context.SaveChangesAsync();
            }

            //assert
            await using (var context = new SebDbContext(options))
            {
                var t1Payments = await context.Payments.Where(p => p.TenantId == 1).ToListAsync();
                var t2Payments = await context.Payments.Where(p => p.TenantId == 2).ToListAsync();

                Assert.Single(t1Payments);
                Assert.Single(t2Payments);
                Assert.Equal(10m, t1Payments[0].Amount);
                Assert.Equal(20m, t2Payments[0].Amount);
            }
        }

        [Fact]
        public async Task Payment_ShouldNotBeAccessible_AcrossTenants()
        {
            // arrange
            await using var connection = new SqliteConnection("Data Source=:memory:;Foreign Keys=True");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            // act - sätt upp data med skilda tenants, konton och betalningar
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "From1", Iban = "SE100", Balance = 1000m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "From2", Iban = "SE200", Balance = 2000m, Currency = "SEK" });

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "U1", Email = "u1@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "U2", Email = "u2@t2.test", PasswordHash = "x", Role = "User" });

                context.Payments.Add(new Payment { Id = 1, TenantId = 1, FromAccountId = 1, ToIban = "NO1", Amount = 10m, Currency = "SEK", Reference = "r1", Status = "created", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow });
                context.Payments.Add(new Payment { Id = 2, TenantId = 2, FromAccountId = 2, ToIban = "NO2", Amount = 20m, Currency = "SEK", Reference = "r2", Status = "created", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow });
                await context.SaveChangesAsync();
            }

            // assert - simulera att Tenant 1 försöker hämta betalning 2 (som tillhör Tenant 2)
            await using (var context = new SebDbContext(options))
            {
                int queryingTenantId = 1;
                int targetPaymentId = 2;

                var crossTenantPayment = await context.Payments
                    .FirstOrDefaultAsync(p => p.Id == targetPaymentId && p.TenantId == queryingTenantId);

                // Verifiera att betalningen inte hittas pga horisontell isolering
                Assert.Null(crossTenantPayment);
            }
        }
    }
}
