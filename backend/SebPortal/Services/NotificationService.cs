using SebPortal.Api.Repositories;
using System.Net.Mail;
using SebPortal.Api.Dtos;
using Polly;
using Polly.Retry;
using Microsoft.Extensions.Logging;

namespace SebPortal.Api.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repository;
        private readonly ILogger<NotificationService> _logger;
        private readonly SmtpClient _smtpClient;

        public NotificationService(INotificationRepository repository, ILogger<NotificationService> logger, SmtpClient smtpClient )
        {
            _repository = repository;
            _logger = logger;
            _smtpClient = smtpClient;
        }

        public async Task SendNotificationMessageAsync(NotificationMessageDTO dto)
        {
            var pipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions
                {

                })
        }
    }
}
