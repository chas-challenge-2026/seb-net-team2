using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using SebPortal.Api.Dtos;
using SebPortal.Api.Models;
using SebPortal.Api.Services;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Tests;

public class ReminderServiceTests
{
    [Fact]
    public async Task ProcessRemindersAsync_ShouldSendReminder_WhenDelayHasPassed()
    {
        var options = new DbContextOptionsBuilder<SebDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

        await using var context = new SebDbContext(options);

        var payment = new Payment
        {
            Id = 1,
            TenantId = 1,
            FromAccountId = 1,
            ToIban = "SE123",
            Amount = 100,
            Currency = "SEK",
            Reference = "TEST-001",
            Status = "pending_approval",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var approvalStep = new ApprovalStep
        {
            Id = 1,
            PaymentId = payment.Id,
            Payment = payment,
            AttestantId = 2,
            Status = "pending",
            ReminderCount = 0
        };

        context.Payments.Add(payment);
        context.ApprovalSteps.Add(approvalStep);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();

        var reminderOptions = Options.Create(new ReminderOptions
        {
            DelayMinutes = 60,
            CheckIntervalMinutes = 5
        });

        var service = new ReminderService(context, notificationService.Object, reminderOptions);

        await service.ProcessRemindersAsync();

        notificationService.Verify(
            x => x.SendNotificationMessageAsync(
                It.Is<NotificationMessageDTO>(n =>
                    n.Channel == NotificationChannel.InApp &&
                    n.UserId == 2 &&
                    n.ApprovalStepId == 1)),
            Times.Once);

        Assert.Equal(1, approvalStep.ReminderCount);
        Assert.NotNull(approvalStep.LastReminderSentAt);
    }
    [Fact]
    public async Task ProcessRemindersAsync_ShouldNotSendReminder_BeforeDelayHasPassed()
    {
        var options = new DbContextOptionsBuilder<SebDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

        await using var context = new SebDbContext(options);

        var payment = new Payment
        {
            Id = 1,
            TenantId = 1,
            FromAccountId = 1,
            ToIban = "SE123",
            Amount = 100,
            Currency = "SEK",
            Reference = "TEST-002",
            Status = "pending_approval",
            CreatedByUserId = 1,

            CreatedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        var approvalStep = new ApprovalStep
        {
            Id = 1,
            PaymentId = payment.Id,
            Payment = payment,
            AttestantId = 2,
            Status = "pending",
            ReminderCount = 0
        };

        context.Payments.Add(payment);
        context.ApprovalSteps.Add(approvalStep);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();

        var reminderOptions = Options.Create(new ReminderOptions
        {
            DelayMinutes = 60,
            CheckIntervalMinutes = 5
        });

        var service = new ReminderService(context, notificationService.Object, reminderOptions);

        await service.ProcessRemindersAsync();

        notificationService.Verify(
            x => x.SendNotificationMessageAsync(
                It.IsAny<NotificationMessageDTO>()),
            Times.Never);

        Assert.Equal(0, approvalStep.ReminderCount);
        Assert.Null(approvalStep.LastReminderSentAt);
    }
    [Fact]
    public async Task ProcessRemindersAsync_ShouldNotSendReminder_WhenApprovalStepIsDecided()
    {
        var options = new DbContextOptionsBuilder<SebDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

        await using var context = new SebDbContext(options);

        var payment = new Payment
        {
            Id = 1,
            TenantId = 1,
            FromAccountId = 1,
            ToIban = "SE123",
            Amount = 100,
            Currency = "SEK",
            Reference = "TEST-003",
            Status = "pending_approval",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var approvalStep = new ApprovalStep
        {
            Id = 1,
            PaymentId = payment.Id,
            Payment = payment,
            AttestantId = 2,
            Status = "approved",
            DecidedAt = DateTime.UtcNow.AddMinutes(-30),
            ReminderCount = 0
        };

        context.Payments.Add(payment);
        context.ApprovalSteps.Add(approvalStep);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();

        var reminderOptions = Options.Create(new ReminderOptions
        {
            DelayMinutes = 60,
            CheckIntervalMinutes = 5
        });

        var service = new ReminderService(context, notificationService.Object, reminderOptions);

        await service.ProcessRemindersAsync();

        notificationService.Verify(
            x => x.SendNotificationMessageAsync(
                It.IsAny<NotificationMessageDTO>()),
            Times.Never);

        Assert.Equal(0, approvalStep.ReminderCount);
        Assert.Null(approvalStep.LastReminderSentAt);
    }
    [Fact]
    public async Task ProcessRemindersAsync_ShouldNotSendReminder_WhenTwoRemindersAlreadySent()
    {
        var options = new DbContextOptionsBuilder<SebDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

        await using var context = new SebDbContext(options);

        var payment = new Payment
        {
            Id = 1,
            TenantId = 1,
            FromAccountId = 1,
            ToIban = "SE123",
            Amount = 100,
            Currency = "SEK",
            Reference = "TEST-004",
            Status = "pending_approval",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddHours(-5)
        };

        var approvalStep = new ApprovalStep
        {
            Id = 1,
            PaymentId = payment.Id,
            Payment = payment,
            AttestantId = 2,
            Status = "pending",
            ReminderCount = 2,
            LastReminderSentAt = DateTime.UtcNow.AddHours(-2)
        };

        context.Payments.Add(payment);
        context.ApprovalSteps.Add(approvalStep);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();

        var reminderOptions = Options.Create(new ReminderOptions
        {
            DelayMinutes = 60,
            CheckIntervalMinutes = 5
        });

        var service = new ReminderService(context, notificationService.Object, reminderOptions);

        await service.ProcessRemindersAsync();

        notificationService.Verify(
            x => x.SendNotificationMessageAsync(
                It.IsAny<NotificationMessageDTO>()),
            Times.Never);

        Assert.Equal(2, approvalStep.ReminderCount);
    }
    [Fact]
    public async Task ProcessRemindersAsync_ShouldNotSendSecondReminder_BeforeDelayHasPassed()
    {
        var options = new DbContextOptionsBuilder<SebDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

        await using var context = new SebDbContext(options);

        var payment = new Payment
        {
            Id = 1,
            TenantId = 1,
            FromAccountId = 1,
            ToIban = "SE123",
            Amount = 100,
            Currency = "SEK",
            Reference = "TEST-005",
            Status = "pending_approval",
            CreatedByUserId = 1,
            CreatedAt = DateTime.UtcNow.AddHours(-3)
        };

        var approvalStep = new ApprovalStep
        {
            Id = 1,
            PaymentId = payment.Id,
            Payment = payment,
            AttestantId = 2,
            Status = "pending",

            ReminderCount = 1,

            LastReminderSentAt = DateTime.UtcNow.AddMinutes(-10)
        };

        context.Payments.Add(payment);
        context.ApprovalSteps.Add(approvalStep);
        await context.SaveChangesAsync();

        var notificationService = new Mock<INotificationService>();

        var reminderOptions = Options.Create(new ReminderOptions
        {
            DelayMinutes = 60,
            CheckIntervalMinutes = 5
        });

        var service = new ReminderService(context, notificationService.Object, reminderOptions);

        await service.ProcessRemindersAsync();

        notificationService.Verify(
            x => x.SendNotificationMessageAsync(
                It.IsAny<NotificationMessageDTO>()),
            Times.Never);

        Assert.Equal(1, approvalStep.ReminderCount);
    }
}