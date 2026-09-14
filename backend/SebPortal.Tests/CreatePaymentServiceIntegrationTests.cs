using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Tests;

public class CreatePaymentServiceIntegrationTests
{
    [Fact]
    public async Task CreatePaymentAsync_WhenPaymentInsertFails_RollsBackBalance()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        int userId;
        int accountId;

        await using (var context = new SebDbContext(options))
        {
            await context.Database.EnsureCreatedAsync();

            var tenant = new Tenant
            {
                Name = "Test Tenant"
            };

            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();

            var user = new User
            {
                TenantId = tenant.Id,
                Name = "Test User",
                Email = "test@example.com",
                PasswordHash = "testhash",
                Role = "user"
            };

            var account = new Account
            {
                TenantId = tenant.Id,
                AccountName = "Test Account",
                Iban = "SE3550000000054910000003",
                Balance = 1000m,
                Currency = "SEK"
            };

            context.Users.Add(user);
            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            userId = user.Id;
            accountId = account.Id;

            var userRepository = new UserRepository(context);
            var paymentRepository = new PaymentRepository(context);

            // Det här testet handlar om saldo-rollback, inte om attestregler —
            // en mockad, tom limit-lista räcker (och undviker en SQLite-specifik
            // begränsning: providern kan inte översätta ORDER BY på en decimal-
            // kolumn, vilket den riktiga ApprovalLimitRepository gör).
            var mockLimitRepository = new Mock<IApprovalLimitRepository>();
            mockLimitRepository
                .Setup(repo => repo.GetOrderedLimitsAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<ApprovalLimit>());
            var mockUserRepository = new Mock<IUserRepository>();
            var approvalEngineService = new ApprovalEngineService(mockLimitRepository.Object, mockUserRepository.Object, context);

            var service = new CreatePaymentService(userRepository, paymentRepository, approvalEngineService, context);

            var dto = new CreatePaymentDTO
            {
                FromAccountId = account.Id,
                ToIban = "SE4550000000054910000004",
                Amount = 500m,
                Currency = "SEK",

                // This intentionally makes SaveChangesAsync fail.
                Reference = null!
            };

            // Act
            await Assert.ThrowsAsync<DbUpdateException>(() => service.CreatePaymentAsync(dto, user.Id));
        }

        // Assert
        await using var verificationContext = new SebDbContext(options);

        var accountAfter = await verificationContext.Accounts.SingleAsync(a => a.Id == accountId);

        var paymentCount = await verificationContext.Payments.CountAsync();

        Assert.Equal(1000m, accountAfter.Balance);
        Assert.Equal(0, paymentCount);
    }
}