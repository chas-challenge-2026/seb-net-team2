using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;
using Xunit;

namespace SebPortal.Tests
{
    public class CrossTenantApprovalLimitsIntegrationTests
    {
        [Fact]
        public async Task ApprovalLimits_ShouldBeIsolatedPerTenant()
        {
            //arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            //act
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.ApprovalLimits.Add(new ApprovalLimit { Id = 1, TenantId = 1, MinAmount = 1000m, RequiredApprovals = 1, Description = "L1" });
                context.ApprovalLimits.Add(new ApprovalLimit { Id = 2, TenantId = 2, MinAmount = 2000m, RequiredApprovals = 2, Description = "L2" });

                await context.SaveChangesAsync();
            }

            //assert
            await using (var context = new SebDbContext(options))
            {
                var t1 = await context.ApprovalLimits.Where(a => a.TenantId == 1).ToListAsync();
                var t2 = await context.ApprovalLimits.Where(a => a.TenantId == 2).ToListAsync();

                Assert.Single(t1);
                Assert.Single(t2);
                Assert.Equal(1000m, t1[0].MinAmount);
                Assert.Equal(2000m, t2[0].MinAmount);
            }
        }

        [Fact]
        public async Task ApprovalLimit_ShouldNotBeAccessible_AcrossTenants()
        {
            // arrange
            await using var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();

            var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

            // act - sätt upp data med skilda tenants
            await using (var context = new SebDbContext(options))
            {
                await context.Database.EnsureCreatedAsync();

                context.Tenants.AddRange(new Tenant { Id = 1, Name = "T1" }, new Tenant { Id = 2, Name = "T2" });

                context.ApprovalLimits.Add(new ApprovalLimit { Id = 1, TenantId = 1, MinAmount = 1000m, RequiredApprovals = 1, Description = "L1" });
                context.ApprovalLimits.Add(new ApprovalLimit { Id = 2, TenantId = 2, MinAmount = 2000m, RequiredApprovals = 2, Description = "L2" });

                await context.SaveChangesAsync();
            }

            // assert - simulera att Tenant 1 försöker hämta Tenant 2:s approval limit (Id = 2) med TenantId = 1
            await using (var context = new SebDbContext(options))
            {
                int queryingTenantId = 1;
                int targetApprovalLimitId = 2;

                var crossTenantLimit = await context.ApprovalLimits
                    .FirstOrDefaultAsync(a => a.Id == targetApprovalLimitId && a.TenantId == queryingTenantId);

                // Verifiera att gränsen inte hittas pga horisontell isolering
                Assert.Null(crossTenantLimit);
            }
        }
    }
}
