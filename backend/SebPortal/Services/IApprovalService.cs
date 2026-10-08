using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IApprovalService
    {
        
        ApprovalStepValidationResult ValidateApprovalStep(Payment payment, ApprovalStep approvalStep, int currentUserId, bool isAdmin);
        Task<ApprovalStepValidationResult> DecideAsync(ApprovalDecisionDTO dto, int currentUserId, bool isAdmin, int tenantId);
        Task<ApprovalStep?> GetApprovalStepByIdAsync(int id, int tenantId);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId, int tenantId);
        Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep, int tenantId);
        Task<IEnumerable<PendingApprovalStepDTO>> GetPendingStepsForAttestantAsync(Guid paymentId, int attestantId, int tenantId);
        Task<IEnumerable<PendingApprovalStepDTO>> GetPendingStepsForAttestantAsync(int attestantId, int tenantId);
        Task<IEnumerable<PendingApprovalStepDTO>> GetPendingStepsForTenantAsync(int tenantId);
        Task<IEnumerable<RecentApprovalStepDTO>> GetRecentApprovalsForTenantAsync(int tenantId);
        Task<IEnumerable<RecentApprovalStepDTO>> GetApprovalHistoryForAttestantAsync(int attestantId, int tenantId);
    }
}
