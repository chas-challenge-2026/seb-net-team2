using Microsoft.Extensions.Configuration;
using Moq;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;

namespace SebPortal.Tests
{
    public class ApprovalLimitTests
    {
        private readonly Mock<IApprovalLimitRepository> _repositoryMock;
        private readonly Mock<IAuditRepository> _auditRepositoryMock;
        private readonly ApprovalLimitService _approvalLimitService;

        public ApprovalLimitTests()
        {
            _repositoryMock = new Mock<IApprovalLimitRepository>();
            _auditRepositoryMock = new Mock<IAuditRepository>();
            _approvalLimitService = new ApprovalLimitService(_repositoryMock.Object, _auditRepositoryMock.Object);

        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnResponseDTO_WhenLimitExists()
        {
            // Arrange
            int id = 1;
            var publicId = Guid.NewGuid();
            int tenantId = 10;

            var existingLimit = new ApprovalLimit
            {
                Id = id,
                PublicId = publicId,
                TenantId = tenantId,
                MinAmount = 1000m,
                RequiredApprovals = 2,
                Description = "Testgräns"
            };

            _repositoryMock.Setup(r => r.GetByPublicIdAsync(publicId, tenantId))
                .ReturnsAsync(existingLimit);

            // Act
            var result = await _approvalLimitService.GetByIdAsync(publicId, tenantId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(publicId, result.Id);
            Assert.Equal(tenantId, result.TenantId);
            Assert.Equal(1000m, result.MinAmount);
            Assert.Equal(2, result.RequiredApprovals);
            Assert.Equal("Testgräns", result.Description);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowException_WhenLimitNotExists()
        {
            // Arrange
            var publicId = Guid.NewGuid();
            int tenantId = 10;

            _repositoryMock.Setup(r => r.GetByPublicIdAsync(publicId, tenantId))
                .ReturnsAsync((ApprovalLimit?)null);

            // Act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _approvalLimitService.GetByIdAsync(publicId, tenantId);
            });

            Assert.Equal($"Attestbeloppgräns med id: {publicId} hittades inte", exception.Message);

        }


        [Fact]
        public async Task GetOrderedLimitsAsync_ShouldReturnAList_WhenLimitsExists()
        {
            //arrange
            int tenantId = 1;
            var limits = new List<ApprovalLimit>
            {
                new ApprovalLimit
                {
                    Id = 1,
                    TenantId = tenantId,
                    MinAmount = 50000,
                    RequiredApprovals = 1,
                },

                new ApprovalLimit
                {
                    Id = 2,
                    TenantId = tenantId,
                    MinAmount = 200000,
                    RequiredApprovals = 2,
                }
            };

            _repositoryMock.Setup(r => r.GetOrderedLimitsAsync(tenantId))
                .ReturnsAsync(limits);

            //act
            var result = await _approvalLimitService.GetOrderedLimitsAsync(tenantId);

            //assert
            Assert.NotNull(result);
            var limitList = result.ToList();
            Assert.Equal(2, limitList.Count);
            //limit 1 
            Assert.Equal(limits[0].PublicId, limitList[0].Id);
            Assert.Equal(tenantId, limitList[0].TenantId);
            Assert.Equal(50000, limitList[0].MinAmount);
            Assert.Equal(1, limitList[0].RequiredApprovals);
            //limit 2 
            Assert.Equal(limits[1].PublicId, limitList[1].Id);
            Assert.Equal(tenantId, limitList[1].TenantId);
            Assert.Equal(200000, limitList[1].MinAmount);
            Assert.Equal(2, limitList[1].RequiredApprovals);
        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldReturnResponseDTO_WhenLimitIsUnique()
        {
            // Arrange
            int tenantId = 1;
            int userId = 42;
            string modifiedBy = "Admin";

            var existingLimits = new List<ApprovalLimit>
            {
                new ApprovalLimit { Id = 1, TenantId = tenantId, MinAmount = 10000, RequiredApprovals = 1 }
            };

            var dto = new CreateApprovalLimitDTO
            {
                MinAmount = 100000,
                RequiredApprovals = 2,
                Description = "Dubbel attest"
            };

            _repositoryMock.Setup(r => r.GetOrderedLimitsAsync(tenantId))
                .ReturnsAsync(existingLimits);

            // Act

            var result = await _approvalLimitService.CreateApprovalLimitAsync(tenantId, userId, modifiedBy, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100000, result.MinAmount);
            Assert.Equal(2, result.RequiredApprovals);
            Assert.Equal("Dubbel attest", result.Description);

            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.Is<AuditEntries>(e =>
                e.UserId == userId &&
                e.TenantId == tenantId && 
                e.Action == "CREATE_APPROVAL_LIMIT" &&
                e.EntityType == "approvalLimit")), Times.Once);
        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldThrowException_WhenHigherAmountHasFewerApprovals()
        {
            // Arrange
            int tenantId = 1;
            int userId = 42;
            string modifiedBy = "Admin";

            var existingLimits = new List<ApprovalLimit>
            {
                new ApprovalLimit { Id = 1, TenantId = tenantId, MinAmount = 1000, RequiredApprovals = 2 }
            };

            // try to add higher limit with fewer approvals (breakes rule of hierarchy)
            var dto = new CreateApprovalLimitDTO
            {
                MinAmount = 5000,
                RequiredApprovals = 1,
                Description = "Ogiltig approvals"
            };

            _repositoryMock.Setup(r => r.GetOrderedLimitsAsync(tenantId))
                .ReturnsAsync(existingLimits);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _approvalLimitService.CreateApprovalLimitAsync(tenantId, userId, modifiedBy, dto);
            });

