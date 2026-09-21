using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;
using SebPortal.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly IRefreshTokenService _refreshTokenService; 

        public AuthController(IUserService userService, IConfiguration configuration, IRefreshTokenService refreshTokenService)
        {
            _userService = userService;
            _configuration = configuration;
            _refreshTokenService = refreshTokenService;
        }

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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO dto)
        {
            // get user by email
            var response = await _userService.LoginAsync(dto);

            //return token and user info
            return Ok(response);
            
        }
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDTO dto)
        {
            var revoked = await _refreshTokenService.RevokeAsync(dto.RefreshToken);

            if (!revoked)
            {
                return Unauthorized();
            }

            return NoContent();
        }
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDTO dto)
        {
            var response = await _refreshTokenService.RefreshAsync(dto.RefreshToken);

            if (response == null)
            {
                return Unauthorized();
            }

            return Ok(response);
        }
    }
}
