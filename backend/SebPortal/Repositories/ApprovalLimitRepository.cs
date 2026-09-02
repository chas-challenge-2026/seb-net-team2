namespace SebPortal.Api.Repositories
{
    public class ApprovalLimitRepository : IApprovalLimitRepository
    {
        private readonly SebDbContext  _context;

        public ApprovalLimitRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<List<ApprovalLimit>> GetOrderedLimitsAsync()
        {
            return await _context.ApprovalLimits
                .OrderBy(limit => limit.MinAmount)
                .ToListAsync();
        }
    }
}
