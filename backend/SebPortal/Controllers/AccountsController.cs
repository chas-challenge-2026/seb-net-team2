using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        /// <summary>
        /// Creates a new bank account for the current tenant. Requires Admin role.
        /// </summary>
        /// <param name="dto">The data transfer object containing account details.</param>
        /// <returns>The newly created account.</returns>
        /// <response code="201">Returns the created account.</response>
        /// <response code="400">If the request data is invalid.</response>
        /// <response code="401">If the tenant ID claim is missing or invalid.</response>
        /// <response code="403">If the user is not an administrator.</response>
        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<AccountResponseDTO>> CreateAccount([FromBody] CreateAccountDTO dto)
        {
            var tenantClaim = User.FindFirst("TenantId")?.Value;
            if (!int.TryParse(tenantClaim, out var tenantId))
                return Unauthorized("TenantId saknas i token.");

            var newAccount = await _accountService.CreateAccountAsync(dto, tenantId);
            return CreatedAtAction(nameof(GetAccountById), new { id = newAccount.Id }, newAccount);
        }

        /// <summary>
        /// Updates an existing account's name by its unique identifier. Requires Admin role.
        /// </summary>
        /// <param name="id">The ID of the account to update.</param>
        /// <param name="dto">The data transfer object containing the updated account name.</param>
        /// <returns>The updated account.</returns>
        /// <response code="200">Returns the updated account.</response>
        /// <response code="400">If the request data is invalid.</response>
        /// <response code="401">If the tenant ID claim is missing or invalid.</response>
        /// <response code="403">If the user is not an administrator.</response>
        /// <response code="404">If the account was not found.</response>
        [HttpPut("{id}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<AccountResponseDTO>> UpdateAccount(int id, [FromBody] UpdateAccountDTO dto)
        {
            var tenantClaim = User.FindFirst("TenantId")?.Value;
            if (!int.TryParse(tenantClaim, out var tenantId))
                return Unauthorized("TenantId saknas i token.");

            var updatedAccount = await _accountService.UpdateAccountAsync(id, tenantId, dto);
            if(updatedAccount == null)
            {
                return NotFound("Kontot hittades inte eller tillhör inte din tenant.");
            }
            return Ok(updatedAccount);
        }

        /// <summary>
        /// Retrieves a specific account by its unique identifier.
        /// </summary>
        /// <param name="id">The ID of the account to retrieve.</param>
        /// <returns>The requested account details.</returns>
        /// <response code="200">Returns the account.</response>
        /// <response code="401">If the tenant ID claim is missing or invalid.</response>
        /// <response code="404">If the account was not found.</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAccountById(int id)
        {
            var tenantClaim = User.FindFirst("TenantId")?.Value;
            if (!int.TryParse(tenantClaim, out var tenantId))
                return Unauthorized("TenantId saknas i token.");

            var account = await _accountService.GetAccountByIdAsync(id, tenantId);
            if (account == null)
            {
                return NotFound("Kontot hittades inte");
            }
            return Ok(account);
        }

        /// <summary>
        /// Retrieves all accounts associated with the current user's tenant.
        /// </summary>
        /// <returns>A list of accounts for the tenant.</returns>
        /// <response code="200">Returns the list of accounts.</response>
        /// <response code="401">Unauthorized if the tenant ID claim is missing or invalid.</response>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountResponseDTO>>> GetAccountsByTenantId()
        {
            var tenantClaim = User.FindFirst("TenantId")?.Value;
            if (!int.TryParse(tenantClaim, out var tenantId))
                return Unauthorized("TenantId saknas i token.");

            var accounts = await _accountService.GetAccountsByTenantIdAsync(tenantId);
            return Ok(accounts);
        }
    }
}