using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SebPortal.Api.Services;

namespace SebPortal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly IInAppNotificationService _notificationService;

        public NotificationsController(IInAppNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserId")?.Value;
            return int.TryParse(claim, out var userId) ? userId : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized("Saknar giltigt UserId-claim i token.");
            }

            var notifications = await _notificationService.GetForUserAsync(
                userId.Value,
                cancellationToken);

            return Ok(notifications);
        }
        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized("Saknar giltigt UserId-claim i token.");
            }

            var success = await _notificationService.MarkAsReadAsync(
                id,
                userId.Value,
                cancellationToken);

            if (!success)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}