using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Audit;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class AuditNativeBackgroundServiceTests
    {
        [Fact]
        public async Task ExecuteAsync_ExistingNativeEntry_RestoresDatabaseHash()
        {
            var logPath = Path.Combine(
                Path.GetTempPath(),
                $"audit-service-{Guid.NewGuid():N}.log");

            const string key = "isolated-test-secret";
            const int databaseId = 123;

            var entry = new AuditEntries
            {
                Id = databaseId,
                TenantId = 1,
                UserId = 7,
                Action = "CREATE_PAYMENT",
                EntityType = "payment",
                EntityId = 456,
                Description = "Test payment"
            };

            var initResult = NativeAudit.Initialize(
                logPath,
                key,
                entry.UserId,
                entry.Action,
                entry.EntityId,
                $"dbId={databaseId};entity=payment;entityId=456;Test payment");

            Assert.Equal(0, initResult);

            var repository = new Mock<IAuditRepository>();
            var firstFetch = true;

            repository
                .Setup(r => r.GetPendingNativeEntriesAsync(20))
                .Returns(() =>
                {
                    if (!firstFetch)
                    {
                        return Task.FromResult(new List<AuditEntries>());
                    }

                    firstFetch = false;
                    return Task.FromResult(new List<AuditEntries> { entry });
                });

            repository
                .Setup(r => r.GetNativeWrittenEntriesAsync(1000, 0))
                .ReturnsAsync(new List<AuditEntries>());

            var marked = new TaskCompletionSource<(int Id, string Hash)>(
                TaskCreationOptions.RunContinuationsAsynchronously);

            repository
                .Setup(r => r.MarkNativeWrittenAsync(
                    databaseId,
                    It.IsAny<string>()))
                .Callback<int, string>((id, hash) =>
                    marked.TrySetResult((id, hash)))
                .Returns(Task.CompletedTask);

            var services = new ServiceCollection();
            services.AddSingleton<IAuditRepository>(repository.Object);

            using var provider = services.BuildServiceProvider();

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Audit:LogPath"] = logPath,
                    ["Audit:SigningKey"] = key
                })
                .Build();

            var service = new AuditNativeBackgroundService(
                provider.GetRequiredService<IServiceScopeFactory>(),
                Mock.Of<ILogger<AuditNativeBackgroundService>>(),
                configuration);

            try
            {
                await service.StartAsync(CancellationToken.None);

                var result = await marked.Task.WaitAsync(
                    TimeSpan.FromSeconds(5));

                Assert.Equal(databaseId, result.Id);

                var hashes = NativeAudit.ReadDatabaseHashes(logPath);

                Assert.True(hashes.ContainsKey(databaseId));
                Assert.Equal(hashes[databaseId], result.Hash);
                Assert.Equal(-1, NativeAudit.Verify(logPath, key));

                repository.Verify(
                    r => r.MarkNativeWrittenAsync(
                        databaseId,
                        It.IsAny<string>()),
                    Times.Once);

                repository.Verify(
                    r => r.GetPendingNativeEntriesAsync(20),
                    Times.Once);
            }
            finally
            {
                await service.StopAsync(CancellationToken.None);

                if (File.Exists(logPath))
                {
                    File.Delete(logPath);
                }
            }
        }



        [Fact]
        public async Task ExecuteAsync_PendingEntry_AppendsAndStoresHash()
        {
            var logPath = Path.Combine(
                Path.GetTempPath(),
                $"audit-service-append-{Guid.NewGuid():N}.log");

            const string key = "isolated-test-secret";
            const int databaseId = 124;

            var entry = new AuditEntries
            {
                Id = databaseId,
                TenantId = 1,
                UserId = 7,
                Action = "CREATE_PAYMENT",
                EntityType = "payment",
                EntityId = 457,
                Description = "Test new payment"
            };

            try
            {
                var initResult = NativeAudit.Initialize(
                    logPath,
                    key,
                    entry.UserId,
                    "TEST_CHAIN_START",
                    999,
                    "Isolated test chain start");

                Assert.Equal(0, initResult);
                var initialLineCount = File.ReadAllLines(logPath).Length;

                var repository = new Mock<IAuditRepository>();
                var firstFetch = true;

                repository
                    .Setup(r => r.GetPendingNativeEntriesAsync(20))
                    .Returns(() =>
                    {
                        if (!firstFetch)
                            return Task.FromResult(new List<AuditEntries>());

                        firstFetch = false;
                        return Task.FromResult(new List<AuditEntries> { entry });
                    });

                repository
                    .Setup(r => r.GetNativeWrittenEntriesAsync(1000, 0))
                    .ReturnsAsync(new List<AuditEntries>());

                var marked = new TaskCompletionSource<(int Id, string Hash)>(
                    TaskCreationOptions.RunContinuationsAsynchronously);

                repository
                    .Setup(r => r.MarkNativeWrittenAsync(
                        databaseId,
                        It.IsAny<string>()))
                    .Callback<int, string>((id, hash) =>
                        marked.TrySetResult((id, hash)))
                    .Returns(Task.CompletedTask);

                var services = new ServiceCollection();
                services.AddSingleton<IAuditRepository>(repository.Object);

                using var provider = services.BuildServiceProvider();

                var configuration = new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Audit:LogPath"] = logPath,
                        ["Audit:SigningKey"] = key
                    })
                    .Build();

                var service = new AuditNativeBackgroundService(
                    provider.GetRequiredService<IServiceScopeFactory>(),
                    Mock.Of<ILogger<AuditNativeBackgroundService>>(),
                    configuration);

                try
                {
                    await service.StartAsync(CancellationToken.None);

                    var result = await marked.Task.WaitAsync(
                        TimeSpan.FromSeconds(5));

                    Assert.Equal(databaseId, result.Id);
                    Assert.Equal(64, result.Hash.Length);

                    var hashes = NativeAudit.ReadDatabaseHashes(logPath);
                    Assert.True(hashes.ContainsKey(databaseId));
                    Assert.Equal(result.Hash, hashes[databaseId]);

                    Assert.Equal(
                        initialLineCount + 1,
                        File.ReadAllLines(logPath).Length);

                    Assert.Equal(-1, NativeAudit.Verify(logPath, key));

                    repository.Verify(
                        r => r.MarkNativeWrittenAsync(
                            databaseId,
                            It.IsAny<string>()),
                        Times.Once);
                }
                finally
                {
                    await service.StopAsync(CancellationToken.None);
                }
            }
            finally
            {
                if (File.Exists(logPath))
                    File.Delete(logPath);
            }
        }



        [Fact]
        public async Task ExecuteAsync_TransientRepositoryError_RetriesAndAppends()
        {
            var logPath = Path.Combine(
                Path.GetTempPath(),
                $"audit-service-retry-{Guid.NewGuid():N}.log");

            const string key = "isolated-test-secret";
            const int databaseId = 125;

            var entry = new AuditEntries
            {
                Id = databaseId,
                TenantId = 1,
                UserId = 7,
                Action = "CREATE_PAYMENT",
                EntityType = "payment",
                EntityId = 458,
                Description = "Test retry payment"
            };

            try
            {
                Assert.Equal(
                    0,
                    NativeAudit.Initialize(
                        logPath, key, 7, "TEST_CHAIN_START",
                        999, "Isolated test chain start"));

                var repository = new Mock<IAuditRepository>();

                repository
                    .SetupSequence(r => r.GetPendingNativeEntriesAsync(20))
                    .ThrowsAsync(new InvalidOperationException(
                        "Simulerat tillfälligt repository-fel"))
                    .ReturnsAsync(new List<AuditEntries> { entry })
                    .ReturnsAsync(new List<AuditEntries>());

                repository
                    .Setup(r => r.GetNativeWrittenEntriesAsync(1000, 0))
                    .ReturnsAsync(new List<AuditEntries>());

                var marked = new TaskCompletionSource<(int Id, string Hash)>(
                    TaskCreationOptions.RunContinuationsAsynchronously);

                repository
                    .Setup(r => r.MarkNativeWrittenAsync(
                        databaseId, It.IsAny<string>()))
                    .Callback<int, string>((id, hash) =>
                        marked.TrySetResult((id, hash)))
                    .Returns(Task.CompletedTask);

                var services = new ServiceCollection();
                services.AddSingleton<IAuditRepository>(repository.Object);

                using var provider = services.BuildServiceProvider();

                var configuration = new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Audit:LogPath"] = logPath,
                        ["Audit:SigningKey"] = key
                    })
                    .Build();

                var service = new AuditNativeBackgroundService(
                    provider.GetRequiredService<IServiceScopeFactory>(),
                    Mock.Of<ILogger<AuditNativeBackgroundService>>(),
                    configuration);

                try
                {
                    await service.StartAsync(CancellationToken.None);

                    var result = await marked.Task.WaitAsync(
                        TimeSpan.FromSeconds(10));

                    Assert.Equal(databaseId, result.Id);
                    Assert.Equal(64, result.Hash.Length);

                    var hashes = NativeAudit.ReadDatabaseHashes(logPath);
                    Assert.True(hashes.ContainsKey(databaseId));
                    Assert.Equal(result.Hash, hashes[databaseId]);
                    Assert.Equal(-1, NativeAudit.Verify(logPath, key));

                    repository.Verify(
                        r => r.GetPendingNativeEntriesAsync(20),
                        Times.AtLeast(2));

                    repository.Verify(
                        r => r.MarkNativeWrittenAsync(
                            databaseId, It.IsAny<string>()),
                        Times.Once);
                }
                finally
                {
                    await service.StopAsync(CancellationToken.None);
                }
            }
            finally
            {
                if (File.Exists(logPath))
                    File.Delete(logPath);
            }
        }
    }
}
