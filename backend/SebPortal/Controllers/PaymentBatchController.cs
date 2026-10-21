using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Filters;
using SebPortal.Api.Services;
using SebPortal.Models;
using SebPortal.Csv;
using System.Text.Json;


namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentBatchController : ControllerBase
    {
        //private readonly ICreatePaymentService _createPaymentService;

        public PaymentBatchController()
        {
            //_createPaymentService = createPaymentService;
        }

        /// <summary>
        /// Parses payments into JSON.
        /// </summary>
        /// <returns>JSON of the parsed CSV</returns>
        /// <response code="400">File missing, empty, too short, or not a valid CSV.</response>
        [HttpPost]
        [Authorize]
        [RequestSizeLimit(1_048_576)]
        public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file selected.");

            using var buffer = new MemoryStream();
            await file.CopyToAsync(buffer, ct);

            List<NativeCsv.CSVPayment> rows;
            try
            {
                rows = NativeCsv.Parse(buffer.ToArray());
            }
            catch (InvalidDataException ex)
            {
                return BadRequest(ex.Message);
            }

            return Content(JsonSerializer.Serialize(rows), "application/json");
        }

    }
}
