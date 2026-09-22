using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Retry;
using SebPortal.Api.Repositories;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly INotificationQueue _queue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationBackgroundService> _logger;

        public NotificationBackgroundService(
            INotificationQueue queue,
            IServiceScopeFactory scopeFactory,
            ILogger<NotificationBackgroundService> logger)
        {
            _queue = queue;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("NotificationBackgroundService startar.");

            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var dto = await _queue.ReadAsync(cancellationToken);

                    //create DI scope (Backgroundservice is Singleton, DbContext is Scoped)
                    using var scope = _scopeFactory.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<INotificationProcessor>();

                    await processor.ProcessNotificationAsync(dto, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    // At exit
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ett fel uppstod vid inläsning av notifieringskön.");
                }
            }
        }
    }
}
