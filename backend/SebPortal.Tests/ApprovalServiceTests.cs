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
        private readonly Mock<INotificationService> _notificationServiceMock;
        public ApprovalServiceTests()
        {
            _approvalRepositoryMock = new Mock<IApprovalRepository>();
            _paymentRepositoryMock = new Mock<IPaymentRepository>();
            _accountRepositoryMock = new Mock<IAccountRepository>();
            _auditRepositoryMock = new Mock<IAuditRepository>();
            _notificationServiceMock = new Mock<INotificationService>();


            var options = new DbContextOptionsBuilder<SebDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new SebDbContext(options);

            _service = new ApprovalService(
                _approvalRepositoryMock.Object,
                _paymentRepositoryMock.Object,
                _accountRepositoryMock.Object,
                _auditRepositoryMock.Object,
                _context,
                _notificationServiceMock.Object);
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
            int tenantId = 1;

            var paymentA = new Payment
            {
                Id = 101,
                TenantId = tenantId,
                ToIban = "SE1111111111111111111111",
                Amount = 15000m,
                Currency = "SEK",
                Reference = "Faktura 1",
                CreatedByUserId = 3,
                CreatedByUser = new User { Id = 3, TenantId = tenantId, Name = "Lisa Svensson", Email = "lisa@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 1)
            };

            var paymentB = new Payment
            {
                Id = 102,
                TenantId = tenantId,
                ToIban = "SE2222222222222222222222",
                Amount = 250000m,
                Currency = "SEK",
                Reference = "Faktura 2",
                CreatedByUserId = 4,
                CreatedByUser = new User { Id = 4, TenantId = tenantId, Name = "Erik Nilsson", Email = "erik@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 2)
            };

            var steps = new List<ApprovalStep>
            {
                new() { Id = 1, PaymentId = paymentA.Id, Payment = paymentA, AttestantId = attestantId, StepNumber = 1, Status = "pending" },
                new() { Id = 2, PaymentId = paymentB.Id, Payment = paymentB, AttestantId = attestantId, StepNumber = 1, Status = "pending" }
            };

            _approvalRepositoryMock
                .Setup(r => r.GetPendingStepsForAttestantAsync(attestantId, tenantId))
                .ReturnsAsync(steps);

            // Act
            var result = (await _service.GetPendingStepsForAttestantAsync(attestantId, tenantId)).ToList();

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
            int tenantId = 1;

            _approvalRepositoryMock
                .Setup(r => r.GetPendingStepsForAttestantAsync(attestantId, tenantId))
                .ReturnsAsync(new List<ApprovalStep>());

            var result = await _service.GetPendingStepsForAttestantAsync(attestantId, tenantId);

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetRecentApprovalsForTenantAsync_ReturnsMappedDtos()
        {
            // Arrange
            int tenantId = 1;
            var payment = new Payment
            {
                Id = 201,
                TenantId = tenantId,
                Amount = 50000m,
                Currency = "SEK",
                ToIban = "SE9999999999999999999999",
                Reference = "Leverantörsfaktura",
                CreatedByUserId = 3,
                CreatedByUser = new User { Id = 3, TenantId = tenantId, Name = "Lisa Svensson", Email = "lisa@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 10)
            };

            var steps = new List<ApprovalStep>
            {
                new()
                {
                    Id = 10,
                    PaymentId = payment.Id,
                    Payment = payment,
                    StepNumber = 1,
                    Status = "completed",
                    DecidedAt = new DateTime(2026, 9, 11)
                }
            };

            _approvalRepositoryMock
                .Setup(r => r.GetRecentApprovalsForTenantAsync(tenantId))
                .ReturnsAsync(steps);

            // Act
            var result = (await _service.GetRecentApprovalsForTenantAsync(tenantId)).ToList();

            // Assert
            var item = Assert.Single(result);
            Assert.Equal(10, item.StepId);
            Assert.Equal(201, item.PaymentId);
            Assert.Equal(50000m, item.Amount);
            Assert.Equal("SE9999999999999999999999", item.ToIban);
            Assert.Equal("Lisa Svensson", item.CreatedByUserName);
        }

        [Fact]
        public async Task GetApprovalHistoryForAttestantAsync_ReturnsMappedDtos()
        {
            // Arrange
            int attestantId = 7;
            int tenantId = 1;
            var payment = new Payment
            {
                Id = 301,
                TenantId = tenantId,
                Amount = 12000m,
                Currency = "SEK",
                ToIban = "SE8888888888888888888888",
                Reference = "Kontorsmaterial",
                CreatedByUserId = 4,
                CreatedByUser = new User { Id = 4, TenantId = tenantId, Name = "Erik Nilsson", Email = "erik@malmobygg.se", PasswordHash = "hash", Role = "initiator" },
                CreatedAt = new DateTime(2026, 9, 12)
            };

            var steps = new List<ApprovalStep>
            {
                new()
                {
                    Id = 20,
                    PaymentId = payment.Id,
                    Payment = payment,
                    AttestantId = attestantId,
                    StepNumber = 1,
                    Status = "approved",
                    DecidedAt = new DateTime(2026, 9, 13)
                }
            };

            _approvalRepositoryMock
                .Setup(r => r.GetApprovalHistoryForAttestantAsync(attestantId, tenantId))
                .ReturnsAsync(steps);

            // Act
            var result = (await _service.GetApprovalHistoryForAttestantAsync(attestantId, tenantId)).ToList();

            // Assert
            var item = Assert.Single(result);
            Assert.Equal(20, item.StepId);
            Assert.Equal(12000m, item.Amount);
            Assert.Equal("Erik Nilsson", item.CreatedByUserName);
        }

        [Fact]
        public async Task GetRecentApprovalsForTenantAsync_ReturnsEmpty_WhenNoRecentApprovals()
        {
            // Arrange
            int tenantId = 1;

            _approvalRepositoryMock
                .Setup(r => r.GetRecentApprovalsForTenantAsync(tenantId))
                .ReturnsAsync(new List<ApprovalStep>());

            // Act
            var result = await _service.GetRecentApprovalsForTenantAsync(tenantId);

            // Assert
            Assert.Empty(result);
        }
    }
}
