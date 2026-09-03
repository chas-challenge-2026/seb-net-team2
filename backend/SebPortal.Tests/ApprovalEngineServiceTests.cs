using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using SebPortal.Api.Services;
using SebPortal.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using SebPortal.Models;
using SebPortal.Data;
using Xunit;
using Moq;

namespace SebPortal.Tests;

public class ApprovalEngineServiceTests : IDisposable 
{
    private readonly Mock<IApprovalLimitRepository> _mockLimitRepository;
    private readonly ApprovalEngineService _service;
    private readonly SebDbContext _context;

    public ApprovalEngineServiceTests()
    {
        _mockLimitRepository = new Mock<IApprovalLimitRepository>();
        var options = new DbContextOptionsBuilder<SebDbContext>()
                    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                    .Options;

        _context = new SebDbContext(options);

        // Rules for attenstants: 
        var sampleLimits = new List<ApprovalLimit>
        {
            new() { Id = 1, TenantId = 1, MinAmount = 50000m, RequiredApprovals = 1, Description = "Enkelattest" },
            new() { Id = 2, TenantId = 1, MinAmount = 200000m, RequiredApprovals = 2, Description = "Dubbelattest" }
        };

        _mockLimitRepository
            .Setup(repo => repo.GetOrderedLimitsAsync(It.IsAny<int>()))
            .ReturnsAsync(sampleLimits);

        _service = new ApprovalEngineService(_mockLimitRepository.Object, _context);
    }

    //Runs automatically after each test to clean up database
    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_BelowThreshold_ExecuteDirecly()
    {
        // Arrange
        var payment = new Payment { Id = 101, TenantId = 1, Amount = 30000m, ToIban = "SE123456789", Reference = "Lön" };

        // Act
        var requiresApproval = await _service.ProcessPaymentApprovalAsync(payment);

        // Assert
        Assert.False(requiresApproval);
        Assert.Equal("completed", payment.Status);
        Assert.Empty(await _context.ApprovalSteps.ToListAsync());
    }

    [Fact]
    public async Task ProcessPAymentApprovalAsync_MatchesFirstLimit_OneApprover()
    {
        // Arrange
        var payment = new Payment { Id = 102, TenantId = 1, Amount = 75000m, ToIban = "SE123456789", Reference = "Lön" };
        
        // Act
        var requiresApproval = await _service.ProcessPaymentApprovalAsync(payment);
        
        // Assert
        Assert.True(requiresApproval);
        Assert.Equal("pending_approval", payment.Status);

        var steps = await _context.ApprovalSteps.Where(s => s.PaymentId == payment.Id).ToListAsync();
        Assert.Single(steps);
        Assert.Equal(1, steps.First().StepNumber);
        Assert.Equal("pending", steps.First().Status);
    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_MatchesHighestThreshold_TwoApprovers()
    {
        // Arrange
        var payment = new Payment { Id = 103, TenantId = 1, Amount = 250000m, ToIban = "SE123456789", Reference = "Investering" };

        // Act
        var requiresApproval = await _service.ProcessPaymentApprovalAsync(payment);

        // Assert
        Assert.True(requiresApproval);
        Assert.Equal("pending_approval", payment.Status);

        var steps = await _context.ApprovalSteps
            .Where(s => s.PaymentId == payment.Id)
            .OrderBy(s => s.StepNumber)
            .ToListAsync();

        Assert.Equal(2, steps.Count);
        Assert.Equal(1, steps[0].StepNumber);
        Assert.Equal(2, steps[1].StepNumber);
        Assert.All(steps, step => Assert.Equal("pending", step.Status));
    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_NoLimitsConfigured_ExcecutesDirectly()
    {
        //Arrange
        _mockLimitRepository
            .Setup(repo => repo.GetOrderedLimitsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<ApprovalLimit>());

        var payment = new Payment { Id = 104, TenantId = 1, Amount = 100000m, ToIban = "SE123456789", Reference = "Överföring" };

        //Act 
        var requiresApproval = await _service.ProcessPaymentApprovalAsync(payment);

        //Assert
        Assert.False(requiresApproval);
        Assert.Equal("completed", payment.Status);
        Assert.Empty(await _context.ApprovalSteps.ToListAsync());
    }
}

