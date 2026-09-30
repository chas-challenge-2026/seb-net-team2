using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IAuditRepository
    {
        Task AddEntryAsync(AuditEntries entry);
        Task<bool> HasEntriesForUserAsync(int userId);
    }
}
