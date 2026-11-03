
using System;
using System.IO;
using SebPortal.Audit;
using Xunit;

namespace SebPortal.Tests
{
    public class NativeAuditTests
    {
        [Fact]
        public void Verify_EmptyLog_ReturnsFailure()
        {
            var path = Path.Combine(
                Path.GetTempPath(),
                $"seb-audit-empty-{Guid.NewGuid():N}.log");

            try
            {
                using (File.Create(path))
                {
                }

                var result = NativeAudit.Verify(path, "test-secret");

                Assert.Equal(1, result);
            }
            finally
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                }
            }
        }
        [Fact]
        public void Initialize_AppendAndVerify_CreatesValidChain()
        {
            var path = Path.Combine(
                Path.GetTempPath(),
                $"seb-audit-chain-{Guid.NewGuid():N}.log");
            const string key = "test-secret";

            try
            {
                Assert.Equal(0, NativeAudit.Initialize(
                    path, key, 1, "TEST_CHAIN_START", 100, "Test initialization"));

                var (result, hash) = NativeAudit.AppendWithHash(
                    path, key, 2, "TEST_EVENT", 100, "Test append");

                Assert.Equal(0, result);
                Assert.False(string.IsNullOrWhiteSpace(hash));
                Assert.Equal(-1, NativeAudit.Verify(path, key));

                var lines = File.ReadAllLines(path);
                Assert.Equal(2, lines.Length);
                Assert.Contains("TEST_CHAIN_START", lines[0]);
                Assert.EndsWith(hash!, lines[1]);
            }
            finally
            {
                if (File.Exists(path))
                    File.Delete(path);
            }
        }

        [Fact]
        public void Initialize_ExistingFile_DoesNotOverwriteIt()
        {
            var path = Path.Combine(
                Path.GetTempPath(),
                $"seb-audit-existing-{Guid.NewGuid():N}.log");
            const string original = "existing content";

            try
            {
                File.WriteAllText(path, original);

                Assert.Equal(-1, NativeAudit.Initialize(
                    path, "test-secret", 1,
                    "TEST_CHAIN_START", 100, "Must not overwrite"));

                Assert.Equal(original, File.ReadAllText(path));
            }
            finally
            {
                if (File.Exists(path))
                    File.Delete(path);
            }
        }
        [Fact]
        public void ReadDatabaseHashes_ReturnsDbIdAndNativeHash()
        {
            var logPath = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                $"audit-hashes-{System.Guid.NewGuid():N}.log");

            const int databaseId = 123;
            var expectedHash = new string('a', 64);
            var previousHash = new string('0', 64);

            try
            {
                System.IO.File.WriteAllText(
                    logPath,
                    $"2026-10-21T00:00:00Z|7|CREATE_PAYMENT|123|dbId={databaseId};entity=payment|{previousHash}|{expectedHash}{System.Environment.NewLine}");

                var hashes = NativeAudit.ReadDatabaseHashes(logPath);

                Assert.Contains(databaseId, hashes.Keys);
                Assert.Equal(expectedHash, hashes[databaseId]);
            }
            finally
            {
                if (System.IO.File.Exists(logPath))
                    System.IO.File.Delete(logPath);
            }
        }
    }
}
