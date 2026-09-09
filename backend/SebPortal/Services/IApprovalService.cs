using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IApprovalService
    {
        
        ApprovalStepValidationResult ValidateApprovalStep(Payment payment, ApprovalStep approvalStep, int currentUserId);
        Task<ApprovalStepValidationResult> DecideAsync(ApprovalDecisionDTO dto, int currentUserId);
        Task<ApprovalStep?> GetApprovalStepByIdAsync(int id);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId);
        Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep);
        Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId);
    }
}
