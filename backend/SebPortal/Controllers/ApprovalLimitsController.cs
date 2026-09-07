using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles ="admin, Admin")]
public class ApprovalLimitsController: ControllerBase
{
    private readonly IApprovalLimitRepository _approvalLimitRepository;
    public ApprovalLimitsController(IApprovalLimitRepository approvalLimitRepository)
    {
        _approvalLimitRepository = approvalLimitRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApprovalLimitResponseDTO>>> GetApprovalLimits()
    {
        var tenantId = GetUserTenantId();
        var limits = await _approvalLimitRepository.GetOrderedLimitsAsync(tenantId);
        var response = limits.Select(limit => new ApprovalLimitResponseDTO
        {
            Id = limit.Id,
            TenantId = limit.TenantId,
            MinAmount = limit.MinAmount,
            RequiredApprovals = limit.RequiredApprovals,
            Description = limit.Description,
            LastModifiedAt = limit.LastModifiedAt,
            LastModifiedBy = limit.LastModifiedBy
        });
        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<ApprovalLimitResponseDTO>> CreateLimit([FromBody] CreateApprovalLimitDTO dto)
    {
        int tenantId = GetUserTenantId();
        string userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "Admin";

        // Nivå 2: Sätt spårbarhetsdata automatiskt från inloggad användare
        var limit = new ApprovalLimit
        {
            TenantId = tenantId,
            MinAmount = dto.MinAmount,
            RequiredApprovals = dto.RequiredApprovals,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow,
            LastModifiedBy = userEmail
        };

        await _approvalLimitRepository.AddAsync(limit);

        var response = new ApprovalLimitResponseDTO
        {
            Id = limit.Id,
            TenantId = limit.TenantId,
            MinAmount = limit.MinAmount,
            RequiredApprovals = limit.RequiredApprovals,
            Description = limit.Description,
            LastModifiedAt = limit.LastModifiedAt,
            LastModifiedBy = limit.LastModifiedBy
        };

        return CreatedAtAction(nameof(GetApprovalLimits), new { id = limit.Id }, response);
    }

    // Helpmethod to extract tenant ID from the user's claims. This is used to ensure that the approval limits are tenant-specific.
    private int GetUserTenantId()
    {
        var tenantClaim = User.FindFirst("tenant_id")?.Value
                       ?? User.FindFirst("TenantId")?.Value;

        if (int.TryParse(tenantClaim, out int tenantId))
        {
            return tenantId;
        }

        // Fallback/standard om saknas i utveckling (t.ex. Tenant 1)
        return 1;
    }
}