using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Repositories;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Tests;

public class RecentPaymentsTests
{
    [Fact]
    public async Task RecentPayments_IsolateTenantAndAssignment_IncludeHandledSteps_AndLimitResults()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;
        await using var db = new SebDbContext(options);
        await db.Database.EnsureCreatedAsync();
        db.Tenants.AddRange(new Tenant { Id = 1, Name = "One" }, new Tenant { Id = 2, Name = "Two" });
        for (var tenant = 1; tenant <= 2; tenant++)
        {
            db.Accounts.Add(new Account { Id = tenant, TenantId = tenant, AccountName = "Account", Iban = $"SE{tenant}", Currency = "SEK" });
            db.Users.Add(new User { Id = tenant, TenantId = tenant, Name = "User", Email = $"u{tenant}@test.se", PasswordHash = "x", Role = "Attestant" });
        }
        var date = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        for (var id = 1; id <= 56; id++)
        {
            var tenant = id == 56 ? 2 : 1;
            db.Payments.Add(new Payment {
                Id = id, TenantId = tenant, FromAccountId = tenant, CreatedByUserId = tenant,
                ToIban = "SE123", Reference = $"Payment {id}", Amount = id,
                Status = id == 2 ? "rejected" : "completed", CreatedAt = date.AddMinutes(id)
            });
        }
        db.ApprovalSteps.AddRange(
            new ApprovalStep { PaymentId = 1, AttestantId = 1, StepNumber = 1, Status = "approved" },
            new ApprovalStep { PaymentId = 1, AttestantId = 1, StepNumber = 2, Status = "approved" },
            new ApprovalStep { PaymentId = 2, AttestantId = 1, StepNumber = 1, Status = "rejected" },
            new ApprovalStep { PaymentId = 56, AttestantId = 2, StepNumber = 1, Status = "pending" });
        await db.SaveChangesAsync();
        var repository = new PaymentRepository(db);

        var admin = (await repository.GetRecentPaymentsAsync(1, null)).ToList();
        Assert.Equal(50, admin.Count);
        Assert.All(admin, p => Assert.Equal(1, p.TenantId));
        Assert.Equal(55, admin.First().Id);
        Assert.Equal(6, admin.Last().Id);
        Assert.All(admin, p => Assert.NotNull(p.FromAccount));

        var attestant = (await repository.GetRecentPaymentsAsync(1, 1)).ToList();
        Assert.Equal(new[] { 2, 1 }, attestant.Select(p => p.Id));
        Assert.Equal("rejected", attestant[0].Status);
        Assert.Equal("completed", attestant[1].Status);
        Assert.Empty(await repository.GetRecentPaymentsAsync(1, 2));
    }
}
