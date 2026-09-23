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
