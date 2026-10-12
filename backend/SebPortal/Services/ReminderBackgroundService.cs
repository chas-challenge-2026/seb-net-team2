using Microsoft.Extensions.Options;
using SebPortal.Api.Models;

namespace SebPortal.Api.Services
{
    public class ReminderBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ReminderOptions _options;

        public ReminderBackgroundService(IServiceScopeFactory scopeFactory, IOptions<ReminderOptions> options)
        {
            _scopeFactory = scopeFactory;
            _options = options.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();

                var reminderService = scope.ServiceProvider.GetRequiredService<IReminderService>();

                await reminderService.ProcessRemindersAsync(stoppingToken);

                await Task.Delay(TimeSpan.FromMinutes(_options.CheckIntervalMinutes), stoppingToken);
            }
        }
    }
}