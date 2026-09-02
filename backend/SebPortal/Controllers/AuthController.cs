using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirst("UserId")?.Value;
            var role = User.FindFirst("Role")?.Value;
            var tenantId = User.FindFirst("TenantId")?.Value;

            return Ok(new
            {
                UserId = userId,
                Role = role,
                TenantId = tenantId
            });
        }
    }
}
