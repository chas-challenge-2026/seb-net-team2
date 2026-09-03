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
public class ApprovalEngineServiceTests
{
    private readonly Mock<IApprovalLimitRepository> _mockLimitRepository;
    private readonly ApprovalEngineService _approvalEngineService;

    public ApprovalEngineServiceTests()
    {
        _mockLimitRepository = new Mock<IApprovalLimitRepository>();
        _approvalEngineService = new ApprovalEngineService(_mockLimitRepository.Object);


        // Rules for attenstants: 
        // 50 000 SEK - 1 approver
        // 200 000 SEK - 2 approvers
        var sampleLimits = new List<ApprovalLimit>
        {
            new() { Id = 1, MinAmount = 50000m, RequiredApprovals = 1, Description = "Enkelattest" },
            new() { Id = 2, MinAmount = 200000m, RequiredApprovals = 2, Description = "Dubbelattest" }
        };

        _mockLimitRepository
            .Setup(repo => repo.GetOrderedLimitsAsync())
            .ReturnsAsync(sampleLimits);

    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_BelowThreshold_ExecuteDirecly()
    {
        // Arrange
        var payment = new Payment { Id = 101, Amount = 30000m };

        // Act
        var requiresApproval = await _approvalEngineService.ProcessPaymentApprovalAsync(payment);

        // Assert
        Assert.False(requiresApproval);
        Assert.Equal("Executed", payment.Status);
        Assert.Empty(payment.ApprovalSteps);
    }

    [Fact]
    public async Task ProcessPAymentApprovalAsync_MatchesFirstLimit_OneApprover()
    {
        // Arrange
        var payment = new Payment { Id = 102, Amount = 75000m };
        // Act
        var requiresApproval = await _approvalEngineService.ProcessPaymentApprovalAsync(payment);
        // Assert
        Assert.True(requiresApproval);
        Assert.Equal("PendingApproval", payment.Status);
        Assert.Single(payment.ApprovalSteps);

        var step = payment.ApprovalSteps.First();
        Assert.Equal(1, step.SequenceOrder);
        Assert.Equal("Pending", step.Status);
    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_MatchesHighestThreshold_TwoApprovers()
    {
        // Arrange
        var payment = new Payment { Id = 103, Amount = 250000m };

        // Act
        var requiresApproval = await _approvalEngineService.ProcessPaymentApprovalAsync(payment);

        // Assert
        Assert.True(requiresApproval);
        Assert.Equal("PendingApproval", payment.Status);
        Assert.Equal(2, payment.ApprovalSteps.Count);

        var steps = payment.ApprovalSteps.OrderBy(s => s.SequenceOrder).ToList();
        Assert.Equal(1, steps[0].SequenceOrder);
        Assert.Equal(2, steps[1].SequenceOrder);
        Assert.All(steps, step => Assert.Equal("Pending", step.Status));
    }

    [Fact]
    public async Task ProcessPaymentApprovalAsync_NoLimitsConfigured_ExcecutesDirectly()
    {
        //Arrange
        _mockLimitRepository
            .Setup(repo => repo.GetOrderedLimitsAsync())
            .ReturnsAsync(new List<ApprovalLimit>());

        var payment = new Payment { Id = 104, Amount = 100000m };

        //Act 
        var requiresApproval = await _approvalEngineService.ProcessPaymentApprovalAsync(payment);

        //Assert
        Assert.False(requiresApproval);
        Assert.Equal("Executed", payment.Status);
        Assert.Empty(payment.ApprovalSteps);


    }



}

