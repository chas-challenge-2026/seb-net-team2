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

        private readonly ICurrentUserService _currentUserService;

        public AuthController(IUserService userService, IConfiguration configuration, IRefreshTokenService refreshTokenService, ICurrentUserService currentUserService)
        {
            _userService = userService;
            _configuration = configuration;
            _refreshTokenService = refreshTokenService;
            _currentUserService = currentUserService;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var currentUser = await _currentUserService.GetCurrentUserAsync(userId);

            if (currentUser == null)
                return NotFound();

            return Ok(currentUser);
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
