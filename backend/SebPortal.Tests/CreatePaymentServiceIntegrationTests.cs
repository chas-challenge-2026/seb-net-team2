using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Csv;
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
        int tenantId;

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
                Role = UserRoles.User
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
            tenantId = tenant.Id;

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
            var mockNotificationService = new Mock<INotificationService>();
            var approvalEngineService = new ApprovalEngineService(mockLimitRepository.Object, mockUserRepository.Object, context);

            var service = new CreatePaymentService(userRepository, paymentRepository, approvalEngineService, mockNotificationService.Object, new AuditRepository(context), context);

            var dto = new CreatePaymentDTO
            {
                FromAccountId = account.PublicId,
                ToIban = "SE4550000000054910000004",
                Amount = 500m,
                Currency = "SEK",

                // This intentionally makes SaveChangesAsync fail.
                Reference = null!
            };

            // Act
            await Assert.ThrowsAsync<DbUpdateException>(() => service.CreatePaymentAsync(dto, user.Id, tenantId));
        }

        // Assert
        await using var verificationContext = new SebDbContext(options);

        var accountAfter = await verificationContext.Accounts.SingleAsync(a => a.Id == accountId);

        var paymentCount = await verificationContext.Payments.CountAsync();

        Assert.Equal(1000m, accountAfter.Balance);
        Assert.Equal(0, paymentCount);
        Assert.Equal(0, await verificationContext.AuditEntries.CountAsync());
    }

    [Fact]
    public async Task CreatePaymentAsync_BelowApprovalLimit_LogsCreateAndExecute()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        int paymentId;
        int tenantId;
        int userId;

        await using (var context = new SebDbContext(options))
        {
            await context.Database.EnsureCreatedAsync();

            var tenant = new Tenant { Name = "Test Tenant" };
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();

            var user = new User
            {
                TenantId = tenant.Id,
                Name = "Test User",
                Email = "test@example.com",
                PasswordHash = "testhash",
                Role = UserRoles.Initiator
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

            tenantId = tenant.Id;
            userId = user.Id;

            // No limits means the payment is executed immediately
            var mockLimitRepository = new Mock<IApprovalLimitRepository>();
            mockLimitRepository
                .Setup(repo => repo.GetOrderedLimitsAsync(It.IsAny<int>()))
                .ReturnsAsync(new List<ApprovalLimit>());
            var approvalEngineService = new ApprovalEngineService(mockLimitRepository.Object, new Mock<IUserRepository>().Object, context);

            var service = new CreatePaymentService(
                new UserRepository(context),
                new PaymentRepository(context),
                approvalEngineService,
                new Mock<INotificationService>().Object,
                new AuditRepository(context),
                context);

            // Act
            var payment = await service.CreatePaymentAsync(new CreatePaymentDTO
            {
                FromAccountId = account.PublicId,
                ToIban = "SE4550000000054910000004",
                Amount = 500m,
                Currency = "SEK",
                Reference = "Faktura 123"
            }, user.Id, tenantId);

            paymentId = payment.Id;
        }

        // Assert
        await using var verificationContext = new SebDbContext(options);

        var entries = await verificationContext.AuditEntries
            .Where(e => e.EntityType == AuditEntityTypes.Payment && e.EntityId == paymentId)
            .OrderBy(e => e.Id)
            .ToListAsync();

        Assert.Equal(new[] { AuditActions.CreatePayment, AuditActions.ExecutePayment }, entries.Select(e => e.Action));
        Assert.All(entries, e =>
        {
            Assert.Equal(tenantId, e.TenantId);
            Assert.Equal(userId, e.UserId);
        });

        var createDetails = entries[0].Details!;
        Assert.Contains("\"fromAccountName\":\"Test Account\"", createDetails);
        Assert.Contains("\"toIban\":\"SE4550000000054910000004\"", createDetails);
        Assert.Contains("\"balanceAfter\":500", createDetails);
    }

    [Fact]
    public async Task CreatePaymentsAsync_WhenLaterRowExceedsBalance_RollsBackEntireBatch()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        int accountId;
        int tenantId;
        Guid accountPublicId;
        int userId;

        await using (var context = new SebDbContext(options))
        {
            var (service, notifications, user, account) = await CreateBatchServiceAsync(context);
            accountId = account.Id;
            tenantId = user.TenantId;
            accountPublicId = account.PublicId;
            userId = user.Id;

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreatePaymentsAsync(
            [
                BatchRow(accountPublicId, 600m, "SE4550000000054910000004", "Rad 1"),
                BatchRow(accountPublicId, 600m, "SE4550000000054910000005", "Rad 2"),
            ], userId, tenantId));

            Assert.StartsWith("Row 2:", ex.Message);
            notifications.Verify(
                n => n.SendNotificationMessageAsync(It.IsAny<NotificationMessageDTO>()),
                Times.Never);
        }

        await using var verificationContext = new SebDbContext(options);
        var accountAfter = await verificationContext.Accounts.SingleAsync(a => a.Id == accountId);

        Assert.Equal(1000m, accountAfter.Balance);
        Assert.Equal(0, await verificationContext.Payments.CountAsync());
        Assert.Equal(0, await verificationContext.AuditEntries.CountAsync());
        Assert.Equal(0, await verificationContext.ApprovalSteps.CountAsync());
    }

    [Fact]
    public async Task CreatePaymentsAsync_WhenAllRowsSucceed_CommitsEveryPayment()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        int accountId;

        await using (var context = new SebDbContext(options))
        {
            var (service, notifications, user, account) = await CreateBatchServiceAsync(context);
            accountId = account.Id;

            var payments = await service.CreatePaymentsAsync(
            [
                BatchRow(account.PublicId, 200m, "SE4550000000054910000004", "Rad 1"),
                BatchRow(account.PublicId, 300m, "SE4550000000054910000005", "Rad 2"),
            ], user.Id, user.TenantId);

            Assert.Equal(2, payments.Count);
            notifications.Verify(
                n => n.SendNotificationMessageAsync(It.IsAny<NotificationMessageDTO>()),
                Times.Exactly(2));
        }

        await using var verificationContext = new SebDbContext(options);
        var accountAfter = await verificationContext.Accounts.SingleAsync(a => a.Id == accountId);

        Assert.Equal(500m, accountAfter.Balance);
        Assert.Equal(2, await verificationContext.Payments.CountAsync());
        Assert.Equal(4, await verificationContext.AuditEntries.CountAsync());
    }

    [Fact]
    public async Task CreatePaymentsAsync_WhenCsvLaterRowExceedsBalance_RollsBackEntireBatch()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        int accountId;

        await using (var context = new SebDbContext(options))
        {
            var (service, notifications, user, account) = await CreateBatchServiceAsync(context);
            accountId = account.Id;

            var csv = $"""
                from_account_id,to_iban,amount,reference
                {account.Id},SE4550000000054910000004,600.00,Rad 1
                {account.Id},SE4550000000054910000005,600.00,Rad 2
                """;
            var rows = NativeCsv.Parse(Encoding.UTF8.GetBytes(csv));
            Assert.Equal(new[] { 600m, 600m }, rows.Select(row => row.Amount));

            var accounts = new AccountRepository(context);
            var dtos = new List<CreatePaymentDTO>(rows.Count);
            foreach (var row in rows)
            {
                var source = await accounts.GetAccountByIdAsync(row.FromAccountId, user.TenantId);
                Assert.NotNull(source);
                dtos.Add(new CreatePaymentDTO
                {
                    FromAccountId = source.PublicId,
                    ToIban = row.ToIban,
                    Amount = row.Amount,
                    Currency = "SEK",
                    Reference = row.Reference,
                });
            }

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreatePaymentsAsync(
                dtos, user.Id, user.TenantId));

            Assert.StartsWith("Row 2:", ex.Message);
            notifications.Verify(
                n => n.SendNotificationMessageAsync(It.IsAny<NotificationMessageDTO>()),
                Times.Never);
        }

        await using var verificationContext = new SebDbContext(options);
        var accountAfter = await verificationContext.Accounts.SingleAsync(a => a.Id == accountId);

        Assert.Equal(1000m, accountAfter.Balance);
        Assert.Equal(0, await verificationContext.Payments.CountAsync());
        Assert.Equal(0, await verificationContext.AuditEntries.CountAsync());
        Assert.Equal(0, await verificationContext.ApprovalSteps.CountAsync());
    }

    private static async Task<(CreatePaymentService Service, Mock<INotificationService> Notifications, User User, Account Account)> CreateBatchServiceAsync(SebDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        var tenant = new Tenant { Name = "Test Tenant" };
        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        var user = new User
        {
            TenantId = tenant.Id,
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = "testhash",
            Role = UserRoles.Initiator
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

        var notifications = new Mock<INotificationService>();
        var mockLimitRepository = new Mock<IApprovalLimitRepository>();
        mockLimitRepository
            .Setup(repo => repo.GetOrderedLimitsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<ApprovalLimit>());

        var service = new CreatePaymentService(
            new UserRepository(context),
            new PaymentRepository(context),
            new ApprovalEngineService(mockLimitRepository.Object, new Mock<IUserRepository>().Object, context),
            notifications.Object,
            new AuditRepository(context),
            context);

        return (service, notifications, user, account);
    }

    private static CreatePaymentDTO BatchRow(Guid fromAccountId, decimal amount, string toIban, string reference)
    {
        return new CreatePaymentDTO
        {
            FromAccountId = fromAccountId,
            ToIban = toIban,
            Amount = amount,
            Currency = "SEK",
            Reference = reference
        };
    }
}