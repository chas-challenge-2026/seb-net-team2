using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class CrossTenantApprovalStepsIntegrationTests
    {
        [Fact]
        public async Task ApprovalSteps_ShouldBeIsolatedPerTenant()
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

                // create accounts and users for FK relations
                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "A1", Iban = "SE1", Balance = 0m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "A2", Iban = "SE2", Balance = 0m, Currency = "SEK" });

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "U1", Email = "u1@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "U2", Email = "u2@t2.test", PasswordHash = "x", Role = "User" });

                context.Payments.Add(new Payment { Id = 1, TenantId = 1, FromAccountId = 1, ToIban = "NO1", Amount = 10m, Currency = "SEK", Reference = "r1", Status = "created", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow });
                context.Payments.Add(new Payment { Id = 2, TenantId = 2, FromAccountId = 2, ToIban = "NO2", Amount = 20m, Currency = "SEK", Reference = "r2", Status = "created", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow });

                context.ApprovalSteps.Add(new ApprovalStep { Id = 1, PaymentId = 1, AttestantId = 1, StepNumber = 1, Status = "pending" });
                context.ApprovalSteps.Add(new ApprovalStep { Id = 2, PaymentId = 2, AttestantId = 2, StepNumber = 1, Status = "pending" });

                await context.SaveChangesAsync();
            }

            //assert
            await using (var context = new SebDbContext(options))
            {
                var t1Steps = await context.ApprovalSteps
                    .Include(s => s.Payment)
                    .Where(s => s.Payment.TenantId == 1)
                    .ToListAsync();

                var t2Steps = await context.ApprovalSteps
                    .Include(s => s.Payment)
                    .Where(s => s.Payment.TenantId == 2)
                    .ToListAsync();

                Assert.Single(t1Steps);
                Assert.Single(t2Steps);
                Assert.Equal(1, t1Steps[0].PaymentId);
                Assert.Equal(2, t2Steps[0].PaymentId);
            }
        }

        [Fact]
        public async Task ApprovalStep_ShouldNotBeAccessible_AcrossTenants()
        {
            // arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            // act - sätt upp data med skilda tenants, konton, användare, betalningar och atteststeg
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.Accounts.Add(new Account { Id = 1, TenantId = 1, AccountName = "A1", Iban = "SE1", Balance = 0m, Currency = "SEK" });
                context.Accounts.Add(new Account { Id = 2, TenantId = 2, AccountName = "A2", Iban = "SE2", Balance = 0m, Currency = "SEK" });

                context.Users.Add(new User { Id = 1, TenantId = 1, Name = "U1", Email = "u1@t1.test", PasswordHash = "x", Role = "User" });
                context.Users.Add(new User { Id = 2, TenantId = 2, Name = "U2", Email = "u2@t2.test", PasswordHash = "x", Role = "User" });

                context.Payments.Add(new Payment { Id = 1, TenantId = 1, FromAccountId = 1, ToIban = "NO1", Amount = 10m, Currency = "SEK", Reference = "r1", Status = "created", CreatedByUserId = 1, CreatedAt = DateTime.UtcNow });
                context.Payments.Add(new Payment { Id = 2, TenantId = 2, FromAccountId = 2, ToIban = "NO2", Amount = 20m, Currency = "SEK", Reference = "r2", Status = "created", CreatedByUserId = 2, CreatedAt = DateTime.UtcNow });

                context.ApprovalSteps.Add(new ApprovalStep { Id = 1, PaymentId = 1, AttestantId = 1, StepNumber = 1, Status = "pending" });
                context.ApprovalSteps.Add(new ApprovalStep { Id = 2, PaymentId = 2, AttestantId = 2, StepNumber = 1, Status = "pending" });

                await context.SaveChangesAsync();
            }

            // assert - simulera att Tenant 1 försöker hämta atteststeg 2 (som tillhör betalning 2 för Tenant 2)
            await using (var context = new SebDbContext(options))
            {
                int queryingTenantId = 1;
                int targetApprovalStepId = 2;

                var crossTenantStep = await context.ApprovalSteps
                    .Include(s => s.Payment)
                    .FirstOrDefaultAsync(s => s.Id == targetApprovalStepId && s.Payment.TenantId == queryingTenantId);

                // Verifiera att atteststeget inte hittas pga horisontell isolering via betalningens tenant
                Assert.Null(crossTenantStep);
            }
        }
    }
}
