using Polly;
using Polly.Retry;
using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class NotificationProcessor : INotificationProcessor
    {
        private readonly IEmailSender _emailSender;
        private readonly INotificationRepository _repository;
        private readonly ILogger<NotificationProcessor> _logger;

        public NotificationProcessor(
            IEmailSender emailSender,
            INotificationRepository repository,
            ILogger<NotificationProcessor> logger)
        {
            _emailSender = emailSender;
            _repository = repository;
            _logger = logger;
        }

       public async Task ProcessNotificationAsync(NotificationMessageDTO dto, CancellationToken cancellationToken)
        { 
            var pipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions
                {
                    MaxRetryAttempts = 2, // 3 attempts (1 initial + 2 retries)
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
                    await _emailSender.SendMailAsync(dto.RecipientEmail, dto.Subject, dto.Message, token);
                }, cancellationToken);
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
