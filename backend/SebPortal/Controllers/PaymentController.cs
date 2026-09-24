using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Filters;
using SebPortal.Api.Services;
using SebPortal.Models;


namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly ICreatePaymentService _createPaymentService;

        public PaymentController(ICreatePaymentService createPaymentService)
        {
            _createPaymentService = createPaymentService;
        }

        // gets current user id from the JWT token claims
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        /// <summary>
        /// Creates a new payment for the authenticated initiator.
        /// </summary>
        /// <param name="dto">The payment creation details.</param>
        /// <param name="idempotencyKey">The idempotency key header to prevent duplicate requests.</param>
        /// <returns>The created payment details.</returns>
        /// <response code="201">The payment was successfully created.</response>
        /// <response code="400">Invalid input data or insufficient balance.</response>
        /// <response code="401">Unauthorized if the user ID claim is missing.</response>
        [HttpPost]
        [Authorize(Roles = UserRoles.Initiator)]
        [ServiceFilter(typeof(IdempotencyFilter))]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDTO dto, [FromHeader(Name = "X-Idempotency-Key")] string idempotencyKey)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var payment = await _createPaymentService.CreatePaymentAsync(dto, userId.Value);
            var responseDTO = MapToResponseDto(payment);
            return CreatedAtAction(nameof(GetPaymentById), new { id = responseDTO.Id }, responseDTO);

        }

        /// <summary>
        /// Retrieves a specific payment by its ID.
        /// </summary>
        /// <param name="id">The ID of the payment.</param>
        /// <returns>The payment details.</returns>
        /// <response code="200">Returns the payment details.</response>
        /// <response code="404">The payment was not found.</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(int id)
        {
            var payment = await _createPaymentService.GetPaymentById(id);
            if (payment == null)
            {
                return NotFound();
            }
            return Ok(MapToResponseDto(payment));
        }

        /// <summary>
        /// Retrieves all payments created by the currently authenticated user.
        /// </summary>
        /// <returns>A list of the user's payments.</returns>
        /// <response code="200">Returns the list of payments.</response>
        /// <response code="401">Unauthorized if the user ID claim is missing.</response>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMyPayments()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Saknar giltigt UserId-claim i token.");

            var payments = await _createPaymentService.GetPaymentsByUserId(userId.Value);
            return Ok(payments.Select(MapToResponseDto));
        }

        private static CreatePaymentResponseDTO MapToResponseDto(Payment payment)
        {
            return new CreatePaymentResponseDTO
            {
                Id = payment.Id,
                FromAccountId = payment.FromAccountId,
                ToIban = payment.ToIban,
                Amount = payment.Amount,
                Currency = payment.Currency,
                Reference = payment.Reference,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt
            };
        }
    }
}
