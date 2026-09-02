using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IApprovalRepository
    {
        Task<ApprovalStep> IsApprovalStepValid(Payment payment, ApprovalStep approvalStep, int currentUserId);
        Task<ApprovalStep> GetApprovalStepByIdAsync(int id);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId);
        Task<ApprovalStep> UpdateApprovalStepAsync(ApprovalStep approvalStep);
    }
}
