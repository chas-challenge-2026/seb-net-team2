using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Api.Filters;

namespace SebPortal.Api.Services
{
    public class ExpireDateCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExpireDateCleanupService> _logger;

        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

        public ExpireDateCleanupService(IServiceScopeFactory scopeFactory, ILogger<ExpireDateCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<SebDbContext>();
                    var now = DateTime.UtcNow;

                    // Delete expired refresh tokens
                    var deletedTokens = await context.RefreshTokens
                        .Where(x => x.ExpiresAt < now)
                        .ExecuteDeleteAsync(stoppingToken);

                    // Delete idempotency keys older than their lifetime
                    var idempotencyCutoff = now - IdempotencyFilter.IdempotencyKeyLifetime;

                    var deletedKeys = await context.IdempotencyKeys
                        .Where(x => x.CreatedAt < idempotencyCutoff)
                        .ExecuteDeleteAsync(stoppingToken);

                    _logger.LogInformation(
                        "Cleanup removed {Tokens} refresh tokens and {Keys} idempotency keys",
                        deletedTokens, deletedKeys);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Cleanup of expired data failed");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }
    }
}
