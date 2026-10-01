using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IAuditRepository
    {
        Task AddEntryAsync(AuditEntries entry);
        Task<bool> HasEntriesForUserAsync(int userId);
        Task<(List<AuditEntries> Items, int TotalCount)> GetEntriesAsync(int tenantId, AuditQueryDTO query);
    }
}
