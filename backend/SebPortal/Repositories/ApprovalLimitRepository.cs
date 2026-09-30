using SebPortal.Models;
using SebPortal.Data;
using Microsoft.EntityFrameworkCore;

namespace SebPortal.Api.Repositories
{
    public class ApprovalLimitRepository : IApprovalLimitRepository
    {
        private readonly SebDbContext _context;

        public ApprovalLimitRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId)
        {
            return await _context.ApprovalLimits
                .Where(limit => limit.TenantId == tenantId)
                .OrderBy(limit => limit.MinAmount)
                .ToListAsync();
        }

        public async Task<ApprovalLimit?> GetByIdAsync(int id, int tenantId)
        {
            return await _context.ApprovalLimits
                .FirstOrDefaultAsync(limit => limit.Id == id && limit.TenantId == tenantId);
        }


        public async Task<ApprovalLimit> CreateApprovalLimitAsync(ApprovalLimit approvalLimit)
        {
            _context.ApprovalLimits.Add(approvalLimit);
            await _context.SaveChangesAsync();
            return approvalLimit;
        }

        public async Task<ApprovalLimit> UpdateApprovalLimitAsync(ApprovalLimit approvalLimit)
        {
            _context.ApprovalLimits.Update(approvalLimit);
            await _context.SaveChangesAsync();
            return approvalLimit;
        }

        public async Task<bool> DeleteApprovalLimitAsync(ApprovalLimit approvalLimit)
        {
            _context.ApprovalLimits.Remove(approvalLimit);
            await _context.SaveChangesAsync();
            return true;
        }
    }
    
}
