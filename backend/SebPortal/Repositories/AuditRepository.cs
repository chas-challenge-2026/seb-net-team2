using Microsoft.EntityFrameworkCore;
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

        // True if the user has performed any audited action, which means they can't be deleted.
        public Task<bool> HasEntriesForUserAsync(int userId)
        {
            return _context.AuditEntries.AnyAsync(e => e.UserId == userId);
        }
    }
}
