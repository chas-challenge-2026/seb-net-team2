using SebPortal.Models;
using SebPortal.Data;

namespace SebPortal.Api.Repositories
{
    public class ApprovalRepository : IApprovalRepository
    {
        private readonly SebDbContext _dbContext;

        public ApprovalRepository(SebDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApprovalStep> IsApprovalStepValid(Payment payment, ApprovalStep approvalStep, int currentUserId)
        {
            _dbContext.ApprovalSteps.Add(approvalStep);
            await _dbContext.SaveChangesAsync();
            return approvalStep;
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
