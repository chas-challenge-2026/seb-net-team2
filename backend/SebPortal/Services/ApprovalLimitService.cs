using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Data;
using SebPortal.Models;
using System.Collections.Generic;


namespace SebPortal.Api.Services
{
    public class ApprovalLimitService : IApprovalLimitService
    {
        private readonly IApprovalLimitRepository _repository;

        public ApprovalLimitService(IApprovalLimitRepository repository)
        {
            _repository = repository;
        }


        public async Task<IEnumerable<ApprovalLimitResponseDTO>> GetOrderedLimitsAsync(int tenantId)
        {
            var limits = await _repository.GetOrderedLimitsAsync(tenantId);

            return limits.Select(limit => new ApprovalLimitResponseDTO
            {
                Id = limit.Id,
                TenantId = limit.TenantId,
                MinAmount = limit.MinAmount,
                RequiredApprovals = limit.RequiredApprovals,
                Description = limit.Description,
                LastModifiedAt = limit.LastModifiedAt,
                LastModifiedBy = limit.LastModifiedBy
            });
        }

        public async Task<ApprovalLimitResponseDTO?> GetByIdAsync(int id, int tenantId)
        {
            var limit = await _repository.GetByIdAsync(id, tenantId);
            if (limit == null)
            {
                throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
            }

            return new ApprovalLimitResponseDTO
            {
                Id = limit.Id,
                TenantId = limit.TenantId,
                MinAmount = limit.MinAmount,
                RequiredApprovals = limit.RequiredApprovals,
                Description = limit.Description,
            };
        }


        public async Task<ApprovalLimitResponseDTO> CreateApprovalLimitAsync(int tenantId, string modifiedBy, CreateApprovalLimitDTO dto)
        {
            var existingLimits = await _repository.GetOrderedLimitsAsync(tenantId);

            //validate buissiness logic
            ValidateLimitsOrder(existingLimits, dto.MinAmount, dto.RequiredApprovals, null);

            var limit = new ApprovalLimit
            {
                TenantId = tenantId,
                MinAmount = dto.MinAmount,
                RequiredApprovals = dto.RequiredApprovals,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow,
                LastModifiedBy = modifiedBy
            };
            await _repository.CreateApprovalLimitAsync(limit);
            return new ApprovalLimitResponseDTO
            {
                Id = limit.Id,
                TenantId = tenantId,
                MinAmount = limit.MinAmount,
                RequiredApprovals = limit.RequiredApprovals,
                Description = limit.Description,
                LastModifiedAt = limit.LastModifiedAt,
                LastModifiedBy = limit.LastModifiedBy
            };
        }

        public async Task<ApprovalLimitResponseDTO> UpdateApprovalLimitAsync(int id, int tenantId, string modifiedBy,UpdateApprovalLimitDTO dto)
        {
            var existingLimit = await _repository.GetByIdAsync(id, tenantId);

            if (existingLimit == null)
            {
                throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
            }

            var existingLimits = await _repository.GetOrderedLimitsAsync(tenantId);

            //for validation
            decimal targetMinAmount = dto.MinAmount ?? existingLimit.MinAmount;
            int targetRequiredApprovals = dto.RequiredApprovals ?? existingLimit.RequiredApprovals;

            // Validate with id 
            ValidateLimitsOrder(existingLimits, targetMinAmount, targetRequiredApprovals, id);

            if (dto.MinAmount != null)
            {
                existingLimit.MinAmount = dto.MinAmount.Value;
            }

            if (dto.RequiredApprovals != null)
            {
                existingLimit.RequiredApprovals = dto.RequiredApprovals.Value;
            }

            if (dto.Description != null)
            {
                existingLimit.Description = dto.Description;
            }

            existingLimit.LastModifiedAt = DateTime.UtcNow;
            existingLimit.LastModifiedBy = modifiedBy;


            await _repository.UpdateApprovalLimitAsync(existingLimit);
            return new ApprovalLimitResponseDTO
            {
                Id = existingLimit.Id,
                TenantId = existingLimit.TenantId,
                MinAmount = existingLimit.MinAmount,
                RequiredApprovals = existingLimit.RequiredApprovals,
                Description = existingLimit.Description,
                LastModifiedAt = existingLimit.LastModifiedAt,
                LastModifiedBy = existingLimit.LastModifiedBy
            };
        }

        public async Task<bool> DeleteApprovalLimitAsync(int id, int tenantId)
        {
            var limit = await _repository.GetByIdAsync(id, tenantId);
            if (limit == null)
            {
                throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
            }
            await _repository.DeleteApprovalLimitAsync(limit);
            return true;
        }

        // Helpmethod for validation
        //A limit with higher 
        private void ValidateLimitsOrder(IEnumerable<ApprovalLimit> existingLimits, decimal newMinAmount, int newRequiredApprovals, int? updatingId)
        {
            // 1. create a new list (exclude the unsaved)
            var limitsToCheck = existingLimits.Where(l => updatingId == null || l.Id != updatingId.Value).ToList();

            // 2. check if the amount already exists on another approvallimit
            if (limitsToCheck.Any(l => l.MinAmount == newMinAmount))
            {
                throw new InvalidOperationException($"Det finns redan en attestbeloppgräns för beloppet {newMinAmount}.");
            }

            // 3. Add the unsaved limit to the list and sort it by MinAmount rising
            limitsToCheck.Add(new ApprovalLimit
            {
                MinAmount = newMinAmount,
                RequiredApprovals = newRequiredApprovals
            });

            var sortedLimits = limitsToCheck.OrderBy(l => l.MinAmount).ToList();

            // 4. Control hierarcy: Higher amount MUST demand more requiredApprovals
            for (int i = 0; i < sortedLimits.Count - 1; i++)
            {
                var current = sortedLimits[i];
                var next = sortedLimits[i + 1];

                if (current.RequiredApprovals > next.RequiredApprovals)
                {
                    throw new InvalidOperationException(
                        $"Ogiltig hierarki: Beloppgränsen {current.MinAmount} kräver {current.RequiredApprovals} attestanter, " +
                        $"medan den högre gränsen {next.MinAmount} endast kräver {next.RequiredApprovals}. Högre belopp måste kräva fler attestanter.");
                }
            }
        }

    }
}