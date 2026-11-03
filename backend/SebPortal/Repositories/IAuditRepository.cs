using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IAuditRepository
    {
        Task AddEntryAsync(AuditEntries entry);
        Task<List<AuditEntries>> GetPendingNativeEntriesAsync(int batchSize);
        Task<List<AuditEntries>> GetNativeWrittenEntriesAsync(int batchSize, int afterId = 0);
        Task MarkNativeWrittenAsync(int id, string nativeHash);
        Task<bool> HasEntriesForUserAsync(int userId, int tenantId);
        Task<(List<AuditEntries> Items, int TotalCount)> GetEntriesAsync(int tenantId, AuditQueryDTO query);
    }
}
