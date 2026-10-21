using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IAuditService
    {
        Task<PagedResult<AuditEntryDTO>> GetEntriesAsync(int tenantId, AuditQueryDTO query);
    }
}
