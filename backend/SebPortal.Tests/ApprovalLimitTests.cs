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
        private readonly ApprovalLimitService _approvalLimitService;

        public ApprovalLimitTests()
        {
            _repositoryMock = new Mock<IApprovalLimitRepository>();
            _approvalLimitService = new ApprovalLimitService(_repositoryMock.Object);

        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnResponseDTO_WhenLimitExists()
        {
            // Arrange
            int id = 1;
            int tenantId = 10;

            var existingLimit = new ApprovalLimit
            {
                Id = id,
                TenantId = tenantId,
                MinAmount = 1000m,
                RequiredApprovals = 2,
                Description = "Testgräns"
            };

            _repositoryMock.Setup(r => r.GetByIdAsync(id, tenantId))
                .ReturnsAsync(existingLimit);

            // Act
            var result = await _approvalLimitService.GetByIdAsync(id, tenantId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(id, result.Id);
            Assert.Equal(tenantId, result.TenantId);
            Assert.Equal(1000m, result.MinAmount);
            Assert.Equal(2, result.RequiredApprovals);
            Assert.Equal("Testgräns", result.Description);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowException_WhenLimitNotExists()
        {
            // Arrange
            int id = 1;
            int tenantId = 10;

            _repositoryMock.Setup(r => r.GetByIdAsync(id, tenantId))
                .ReturnsAsync((ApprovalLimit?)null);

            // Act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _approvalLimitService.GetByIdAsync(id, tenantId);
            });

            Assert.Equal($"Attestbeloppgräns med id: {id} hittades inte", exception.Message);

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
            Assert.Equal(1, limitList[0].Id);
            Assert.Equal(tenantId, limitList[0].TenantId);
            Assert.Equal(50000, limitList[0].MinAmount);
            Assert.Equal(1, limitList[0].RequiredApprovals);
            //limit 2 
            Assert.Equal(2, limitList[1].Id);
            Assert.Equal(tenantId, limitList[1].TenantId);
            Assert.Equal(200000, limitList[1].MinAmount);
            Assert.Equal(2, limitList[1].RequiredApprovals);
        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldReturnResponseDTO_WhenLimitIsUnique()
        {
            // Arrange
            int tenantId = 1;
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

            var result = await _approvalLimitService.CreateApprovalLimitAsync(tenantId, modifiedBy, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(100000, result.MinAmount);
            Assert.Equal(2, result.RequiredApprovals);
            Assert.Equal("Dubbel attest", result.Description);

        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldThrowException_WhenHigherAmountHasFewerApprovals()
        {
            // Arrange
            int tenantId = 1;
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
                await _approvalLimitService.CreateApprovalLimitAsync(tenantId, modifiedBy, dto);
            });

            Assert.Contains("Ogiltig hierarki", exception.Message);
        }

        [Fact]
        public async Task CreateApprovalLimitAsync_ShouldThrowException_WhenLimitAlreadyExists()
        {
            // Arrange
            int tenantId = 1;
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
                await _approvalLimitService.CreateApprovalLimitAsync(tenantId, modifiedBy, dto);
            });

            Assert.Contains("Det finns redan en attestbeloppgräns för beloppet", exception.Message);
        }

        [Fact]
        public async Task DeleteApprovalLimitAsync_ShouldReturnTrue_WhenLimitExists()
        {
            int tenantId = 1;
            int id = 1;

            var existingLimit = new ApprovalLimit
            {
                TenantId = tenantId,
                Id = id,
                MinAmount = 1000,
                RequiredApprovals = 1,
                Description = "Onödig attest"
            };

            _repositoryMock.Setup(r => r.GetByIdAsync(id, tenantId))
                .ReturnsAsync(existingLimit);

            _repositoryMock.Setup(r => r.DeleteApprovalLimitAsync(existingLimit))
                .ReturnsAsync(true);

            var result = await _approvalLimitService.DeleteApprovalLimitAsync(id, tenantId);
            Assert.True(result);
            _repositoryMock.Verify(r => r.DeleteApprovalLimitAsync(existingLimit), Times.Once);
        }
        
        [Fact]
        public async Task DeleteApprovalLimitAsync_ShouldThrowException_WhenLimitNotFound()
        {
            int tenantId = 1;
            int id = 100;

            _repositoryMock.Setup(r => r.GetByIdAsync(id, tenantId))
                .ReturnsAsync((ApprovalLimit?)null);

            //act & assert
            var exception = await Assert.ThrowsAsync<Exception>(async () =>
            {
                await _approvalLimitService.DeleteApprovalLimitAsync(id, tenantId);
            });

            Assert.Equal($"Attestbeloppgräns med id: {id} hittades inte", exception.Message);
        }
    }


//Borttagning(DeleteApprovalLimitAsync) :

////Att gränsen raderas om den finns.

