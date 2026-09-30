using Microsoft.EntityFrameworkCore;
using Moq;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Tests
{
    public class ApprovalServiceTests : IDisposable
    {
        private readonly Mock<IApprovalRepository> _approvalRepositoryMock;
        private readonly Mock<IPaymentRepository> _paymentRepositoryMock;
        private readonly Mock<IAccountRepository> _accountRepositoryMock;
        private readonly Mock<IAuditRepository> _auditRepositoryMock;
        private readonly SebDbContext _context;
        private readonly ApprovalService _service;

        public ApprovalServiceTests()
        {
            _approvalRepositoryMock = new Mock<IApprovalRepository>();
            _paymentRepositoryMock = new Mock<IPaymentRepository>();
            _accountRepositoryMock = new Mock<IAccountRepository>();
            _auditRepositoryMock = new Mock<IAuditRepository>();

            var options = new DbContextOptionsBuilder<SebDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new SebDbContext(options);

            _service = new ApprovalService(
                _approvalRepositoryMock.Object,
                _paymentRepositoryMock.Object,
                _accountRepositoryMock.Object,
                _auditRepositoryMock.Object,
                _context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task GetPendingStepsForAttestantAsync_ReturnsMappedDtos_AcrossMultiplePayments()
        {
            // Arrange: two pending steps for the same attestant, on two different payments -
            // this is exactly the scenario the attestant's "my pending approvals" inbox needs,
            // without already knowing either PaymentId up front.
            int attestantId = 7;

            var paymentA = new Payment
            {
                Id = 101,
                TenantId = 1,
                ToIban = "SE1111111111111111111111",
                Amount = 15000m,
                Currency = "SEK",
                Reference = "Faktura 1",
                CreatedByUserId = 3,
                CreatedByUser = new User { Id = 3, TenantId = 1, Name = "Lisa Svensson", Email = "lisa@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 1)
            };

            var paymentB = new Payment
            {
                Id = 102,
                TenantId = 1,
                ToIban = "SE2222222222222222222222",
                Amount = 250000m,
                Currency = "SEK",
                Reference = "Faktura 2",
                CreatedByUserId = 4,
                CreatedByUser = new User { Id = 4, TenantId = 1, Name = "Erik Nilsson", Email = "erik@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 2)
            };

            var steps = new List<ApprovalStep>
            {
                new() { Id = 1, PaymentId = paymentA.Id, Payment = paymentA, AttestantId = attestantId, StepNumber = 1, Status = "pending" },
                new() { Id = 2, PaymentId = paymentB.Id, Payment = paymentB, AttestantId = attestantId, StepNumber = 1, Status = "pending" }
            };

            _approvalRepositoryMock
                .Setup(r => r.GetPendingStepsForAttestantAsync(attestantId))
                .ReturnsAsync(steps);

            // Act
            var result = (await _service.GetPendingStepsForAttestantAsync(attestantId)).ToList();

            // Assert
            Assert.Equal(2, result.Count);

            var first = result.Single(r => r.PaymentId == paymentA.Id);
            Assert.Equal(1, first.StepId);
            Assert.Equal(15000m, first.Amount);
            Assert.Equal("SE1111111111111111111111", first.ToIban);
            Assert.Equal("Faktura 1", first.Reference);
            Assert.Equal(3, first.CreatedByUserId);
            Assert.Equal("Lisa Svensson", first.CreatedByUserName);

            var second = result.Single(r => r.PaymentId == paymentB.Id);
            Assert.Equal(2, second.StepId);
            Assert.Equal(250000m, second.Amount);
        }

        [Fact]
        public async Task GetPendingStepsForAttestantAsync_ReturnsEmpty_WhenNoPendingSteps()
        {
            int attestantId = 7;

            _approvalRepositoryMock
                .Setup(r => r.GetPendingStepsForAttestantAsync(attestantId))
                .ReturnsAsync(new List<ApprovalStep>());

            var result = await _service.GetPendingStepsForAttestantAsync(attestantId);

            Assert.Empty(result);
        }
    }
}
