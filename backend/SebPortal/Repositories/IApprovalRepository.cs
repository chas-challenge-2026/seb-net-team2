using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IApprovalRepository
    {
        Task<ApprovalStep?> GetApprovalStepByIdAsync(int id);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId);
        Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep);
        Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId);
    }
}
