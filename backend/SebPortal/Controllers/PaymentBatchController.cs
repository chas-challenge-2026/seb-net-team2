using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Csv;
using SebPortal.Models;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentBatchController : ControllerBase
    {
        private readonly ICreatePaymentService _createPaymentService;
        private readonly IAccountRepository _accountRepository;

        public PaymentBatchController(ICreatePaymentService createPaymentService, IAccountRepository accountRepository)
        {
            _createPaymentService = createPaymentService;
            _accountRepository = accountRepository;
        }

        /// <summary>
        /// Parses a payment CSV and creates one payment per row.
        /// </summary>
        /// <returns>The created payments.</returns>
        /// <response code="400">File missing, empty, not a valid CSV, or a row could not be created.</response>
        [HttpPost]
        [Authorize(Roles = UserRoles.Initiator)]
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

            int userId = GetCurrentUserId();
            int tenantId = GetUserTenantId();

            // Resolve accounts before any write. A missing account returns 400 with nothing saved.
            var dtos = new List<CreatePaymentDTO>(rows.Count);
            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                var account = await _accountRepository.GetAccountByIdAsync(row.FromAccountId, tenantId);

                if (account == null)
                    return BadRequest($"Row {i + 1}, Account {row.FromAccountId} does NOT exist");

                dtos.Add(new CreatePaymentDTO
                {
                    FromAccountId = account.PublicId,
                    ToIban = row.ToIban,
                    Amount = row.Amount,
                    Currency = "SEK",
                    Reference = row.Reference,
                });
            }

            IReadOnlyList<Payment> payments;
            try
            {
                payments = await _createPaymentService.CreatePaymentsAsync(dtos, userId, tenantId);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                return BadRequest(ex.Message);
            }

            var created = new List<CreatePaymentResponseDTO>(payments.Count);
            for (int i = 0; i < payments.Count; i++)
            {
                var payment = payments[i];
                created.Add(new CreatePaymentResponseDTO
                {
                    Id = payment.PublicId,
                    FromAccountId = dtos[i].FromAccountId,
                    ToIban = payment.ToIban,
                    Amount = payment.Amount,
                    Currency = payment.Currency,
                    Reference = payment.Reference,
                    Status = payment.Status,
                    CreatedAt = payment.CreatedAt,
                });
            }

            return StatusCode(StatusCodes.Status200OK, created);
        }

        #region Helpers

        private int GetUserTenantId()
        {
            var tenantClaim = User.FindFirst("tenant_id")?.Value
                           ?? User.FindFirst("TenantId")?.Value;

            if (int.TryParse(tenantClaim, out int tenantId))
            {
                return tenantId;
            }

            throw new UnauthorizedAccessException("TenantId saknas eller är ogiltigt i token.");
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            if (int.TryParse(claim, out var userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Saknar giltigt UserId i token.");
        }

        #endregion
    }
}
