using SebPortal.Models;
using SebPortal.Api.Dtos;


namespace SebPortal.Api.Services
{
    public interface IApprovalLimitService
    {
        Task<IEnumerable<ApprovalLimitResponseDTO>> GetOrderedLimitsAsync(int tenantId);
        Task<ApprovalLimitResponseDTO?> GetByIdAsync(int id, int tenantId);
        Task<ApprovalLimitResponseDTO> CreateApprovalLimitAsync(int tenantId, CreateApprovalLimitDTO dto);
        Task<ApprovalLimitResponseDTO> UpdateApprovalLimitAsync(int tenantId, int id, UpdateApprovalLimitDTO dto);
        Task<bool> DeleteApprovalLimitAsync(int tenantId, int id);
    }
}
