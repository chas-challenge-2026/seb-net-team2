using Microsoft.Extensions.Logging;
using Moq;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Models;
using Xunit;


namespace SebPortal.Tests
{
    public class NotificationProcessorTests
    {
        private readonly Mock<IEmailSender> _emailSenderMock;
        private readonly Mock<INotificationRepository> _repositoryMock;
        private readonly Mock<ILogger<NotificationProcessor>> _loggerMock;
        private readonly NotificationProcessor _processor;

        public NotificationProcessorTests()
        {
            _repositoryMock = new Mock<INotificationRepository>();
            _loggerMock = new Mock<ILogger<NotificationProcessor>>();
            _emailSenderMock = new Mock<IEmailSender>();
            _processor = new NotificationProcessor(
                _emailSenderMock.Object,
                _repositoryMock.Object,
                _loggerMock.Object
             );
        }

        [Fact]
        public async Task ProcessNotificationAsync_ShouldRetryAndLogToRepository_WhenEmailFailsPermanently()
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
                .Setup(s => s.SendMailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("SMTP Connection failed"));

            //act
            await _processor.ProcessNotificationAsync(dto, CancellationToken.None);

            //Assert
            //verify 3 attempts
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
        public async Task ProcessNotificationAsync_ShouldSendEmail_NotLogToDatabase()
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
            await _processor.ProcessNotificationAsync(dto, CancellationToken.None);

            //Assert
            _repositoryMock.Verify(
                r => r.LogFailedNotificationAsync(It.IsAny<NotificationLog>()),
                Times.Never
             );
        }
    }
}
