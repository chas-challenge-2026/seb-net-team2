using System.Text.Json;
using SebPortal.Api.Dtos;
using SebPortal.Api.Middleware;
using SebPortal.Api.Repositories;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class AuditService : IAuditService
    {
        private const int MaxPageSize = 200;
        private readonly IAuditRepository _auditRepository;

        public AuditService(IAuditRepository auditRepository)
        {
            _auditRepository = auditRepository;
        }

        public async Task<PagedResult<AuditEntryDTO>> GetEntriesAsync(int tenantId, AuditQueryDTO query)
        {
            if (tenantId <= 0)
                throw new BusinessRuleException("Ogiltigt tenant-id.");

            if (query.From.HasValue && query.To.HasValue && query.From.Value.Date > query.To.Value.Date)
                throw new BusinessRuleException("Från-datum kan inte vara senare än till-datum.");

            query.Page = Math.Max(query.Page, 1);
            query.PageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

            var (items, totalCount) = await _auditRepository.GetEntriesAsync(tenantId, query);

            return new PagedResult<AuditEntryDTO>
            {
                Items = items.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize
            };
        }

        private static AuditEntryDTO MapToDto(AuditEntries e)
        {
            return new AuditEntryDTO
            {
                Id = e.Id,
                TimeStamp = e.DateTime,
                UserId = e.UserId,
                UserName = e.User.Name,
                Action = e.Action,
                EntityType = e.EntityType,
                EntityId = e.EntityId,
                Description = e.Description,
                // Details is stored as a JSON string; parse it so the API returns an object, not an escaped string.
                Details = e.Details is null ? null : JsonDocument.Parse(e.Details).RootElement.Clone()
            };
        }
    }
}
