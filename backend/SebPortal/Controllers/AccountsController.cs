using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    public class AccountsController : ControllerBase
    {
        private readonly AccountService _accountService;

        public AccountsController(AccountService accountService)
        {
            _accountService = accountService;
        }

        /// <summary>
        /// Retrieves all accounts associated with the current user's tenant.
        /// </summary>
        /// <returns>A list of accounts for the tenant.</returns>
        /// <response code="200">Returns the list of accounts.</response>
        /// <response code="401">Unauthorized if the tenant ID claim is missing or invalid.</response>
        [HttpGet]
        public async Task<IActionResult> GetAccounts()
        {
            var tenantClaim = User.FindFirst("TenantId")?.Value;
            if (!int.TryParse(tenantClaim, out var tenantId))
                return Unauthorized("TenantId saknas i token.");

            var accounts = await _accountService.GetAccountsByTenantIdAsync(tenantId);
            return Ok(accounts);
        }
    }
}
