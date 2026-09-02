namespace SebPortal.Api.Repositories
{
    public class ApprovalLimitRepository : IApprovalLimitRepository
    {
        private readonly SebDbContext  _context;

        public ApprovalLimitRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<List<ApprovalLimit>> GetOrderedLimitsAsync(int tenantId)
        {
            return await _context.ApprovalLimits
                .Where(limit => limit.TenantId == tenantId)
                .OrderBy(limit => limit.MinAmount)
                .ToListAsync();
        }

        public async Task AddAsync(ApprovalLimit approvalLimit)
        {
            await _context.ApprovalLimits.AddAsync(approvalLimit);
            await _context.SaveChangesAsync();
        }
    }
}
