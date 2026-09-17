using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;
using System.Data;
using System.Net.Mail;
using System.Security.Cryptography.X509Certificates;

namespace SebPortal.Api.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repository;
        private readonly ILogger<NotificationService> _logger;
        private readonly IEmailSender _emailSender;

        public NotificationService(INotificationRepository repository, ILogger<NotificationService> logger, IEmailSender emailSender)
        {
            _repository = repository;
            _logger = logger;
            _emailSender = emailSender;
        }

        public async Task SendNotificationMessageAsync(NotificationMessageDTO dto)
        {
            var pipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions
                {
                    MaxRetryAttempts = 2,
                    Delay = TimeSpan.FromSeconds(2),
                    BackoffType = DelayBackoffType.Exponential,
                    ShouldHandle = new PredicateBuilder().Handle<Exception>(),
                    OnRetry = args =>
                    {
                        _logger.LogWarning($"E-postutskick misslyckades. Försök {args.AttemptNumber}. Försöker igen...");
                        return ValueTask.CompletedTask;
                    }
                })
                .Build();

            int finalAttemptCount = 0;

            try
            {
                await pipeline.ExecuteAsync(async token =>
                {
                    finalAttemptCount++;
                    var mailMessage = new MailMessage("noreply@sebportal.se", dto.RecipientEmail, dto.Subject, dto.Message);
                    await _emailSender.SendMailAsync(mailMessage, token);
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"E-postutskicket misslyckades permanent efter 3 försök för mottagare {dto.RecipientEmail}");

                var errorLog = new NotificationLog
                {
                    TenantId = dto.TenantId,
                    RecipientEmail = dto.RecipientEmail,
                    Subject = dto.Subject,
                    Message = dto.Message,
                    AttemptNumber = finalAttemptCount,
                    TimeStamp = DateTime.UtcNow,
                    ErrorMessage = ex.Message
                };

                await _repository.LogFailedNotificationAsync(errorLog);
            }
        }
    }
}
