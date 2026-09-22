using Microsoft.Extensions.Logging;
using Moq;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace SebPortal.Tests
{
    public class NotificationServiceTests
    {
        private readonly Mock<INotificationQueue> _queueMock;
        private readonly Mock<ILogger<NotificationService>> _loggerMock;
        private readonly NotificationService _notificationService;

        public NotificationServiceTests()
        {
            _queueMock = new Mock<INotificationQueue>();
            _loggerMock = new Mock<ILogger<NotificationService>>();
            _notificationService = new NotificationService(
                _queueMock.Object,
                _loggerMock.Object
             );
        }

        [Fact]
        public async Task SendNotificationMessageAsync_ShouldEnqueueMessageAsync()
        {
            //arrange
            var dto = new NotificationMessageDTO
            {
                TenantId = 1,
                RecipientEmail = "test@example.se",
                Subject = "Attest krävs",
                Message = "Du har ett ärende att attestera."
            };

            //act
            await _notificationService.SendNotificationMessageAsync(dto);

            //Assert
            _queueMock.Verify(
                q => q.EnqueueNotificationAsync(It.Is<NotificationMessageDTO>(m =>
                m.RecipientEmail == dto.RecipientEmail)),
                Times.Once);
        }
    }
}