            Assert.Contains("Ogiltig hierarki", exception.Message);
            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.IsAny<AuditEntries>()), Times.Never);
        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldThrowException_WhenLimitAlreadyExists()
        {
            // Arrange
            int tenantId = 1;
            int userId = 42;
            string modifiedBy = "Admin";

            var existingLimits = new List<ApprovalLimit>
            {
                new ApprovalLimit { Id = 1, TenantId = tenantId, MinAmount = 1000, RequiredApprovals = 2 }
            };

            var dto = new CreateApprovalLimitDTO
            {
                MinAmount = 1000,
                RequiredApprovals = 1,
                Description = "Ogiltig beloppgräns (finns redan)"
            };

            _repositoryMock.Setup(r => r.GetOrderedLimitsAsync(tenantId))
                .ReturnsAsync(existingLimits);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _approvalLimitService.CreateApprovalLimitAsync(tenantId, userId, modifiedBy, dto);
            });

            Assert.Contains("Det finns redan en attestbeloppgräns för beloppet", exception.Message);
            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.IsAny<AuditEntries>()), Times.Never);
        }

        [Fact]
        public async Task UpdateApprovalLimitAsync_ShouldUpdateAndLookUpByCorrectIdAndTenant_WhenLimitExists()
        {
            // Arrange
            int tenantId = 10;
            int id = 1;
            var publicId = Guid.NewGuid();
            int userId = 42;
            string modifiedBy = "Admin";

            var existingLimit = new ApprovalLimit
            {
                Id = id,
                PublicId = publicId,
                TenantId = tenantId,
                MinAmount = 1000m,
                RequiredApprovals = 1,
                Description = "Gammal beskrivning"
            };

            // GetByPublicIdAsync must be called with (publicId, tenantId) exactly as the repository expects -
            // this pins down the parameter order bug where id and tenantId were swapped.
            _repositoryMock.Setup(r => r.GetByPublicIdAsync(publicId, tenantId))
                .ReturnsAsync(existingLimit);

            _repositoryMock.Setup(r => r.GetOrderedLimitsAsync(tenantId))
                .ReturnsAsync(new List<ApprovalLimit> { existingLimit });

            var dto = new UpdateApprovalLimitDTO
            {
                MinAmount = 2000m,
                RequiredApprovals = 2,
                Description = "Ny beskrivning"
            };

            // Act
            var result = await _approvalLimitService.UpdateApprovalLimitAsync(tenantId, publicId, userId, modifiedBy, dto);

            // Assert
            Assert.Equal(publicId, result.Id);
            Assert.Equal(tenantId, result.TenantId);
            Assert.Equal(2000m, result.MinAmount);
            Assert.Equal(2, result.RequiredApprovals);
            Assert.Equal("Ny beskrivning", result.Description);
            Assert.Equal(modifiedBy, result.LastModifiedBy);
            _repositoryMock.Verify(r => r.GetByPublicIdAsync(publicId, tenantId), Times.Once);

            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.Is<AuditEntries>(e =>
                e.UserId == userId &&
                e.TenantId == tenantId &&
                e.Action == "UPDATE_APPROVAL_LIMIT" &&
                e.EntityType == "approvalLimit" &&
                e.EntityId == id)), Times.Once);
        }

        [Fact]
        public async Task DeleteApprovalLimitAsync_ShouldReturnTrue_WhenLimitExists()
        {
            int tenantId = 1;
            int id = 1;
            var publicId = Guid.NewGuid();
            int userId = 42;

            var existingLimit = new ApprovalLimit
            {
                TenantId = tenantId,
                Id = id,
                PublicId = publicId,
                MinAmount = 1000,
                RequiredApprovals = 1,
                Description = "Onödig attest"
            };

            _repositoryMock.Setup(r => r.GetByPublicIdAsync(publicId, tenantId))
                .ReturnsAsync(existingLimit);

            _repositoryMock.Setup(r => r.DeleteApprovalLimitAsync(id, tenantId))
                .ReturnsAsync(true);

            var result = await _approvalLimitService.DeleteApprovalLimitAsync(tenantId, publicId, userId);
            Assert.True(result);
            _repositoryMock.Verify(r => r.DeleteApprovalLimitAsync(id, tenantId), Times.Once);

            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.Is<AuditEntries>(e =>
                e.UserId == userId &&
                e.Action == "DELETE_APPROVAL_LIMIT" &&
                e.EntityType == "approvalLimit" &&
                e.EntityId == id)), Times.Once);
        }

        [Fact]
        public async Task DeleteApprovalLimitAsync_ShouldThrowException_WhenLimitNotFound()
        {
            int tenantId = 1;
            var publicId = Guid.NewGuid();
            int userId = 42;

            _repositoryMock.Setup(r => r.GetByPublicIdAsync(publicId, tenantId))
                .ReturnsAsync((ApprovalLimit?)null);

            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _approvalLimitService.DeleteApprovalLimitAsync(tenantId, publicId, userId);
            });

            Assert.Equal($"Attestbeloppgräns med id: {publicId} hittades inte", exception.Message);
            _auditRepositoryMock.Verify(a => a.AddEntryAsync(It.IsAny<AuditEntries>()), Times.Never);
        }
    }




}

