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
        private readonly Mock<INotificationRepository> _repositoryMock;
        private readonly Mock<ILogger<NotificationService>> _loggerMock;
        private readonly Mock<IEmailSender> _emailSenderMock;
        private readonly NotificationService _notificationService;

        public NotificationServiceTests()
        {
            _repositoryMock = new Mock<INotificationRepository>();
            _loggerMock = new Mock<ILogger<NotificationService>>();
            _emailSenderMock = new Mock<IEmailSender>();
            _notificationService = new NotificationService(
                _repositoryMock.Object,
                _loggerMock.Object,
                _emailSenderMock.Object
             );
        }

        [Fact]
        public async Task SendNotificationMessageAsync_ShouldLogToRepository_WhenEmailFailsPermanently()
        {
            //arrange
            var dto = new NotificationMessageDTO
            {
                TenantId = 1,
                RecipientEmail = "test@example.se",
                Subject = "Attest krävs",
                Message = "Du har ett ärende att attestera."
            };

            _emailSenderMock
                .Setup(s => s.SendMailAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("SMTP Connection failed"));

            //act
            await _notificationService.SendNotificationMessageAsync(dto);

            //Assert
            _repositoryMock.Verify(
                r => r.LogFailedNotificationAsync(It.Is<NotificationLog>(log =>
                log.RecipientEmail == dto.RecipientEmail && 
                log.TenantId == dto.TenantId &&
                log.AttemptNumber == 3 &&
                log.ErrorMessage == "SMTP Connection failed"
                )),
                Times.Once
             );
        }

        [Fact]
        public async Task SendNotificationMessageAsync_ShouldSendEmail_NotLogToDatabase()
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
            _repositoryMock.Verify(
                r => r.LogFailedNotificationAsync(It.IsAny<NotificationLog>()),
                Times.Never
             );
        }
    }
}
