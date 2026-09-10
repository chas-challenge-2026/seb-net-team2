using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;
using System;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles ="admin, Admin")]
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
        var createdLimit = await _approvalLimitService.CreateApprovalLimitAsync(tenantId, dto);
        return CreatedAtAction(nameof(GetApprovalLimits), new { id = createdLimit.Id }, createdLimit);
    }

    [HttpPatch("{id:int}")]
    public async Task<ActionResult<ApprovalLimitResponseDTO>> UpdateApprovalLimit(int tenantId, int id, [FromBody] UpdateApprovalLimitDTO dto)
    {
        var updatedLimit = await _approvalLimitService.UpdateApprovalLimitAsync(tenantId, id, dto);
        return Ok(updatedLimit);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteApprovalLimit(int tenantId, int id)
    {
        var result = await _approvalLimitService.DeleteApprovalLimitAsync(tenantId, id);
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
}