using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "attestant, admin")]
    public class ApprovalController : ControllerBase
    {
        private readonly IApprovalService _approvalService;

        public ApprovalController(IApprovalService approvalService)
        {
            _approvalService = approvalService;
        }

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

        [HttpGet("payment/{paymentId}/steps")]
        public async Task<IActionResult> GetApprovalStepsForPayment(int paymentId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var steps = await _approvalService.GetPendingStepsForAttestantAsync(paymentId, userId.Value);
            return Ok(steps);
        }
    }
}
