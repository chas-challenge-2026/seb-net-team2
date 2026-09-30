using Microsoft.EntityFrameworkCore;
using SebPortal.Models;
using SebPortal.Data;
using SebPortal.Api.Dtos;

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

        // Paging values are expected to be validated by the service layer.
        public async Task<(List<AuditEntries> Items, int TotalCount)> GetEntriesAsync(int tenantId, AuditQueryDTO query)
        {
            var q = _context.AuditEntries
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId);

            if (query.UserId.HasValue)
                q = q.Where(e => e.UserId == query.UserId.Value);

            if (!string.IsNullOrWhiteSpace(query.Action))
                q = q.Where(e => e.Action == query.Action);

            if (!string.IsNullOrWhiteSpace(query.EntityType))
                q = q.Where(e => e.EntityType == query.EntityType);

            if (query.EntityId.HasValue)
                q = q.Where(e => e.EntityId == query.EntityId.Value);


            if (query.From.HasValue)
            {
                var from = DateTime.SpecifyKind(query.From.Value.Date, DateTimeKind.Utc);
                q = q.Where(e => e.DateTime >= from);
            }

            // Inclusive end date: "to=2026-09-30" includes the whole of that day.
            if (query.To.HasValue)
            {
                var toExclusive = DateTime.SpecifyKind(query.To.Value.Date.AddDays(1), DateTimeKind.Utc);
                q = q.Where(e => e.DateTime < toExclusive);
            }

            var totalCount = await q.CountAsync();


            var items = await q
                .Include(e => e.User)
                .OrderByDescending(e => e.DateTime)
                .ThenByDescending(e => e.Id)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}
