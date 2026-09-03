using SebPortal.Models;
using SebPortal.Api.Repositories;

namespace SebPortal.Api.Services
{
    public class ApprovalService : IApprovalService
    {

        private readonly IApprovalRepository _approvalRepository;

        public ApprovalService(IApprovalRepository approvalRepository)
        {
            _approvalRepository = approvalRepository;
        }

        public bool IsApprovalStepValid(Payment payment, ApprovalStep approvalStep, int currentUserId)
        {
            if (approvalStep.PaymentId != payment.Id)
                return false;

            if (approvalStep.Status != "pending_approval")
                return false;

            if (approvalStep.Status != "pending" || approvalStep.DecidedAt != null)
                return false;

            if (payment.CreatedByUserId == currentUserId)
                return false;

            if (approvalStep.AttestantId != currentUserId)
                return false;

            return true;
        }

        public Task<ApprovalStep> GetApprovalStepByIdAsync(int id)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId)
        {
            throw new NotImplementedException();
        }


        public Task<ApprovalStep> UpdateApprovalStepAsync(ApprovalStep approvalStep)
        {
            throw new NotImplementedException();
        }
    }
}
