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

        public async Task<ApprovalStep?> GetApprovalStepByIdAsync(int id, int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .FirstOrDefaultAsync(s => s.Id == id && s.Payment.TenantId == tenantId);
        }

        public async Task<IEnumerable<ApprovalStep>> GetApprovalStepsByPaymentIdAsync(int paymentId, int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Where(s => s.PaymentId == paymentId && s.Payment.TenantId == tenantId)
                .OrderBy(s => s.StepNumber)
                .ToListAsync();
        }

        public Task<ApprovalStep?> GetByPublicIdAsync(Guid publicId, int tenantId)
        {
            return _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .FirstOrDefaultAsync(s => s.PublicId == publicId && s.Payment.TenantId == tenantId);
        }

        public async Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int paymentId, int attestantId, int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Where(s => s.PaymentId == paymentId && s.AttestantId == attestantId && s.Status == "pending" && s.Payment.Status == "pending_approval" && s.Payment.TenantId == tenantId)
                .OrderBy(s => s.StepNumber)
                .ToListAsync();
        }

        public async Task<IEnumerable<ApprovalStep>> GetPendingStepsForAttestantAsync(int attestantId, int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .Where(s => s.AttestantId == attestantId && s.Status == "pending" && s.Payment.Status == "pending_approval" && s.Payment.TenantId == tenantId)
                .OrderBy(s => s.Payment.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ApprovalStep>> GetPendingStepsForTenantAsync(int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .Where(s => s.Payment.TenantId == tenantId && s.Status == "pending" && s.Payment.Status == "pending_approval")
                .OrderBy(s => s.Payment.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ApprovalStep>> GetRecentApprovalsForTenantAsync(int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .Where(s => s.Payment.TenantId == tenantId && s.Status == "completed" && s.Payment.Status == "completed")
                .OrderByDescending(s => s.DecidedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task<IEnumerable<ApprovalStep>> GetApprovalHistoryForAttestantAsync(int attestantId, int tenantId)
        {
            return await _dbContext.ApprovalSteps
                .Include(s => s.Payment)
                    .ThenInclude(p => p.CreatedByUser)
                .Where(s => s.AttestantId == attestantId && s.Payment.TenantId == tenantId && s.Status != "pending")
                .OrderByDescending(s => s.DecidedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task<bool> UpdateApprovalStepAsync(ApprovalStep approvalStep, int tenantId)
        {
            // Use ExecuteUpdateAsync to update the approval step directly in the database
            var rowsAffected = await _dbContext.ApprovalSteps
                .Where(s => s.Id == approvalStep.Id && s.Status == "pending" && s.Payment.TenantId == tenantId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Status, approvalStep.Status)
                    .SetProperty(s => s.DecidedAt, approvalStep.DecidedAt)
                    .SetProperty(s => s.Comment, approvalStep.Comment));

            return rowsAffected == 1;
        }

    }
}
