using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = UserRoles.Admin)]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        /// <summary>
        /// Retrieves the audit log for the current tenant, newest first.
        /// </summary>
        /// <remarks>
        /// All filters are optional. `action` is one of the values in AuditActions (e.g. CREATE_PAYMENT, APPROVE_STEP,
        /// EXECUTE_PAYMENT). `entityType` is `payment`, `user` or `approvalLimit` (case-sensitive).
        /// `from` and `to` are inclusive dates (yyyy-MM-dd). `pageSize` is capped at 200.
        /// </remarks>
        /// <param name="query">Filters and paging.</param>
        /// <returns>A page of audit entries and the total number of matching entries.</returns>
        /// <response code="200">Returns the page of audit entries.</response>
        /// <response code="400">Invalid filter values, e.g. `from` later than `to`.</response>
        /// <response code="401">Unauthorized if the user is not authenticated or the tenant claim is missing.</response>
        /// <response code="403">Forbidden if the user is not an admin.</response>
        [HttpGet]
        public async Task<ActionResult<PagedResult<AuditEntryDTO>>> GetEntries([FromQuery] AuditQueryDTO query)
        {
            var tenantId = GetUserTenantId();

            var result = await _auditService.GetEntriesAsync(tenantId, query);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves the audit history for a single entity, e.g. all events for payment 4, newest first.
        /// </summary>
        /// <param name="entityType">`payment`, `user` or `approvalLimit` (case-sensitive).</param>
        /// <param name="entityId">The id of the entity.</param>
        /// <param name="page">Page number, starting at 1.</param>
        /// <param name="pageSize">Entries per page, capped at 200.</param>
        /// <returns>A page of audit entries for the entity.</returns>
        /// <response code="200">Returns the entity's audit history.</response>
        /// <response code="401">Unauthorized if the user is not authenticated or the tenant claim is missing.</response>
        /// <response code="403">Forbidden if the user is not an admin.</response>
        [HttpGet("{entityType}/{entityId:int}")]
        public async Task<ActionResult<PagedResult<AuditEntryDTO>>> GetEntityHistory(
            string entityType, int entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var tenantId = GetUserTenantId();

            var query = new AuditQueryDTO
            {
                EntityType = entityType,
                EntityId = entityId,
                Page = page,
                PageSize = pageSize
            };

            var result = await _auditService.GetEntriesAsync(tenantId, query);
            return Ok(result);
        }

        #region Helper Methods
        // Helpmethod to extract tenant ID from the user's claims. This is used to ensure that the approval limits are tenant-specific.
        private int GetUserTenantId()
        {
            var tenantClaim = User.FindFirst("tenant_id")?.Value
                           ?? User.FindFirst("TenantId")?.Value;

            if (int.TryParse(tenantClaim, out int tenantId))
            {
                return tenantId;
            }
            throw new UnauthorizedAccessException("TenantId saknas eller är ogiltigt i token.");
        }
        #endregion
    }
}
