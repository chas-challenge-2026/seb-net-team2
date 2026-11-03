using System.IO;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using SebPortal.Api.Repositories;
using SebPortal.Audit;

namespace SebPortal.Api.Services
{
    public class AuditNativeBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuditNativeBackgroundService> _logger;
        private readonly string? _logPath;
        private readonly string? _secretKey;
        private readonly Dictionary<int, int> _retryAttempts = new();
        private readonly Dictionary<int, DateTime> _nextRetryAtUtc = new();
        private readonly HashSet<int> _reportedMissingNativeIds = new();

        public AuditNativeBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<AuditNativeBackgroundService> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _logPath = configuration["Audit:LogPath"];
            _secretKey = configuration["Audit:SigningKey"];
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (string.IsNullOrWhiteSpace(_logPath) ||
                string.IsNullOrWhiteSpace(_secretKey))
            {
                _logger.LogError("Audit Native är inte konfigurerad.");
                return;
            }

            if (!File.Exists(_logPath))
            {
                _logger.LogCritical(
                    "Native audit-logg saknas på {LogPath}. Automatisk behandling stoppas för att skydda audit-historiken.",
                    _logPath);
                return;
            }

            var verifyResult = NativeAudit.Verify(_logPath, _secretKey);

            if (verifyResult != -1)
            {
                _logger.LogCritical(
                    "Native audit-logg kunde inte verifieras. Resultat: {VerifyResult}. Automatisk behandling stoppas.",
                    verifyResult);
                return;
            }

            var nextVerificationUtc = DateTime.UtcNow.AddMinutes(1);
            var nextReconciliationUtc = DateTime.UtcNow;
            var consecutiveFailures = 0;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (DateTime.UtcNow >= nextVerificationUtc)
                    {
                        var currentVerifyResult = NativeAudit.Verify(_logPath, _secretKey);

                        if (currentVerifyResult != -1)
                        {
                            _logger.LogCritical(
                                "Native audit-logg kunde inte verifieras under pågående drift. Resultat: {VerifyResult}. Automatisk behandling stoppas.",
                                currentVerifyResult);

                            return;
                        }

                        nextVerificationUtc = DateTime.UtcNow.AddMinutes(1);
                    }

                    using var scope = _scopeFactory.CreateScope();
                    var repository = scope.ServiceProvider.GetRequiredService<IAuditRepository>();
                    var entries = await repository.GetPendingNativeEntriesAsync(20);

                    var logHashes = new Dictionary<int, string>();

                    if (new FileInfo(_logPath).Length > 0)
                    {
                        logHashes = NativeAudit.ReadDatabaseHashes(_logPath);

                        if (DateTime.UtcNow >= nextReconciliationUtc)
                        {
                            var afterId = 0;

                            while (true)
                            {
                                var writtenEntries =
                                    await repository.GetNativeWrittenEntriesAsync(1000, afterId);

                                if (writtenEntries.Count == 0)
                                    break;

                                foreach (var entry in writtenEntries)
                                {
                                    if (!logHashes.TryGetValue(entry.Id, out var logHash))
                                    {
                                        if (_reportedMissingNativeIds.Add(entry.Id))
                                        {
                                            _logger.LogWarning(
                                                "Audit-avvikelse: DB-post {AuditId} saknas i native-loggen.",
                                                entry.Id);
                                        }

                                        continue;
                                    }

                                    if (!string.Equals(
                                            entry.NativeHash,
                                            logHash,
                                            StringComparison.OrdinalIgnoreCase))
                                    {
                                        _logger.LogWarning(
                                            "Audit-avvikelse: hash stämmer inte för DB-post {AuditId}.",
                                            entry.Id);
                                    }
                                }

                                afterId = writtenEntries[writtenEntries.Count - 1].Id;

                                if (writtenEntries.Count < 1000)
                                    break;
                            }

                            nextReconciliationUtc = DateTime.UtcNow.AddMinutes(1);
                        }
                    }

                    foreach (var entry in entries)
                    {
                        stoppingToken.ThrowIfCancellationRequested();

                        if (logHashes.TryGetValue(entry.Id, out var existingHash))
                        {
                            await repository.MarkNativeWrittenAsync(entry.Id, existingHash);

                            _logger.LogInformation(
                                "Audit DB-post {AuditId} fanns redan i native-loggen. Databasens metadata uppdaterades.",
                                entry.Id);

                            continue;
                        }

                        if (_nextRetryAtUtc.TryGetValue(entry.Id, out var nextRetryAt) &&
                            DateTime.UtcNow < nextRetryAt)
                        {
                            continue;
                        }

                        var description =
                            $"dbId={entry.Id};entity={entry.EntityType};entityId={entry.EntityId};{entry.Description}";

                        var (result, hash) = NativeAudit.AppendWithHash(
                            _logPath,
                            _secretKey,
                            entry.UserId,
                            entry.Action,
                            entry.EntityId,
                            description);

                        if (result == 0 && !string.IsNullOrWhiteSpace(hash))
                        {
                            await repository.MarkNativeWrittenAsync(entry.Id, hash);

                            _retryAttempts.Remove(entry.Id);
                            _nextRetryAtUtc.Remove(entry.Id);
                        }
                        else
                        {
                            var attempts = _retryAttempts.TryGetValue(entry.Id, out var previousAttempts)
                                ? previousAttempts + 1
                                : 1;

                            _retryAttempts[entry.Id] = attempts;

                            var retryDelaySeconds = Math.Min(60, Math.Pow(2, attempts));

                            _nextRetryAtUtc[entry.Id] =
                                DateTime.UtcNow.AddSeconds(retryDelaySeconds);

                            _logger.LogError(
                                "Native audit misslyckades för DB-post {AuditId}. Resultat: {Result}. Försök {Attempt}; nytt försök om {RetryDelaySeconds} sekunder.",
                                entry.Id,
                                result,
                                attempts,
                                retryDelaySeconds);

                        }
                    }

                    consecutiveFailures = 0;

                    await Task.Delay(
                        entries.Count == 0 ? TimeSpan.FromSeconds(5) : TimeSpan.FromSeconds(1),
                        stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    if (stoppingToken.IsCancellationRequested)
                        break;

                    consecutiveFailures = Math.Min(consecutiveFailures + 1, 6);
                    var retrySeconds = Math.Min(60, 1 << consecutiveFailures);

                    _logger.LogError(
                        ex,
                        "Fel i AuditNativeBackgroundService. Nytt försök om {RetrySeconds} sekunder.",
                        retrySeconds);

                    try
                    {
                        await Task.Delay(
                            TimeSpan.FromSeconds(retrySeconds),
                            stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        break;
                    }
                }
            }
        }
    }
}
