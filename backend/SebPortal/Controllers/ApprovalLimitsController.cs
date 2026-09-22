using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;
using System;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = UserRoles.Admin)]
public class ApprovalLimitsController: ControllerBase
{
    private readonly IApprovalLimitService _approvalLimitService;

    public ApprovalLimitsController(IApprovalLimitService approvalLimitService)
    {
        _approvalLimitService = approvalLimitService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApprovalLimitResponseDTO>>> GetApprovalLimits()
    {
        var tenantId = GetUserTenantId();
        var response = await _approvalLimitService.GetOrderedLimitsAsync(tenantId);
        
        return Ok(response);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ApprovalLimitResponseDTO>> CreateApprovalLimit([FromBody] CreateApprovalLimitDTO dto)
    {
        var tenantId = GetUserTenantId();
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized("Saknar giltigt UserId-claim i token.");

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "System"; // Get from token
        var createdLimit = await _approvalLimitService.CreateApprovalLimitAsync(tenantId, userId.Value, userEmail, dto);
        return CreatedAtAction(nameof(GetApprovalLimits), new { id = createdLimit.Id }, createdLimit);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ApprovalLimitResponseDTO>> UpdateApprovalLimit(int id, [FromBody] UpdateApprovalLimitDTO dto)
    {
        var tenantId = GetUserTenantId();
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized("Saknar giltigt UserId-claim i token.");

        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "System"; // Get from token
        var updatedLimit = await _approvalLimitService.UpdateApprovalLimitAsync(tenantId, id, userId.Value, userEmail, dto);
        return Ok(updatedLimit);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteApprovalLimit(int id)
    {
        var tenantId = GetUserTenantId();
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized("Saknar giltigt UserId-claim i token.");

        var result = await _approvalLimitService.DeleteApprovalLimitAsync(tenantId, id, userId.Value);
        return NoContent();
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

    // Helpmethod to extract the current user's id from the JWT "UserId" claim, for audit logging.
    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst("UserId")?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }
}