////Att undantag kastas om gränsen saknas.



        //    public async Task<ApprovalLimitResponseDTO> CreateApprovalLimitAsync(int tenantId, string modifiedBy, CreateApprovalLimitDTO dto)
        //    {
        //        var existingLimits = await _repository.GetOrderedLimitsAsync(tenantId);

        //        //validate buissiness logic
        //        ValidateLimitsOrder(existingLimits, dto.MinAmount, dto.RequiredApprovals, null);

        //        var limit = new ApprovalLimit
        //        {
        //            TenantId = tenantId,
        //            MinAmount = dto.MinAmount,
        //            RequiredApprovals = dto.RequiredApprovals,
        //            Description = dto.Description,
        //            CreatedAt = DateTime.UtcNow,
        //            LastModifiedAt = DateTime.UtcNow,
        //            LastModifiedBy = modifiedBy
        //        };
        //        await _repository.CreateApprovalLimitAsync(limit);
        //        return new ApprovalLimitResponseDTO
        //        {
        //            Id = limit.Id,
        //            TenantId = tenantId,
        //            MinAmount = limit.MinAmount,
        //            RequiredApprovals = limit.RequiredApprovals,
        //            Description = limit.Description,
        //            LastModifiedAt = limit.LastModifiedAt,
        //            LastModifiedBy = limit.LastModifiedBy
        //        };
        //    }

        //    public async Task<ApprovalLimitResponseDTO> UpdateApprovalLimitAsync(int id, int tenantId, string modifiedBy, UpdateApprovalLimitDTO dto)
        //    {
        //        var existingLimit = await _repository.GetByIdAsync(id, tenantId);

        //        if (existingLimit == null)
        //        {
        //            throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
        //        }

        //        var existingLimits = await _repository.GetOrderedLimitsAsync(tenantId);

        //        //for validation
        //        decimal targetMinAmount = dto.MinAmount ?? existingLimit.MinAmount;
        //        int targetRequiredApprovals = dto.RequiredApprovals ?? existingLimit.RequiredApprovals;

        //        // Validate with id 
        //        ValidateLimitsOrder(existingLimits, targetMinAmount, targetRequiredApprovals, id);

        //        if (dto.MinAmount != null)
        //        {
        //            existingLimit.MinAmount = dto.MinAmount.Value;
        //        }

        //        if (dto.RequiredApprovals != null)
        //        {
        //            existingLimit.RequiredApprovals = dto.RequiredApprovals.Value;
        //        }

        //        if (dto.Description != null)
        //        {
        //            existingLimit.Description = dto.Description;
        //        }

        //        existingLimit.LastModifiedAt = DateTime.UtcNow;
        //        existingLimit.LastModifiedBy = modifiedBy;


        //        await _repository.UpdateApprovalLimitAsync(existingLimit);
        //        return new ApprovalLimitResponseDTO
        //        {
        //            Id = existingLimit.Id,
        //            TenantId = existingLimit.TenantId,
        //            MinAmount = existingLimit.MinAmount,
        //            RequiredApprovals = existingLimit.RequiredApprovals,
        //            Description = existingLimit.Description,
        //            LastModifiedAt = existingLimit.LastModifiedAt,
        //            LastModifiedBy = existingLimit.LastModifiedBy
        //        };
        //    }

        //    public async Task<bool> DeleteApprovalLimitAsync(int id, int tenantId)
        //    {
        //        var limit = await _repository.GetByIdAsync(id, tenantId);
        //        if (limit == null)
        //        {
        //            throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
        //        }
        //        await _repository.DeleteApprovalLimitAsync(limit);
        //        return true;
        //    }

        //    // Helpmethod for validation
        //    //A limit with higher 
        //    private void ValidateLimitsOrder(IEnumerable<ApprovalLimit> existingLimits, decimal newMinAmount, int newRequiredApprovals, int? updatingId)
        //    {
        //        // 1. create a new list (exclude the unsaved)
        //        var limitsToCheck = existingLimits.Where(l => updatingId == null || l.Id != updatingId.Value).ToList();

        //        // 2. check if the amount already exists on another approvallimit
        //        if (limitsToCheck.Any(l => l.MinAmount == newMinAmount))
        //        {
        //            throw new InvalidOperationException($"Det finns redan en attestbeloppgräns för beloppet {newMinAmount}.");
        //        }

        //        // 3. Add the unsaved limit to the list and sort it by MinAmount rising
        //        limitsToCheck.Add(new ApprovalLimit
        //        {
        //            MinAmount = newMinAmount,
        //            RequiredApprovals = newRequiredApprovals
        //        });

        //        var sortedLimits = limitsToCheck.OrderBy(l => l.MinAmount).ToList();

        //        // 4. Control hierarcy: Higher amount MUST demand more requiredApprovals
        //        for (int i = 0; i < sortedLimits.Count - 1; i++)
        //        {
        //            var current = sortedLimits[i];
        //            var next = sortedLimits[i + 1];

        //            if (current.RequiredApprovals > next.RequiredApprovals)
        //            {
        //                throw new InvalidOperationException(
        //                    $"Ogiltig hierarki: Beloppgränsen {current.MinAmount} kräver {current.RequiredApprovals} attestanter, " +
        //                    $"medan den högre gränsen {next.MinAmount} endast kräver {next.RequiredApprovals}. Högre belopp måste kräva fler attestanter.");
        //            }
        //        }
        //    }

        //}

}

