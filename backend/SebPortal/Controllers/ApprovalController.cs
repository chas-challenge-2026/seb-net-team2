using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = UserRoles.Attestant + "," + UserRoles.Admin)]
    public class ApprovalController : ControllerBase
    {
        private readonly IApprovalService _approvalService;

        public ApprovalController(IApprovalService approvalService)
        {
            _approvalService = approvalService;
        }

        /// <summary>
        /// Submits an approval or rejection decision for a payment step. 
        /// Valid values for the decision are "approved" or "rejected".
        /// </summary>
        /// <param name="dto">The decision details (stepId and decision as "approved" or "rejected").</param>
        /// <returns>Status of the decision process.</returns>
        /// <response code="200">The decision was successfully registered.</response>
        /// <response code="400">Invalid decision (must be "approved" or "rejected") or mismatched step and payment.</response>
        /// <response code="401">Unauthorized if the user ID claim is missing.</response>
        /// <response code="403">Forbidden if the user tries to approve their own payment or is not assigned.</response>
        /// <response code="404">The approval step was not found.</response>
        /// <response code="409">The payment is no longer pending or the step is already decided.</response>
        [HttpPost("decide")]
        public async Task<IActionResult> Decide([FromBody] ApprovalDecisionDTO dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var result = await _approvalService.DecideAsync(dto, userId.Value);

            return result switch
            {
                ApprovalStepValidationResult.Valid
                    => Ok(),
                ApprovalStepValidationResult.StepNotFound
                    => NotFound("Atteststeget hittades inte."),
                ApprovalStepValidationResult.InvalidDecision
                    => BadRequest("Decision måste vara 'approved' eller 'rejected'."),
                ApprovalStepValidationResult.StepDoesNotBelongToPayment
                    => BadRequest("Steget hör inte till angiven betalning."),
                ApprovalStepValidationResult.PaymentNotPendingApproval
                    => Conflict("Betalningen väntar inte längre på attest."),
                ApprovalStepValidationResult.StepAlreadyDecided
                    => Conflict("Det här atteststeget är redan beslutat."),
                ApprovalStepValidationResult.CannotApproveOwnPayment
                    => StatusCode(StatusCodes.Status403Forbidden, "Du kan inte attestera din egen betalning."),
                ApprovalStepValidationResult.NotAssignedAttestant
                    => StatusCode(StatusCodes.Status403Forbidden, "Du är inte tilldelad attestant för det här steget."),
                _
                    => StatusCode(StatusCodes.Status500InternalServerError, "Ett oväntat fel inträffade.")
            };
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        /// <summary>
        /// Retrieves the approval steps associated with a specific payment.
        /// </summary>
        /// <param name="paymentId">The ID of the payment.</param>
        /// <returns>A list of approval steps for the payment.</returns>
        /// <response code="200">Returns the approval steps.</response>
        /// <response code="401">Unauthorized if the user ID claim is missing.</response>
        [HttpGet("payment/{paymentId}/steps")]
        public async Task<IActionResult> GetApprovalStepsForPayment(int paymentId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var steps = await _approvalService.GetPendingStepsForAttestantAsync(paymentId, userId.Value);
            return Ok(steps);
        }

        /// <summary>
        /// Retrieves all pending approval steps assigned to the current attestant.
        /// </summary>
        /// <returns>A list of pending approval steps.</returns>
        /// <response code="200">Returns the pending steps.</response>
        /// <response code="401">Unauthorized if the user ID claim is missing.</response>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var steps = await _approvalService.GetPendingStepsForAttestantAsync(userId.Value);
            return Ok(steps);
        }
    }
}
