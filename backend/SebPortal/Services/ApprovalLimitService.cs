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


        public async Task<ApprovalLimitResponseDTO> CreateApprovalLimitAsync(int tenantId, CreateApprovalLimitDTO dto)
        {
            var limit = new ApprovalLimit
            {
                TenantId = tenantId,
                MinAmount = dto.MinAmount,
                RequiredApprovals = dto.RequiredApprovals,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                LastModifiedAt = DateTime.UtcNow
            };
            await _repository.CreateApprovalLimitAsync(limit);
            return new ApprovalLimitResponseDTO
            {
                Id = limit.Id,
                TenantId = tenantId,
                MinAmount = limit.MinAmount,
                RequiredApprovals = limit.RequiredApprovals,
                Description = limit.Description
            };
        }

        public async Task<ApprovalLimitResponseDTO> UpdateApprovalLimitAsync(int id, int tenantId, UpdateApprovalLimitDTO dto)
        {
            var existingLimit = await _repository.GetByIdAsync(id, tenantId);
            if (existingLimit == null)
            {
                throw new Exception($"Attestbeloppgräns med id: {id} hittades inte");
            }

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

    }
}

