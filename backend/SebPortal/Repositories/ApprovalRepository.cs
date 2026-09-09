using Microsoft.EntityFrameworkCore;
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

        public async Task<ApprovalStep?> GetApprovalStepByIdAsync(int id)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId)
        {
            return await _dbContext.ApprovalSteps
                .Where(s => s.PaymentId == paymentId)
                .OrderBy(s => s.StepNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId)
        {
            return await _dbContext.ApprovalSteps
                .Where(s => s.PaymentId == paymentId && s.AttestantId == attestantId && s.Status == "pending")
                .OrderBy(s => s.StepNumber)
                .ToListAsync();
        }

        public async Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep)
        {
            // Use ExecuteUpdateAsync to update the approval step directly in the database
            var rowsAffected = await _dbContext.ApprovalSteps
                .Where(s => s.Id == approvalStep.Id && s.Status == "pending")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Status, approvalStep.Status)
                    .SetProperty(s => s.DecidedAt, approvalStep.DecidedAt)
                    .SetProperty(s => s.Comment, approvalStep.Comment));

            return rowsAffected == 1;
        }

    }
}
