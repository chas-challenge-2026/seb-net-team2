using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public interface IApprovalService
    {
        bool IsApprovalStepValid(Payment payment, ApprovalStep approvalStep, int currentUserId);
        Task<ApprovalStep> GetApprovalStepByIdAsync(int id);
        Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId);
        Task<ApprovalStep> UpdateApprovalStepAsync(ApprovalStep approvalStep);
    }
}
