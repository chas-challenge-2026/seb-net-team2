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

    /// <summary>
    /// Retrieves all ordered approval limits for the current tenant.
    /// </summary>
    /// <returns>A list of approval limits.</returns>
    /// <response code="200">Returns the list of approval limits.</response>
    /// <response code="401">Unauthorized if the user is not authenticated.</response>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApprovalLimitResponseDTO>>> GetApprovalLimits()
    {
        var tenantId = GetUserTenantId();
        var response = await _approvalLimitService.GetOrderedLimitsAsync(tenantId);
        
        return Ok(response);
    }

    /// <summary>
    /// Creates a new approval limit for the tenant.
    /// </summary>
    /// <param name="dto">The approval limit details to create.</param>
    /// <returns>The created approval limit.</returns>
    /// <response code="201">The approval limit was successfully created.</response>
    /// <response code="400">Invalid input data or hierarchy rules violated.</response>
    /// <response code="401">Unauthorized if the user ID claim is missing.</response>
    [Authorize(Roles = UserRoles.Admin)]
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

    /// <summary>
    /// Updates an existing approval limit. Only the fields you provide in the request body will be updated; other fields will remain unchanged.
    /// </summary>
    /// <param name="id">The ID of the approval limit to update.</param>
    /// <param name="dto">The updated approval limit details.</param>
    /// <returns>The updated approval limit.</returns>
    /// <response code="200">The approval limit was successfully updated.</response>
    /// <response code="400">Invalid input data or hierarchy rules violated.</response>
    /// <response code="401">Unauthorized if the user ID claim is missing.</response>
    /// <response code="404">The approval limit was not found.</response>
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

    /// <summary>
    /// Deletes an approval limit by its ID.
    /// </summary>
    /// <param name="id">The ID of the approval limit to delete.</param>
    /// <returns>No content if successful.</returns>
    /// <response code="204">The approval limit was successfully deleted.</response>
    /// <response code="401">Unauthorized if the user ID claim is missing.</response>
    /// <response code="404">The approval limit was not found.</response>
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

        // Fallback/standard if missing in development (e.g., Tenant 1)
        return 1;
    }

    // Helpmethod to extract the current user's id from the JWT "UserId" claim, for audit logging.
    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst("UserId")?.Value;
        return int.TryParse(claim, out var userId) ? userId : null;
    }
}