using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;


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

        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDTO dto)
        {
            int userId = 1;

            var payment = await _createPaymentService.CreatePaymentAsync(dto, userId);
            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, payment);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPaymentById(int id)
        {
            var payment = await _createPaymentService.GetPaymentById(id);
            if (payment == null)
            {
                return NotFound();
            }
            return Ok(payment);
        }
    }
}
