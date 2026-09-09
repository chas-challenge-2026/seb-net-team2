using SebPortal.Models;
using SebPortal.Data;

namespace SebPortal.Api.Repositories
{
    public class AuditRepository : IAuditRepository
    {
        private readonly SebDbContext _context;

        public AuditRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task AddEntryAsync(AuditEntries entry)
        {
            _context.AuditEntries.Add(entry);
            await _context.SaveChangesAsync();
        }
    }
}
