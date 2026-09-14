using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IAuditRepository
    {
        Task AddEntryAsync(AuditEntries entry);
    }
}
