using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IApprovalRepository
    {
        Task<ApprovalStep?> GetApprovalStepByIdAsync(int id, int tenantId);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId, int tenantId);
        Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep, int tenantId);
        Task<ApprovalStep?> GetByPublicIdAsync(Guid publicId, int tenantId);
        Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId, int tenantId);
        Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int attestantId, int tenantId);
        Task<IEnumerable<ApprovalStep>> GetPendingStepsForTenantAsync(int tenantId);
    }
}
