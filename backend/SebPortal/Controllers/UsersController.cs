using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Authorization;
using SebPortal.Api.Dtos;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Retrieves a list of all users (Admin only).
        /// </summary>
        /// <returns>A list of users.</returns>
        /// <response code="200">Returns the list of users.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="403">Forbidden if the user lacks the Admin role.</response>
        [HttpGet]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<IEnumerable<ReadUserDTO>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Retrieves a specific user by their ID.
        /// </summary>
        /// <param name="id">The ID of the user.</param>
        /// <returns>The user details.</returns>
        /// <response code="200">Returns the user details.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="404">The user was not found.</response>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ReadUserDTO>> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            return Ok(user);
        }

        /// <summary>
        /// Retrieves a specific user by their email address.
        /// </summary>
        /// <param name="email">The email query parameter.</param>
        /// <returns>The user details.</returns>
        /// <response code="200">Returns the user details.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="404">The user was not found.</response>
        [HttpGet("by-email")]
        public async Task<ActionResult<ReadUserDTO>> GetUserByEmail([FromQuery] string email)
        {
            var user = await _userService.GetUserByEmailAsync(email);
            return Ok(user);
        }

        /// <summary>
        /// Creates a new user (Admin only).
        /// </summary>
        /// <param name="dto">The user creation details.</param>
        /// <returns>The created user details.</returns>
        /// <response code="201">The user was successfully created.</response>
        /// <response code="400">Invalid input data.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="403">Forbidden if the user lacks the Admin role.</response>
        [HttpPost]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<ReadUserDTO>> CreateUser([FromBody] CreateUserDTO dto)
        {
            var createdUser = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
        }

        /// <summary>
        /// Updates an existing user (Admin only). Only the fields provided in the request body will be updated; other fields will remain unchanged.
        /// </summary>
        /// <param name="id">The ID of the user to update.</param>
        /// <param name="dto">The updated user details.</param>
        /// <returns>The updated user details.</returns>
        /// <response code="200">The user was successfully updated.</response>
        /// <response code="400">Invalid input data.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="403">Forbidden if the user lacks the Admin role.</response>
        /// <response code="404">The user was not found.</response>
        [HttpPatch("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<ActionResult<ReadUserDTO>> UpdateUser(int id, [FromBody] UpdateUserDTO dto)
        {
            var updatedUser = await _userService.UpdateUserAsync(id, dto);
            return Ok(updatedUser);
        }

        /// <summary>
        /// Deletes a user by their ID (Admin only).
        /// </summary>
        /// <param name="id">The ID of the user to delete.</param>
        /// <returns>No content if successful.</returns>
        /// <response code="204">The user was successfully deleted.</response>
        /// <response code="401">Unauthorized if the user is not authenticated.</response>
        /// <response code="403">Forbidden if the user lacks the Admin role.</response>
        /// <response code="404">The user was not found.</response>
        [HttpDelete("{id:int}")]
        [Authorize(Roles = UserRoles.Admin)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var result = await _userService.DeleteUserAsync(id);
            return NoContent();
        }
    }
}
