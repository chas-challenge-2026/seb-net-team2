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

        /// <summary>
        /// Retrieves details about the currently authenticated user based on JWT claims.
        /// </summary>
        /// <returns>User details including ID, name, email, role, and tenant ID.</returns>
        /// <response code="200">Returns the user details.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
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

        /// <summary>
        /// Authenticates a user with credentials and returns tokens and user info.
        /// </summary>
        /// <param name="dto">The login credentials (email and password).</param>
        /// <returns>Authentication tokens and user details.</returns>
        /// <response code="200">Successfully authenticated and returns tokens/user info.</response>
        /// <response code="400">Invalid login request data.</response>
        /// <response code="401">Unauthorized if credentials are incorrect.</response>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO dto)
        {
            // get user by email
            var response = await _userService.LoginAsync(dto);

            //return token and user info
            return Ok(response);
            
        }

        /// <summary>
        /// Logs out the user by revoking their refresh token.
        /// </summary>
        /// <param name="dto">The refresh token request data.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">The refresh token was successfully revoked.</response>
        /// <response code="401">Unauthorized if the refresh token is invalid.</response>
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

        /// <summary>
        /// Generates a new access token using a valid refresh token.
        /// </summary>
        /// <param name="dto">The refresh token request data.</param>
        /// <returns>New authentication tokens.</returns>
        /// <response code="200">Returns the new tokens.</response>
        /// <response code="401">Unauthorized if the refresh token is invalid or expired.</response>
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
