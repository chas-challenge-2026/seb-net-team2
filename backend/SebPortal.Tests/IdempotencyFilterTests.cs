using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Api.Filters;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Tests;

public class IdempotencyFilterTests
{
    [Fact]
    public async Task SameKeyAndRequest_ActionIsOnlyExecutedOnce()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        await using var dbContext = new SebDbContext(options);

        await dbContext.Database.EnsureCreatedAsync();

        var filter = new IdempotencyFilter(dbContext);

        var actionCallCount = 0;

        // First request
        var firstContext = CreateActionContext(
            "test-key-123",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        ActionExecutionDelegate firstNext = () =>
        {
            actionCallCount++;

            var result = new ObjectResult(new
            {
                id = 1,
                amount = 100
            })
            {
                StatusCode = StatusCodes.Status201Created
            };

            return Task.FromResult(
                CreateExecutedContext(firstContext, result)
            );
        };

        await filter.OnActionExecutionAsync(firstContext, firstNext);

        // Second identical request
        var secondContext = CreateActionContext(
            "test-key-123",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        ActionExecutionDelegate secondNext = () =>
        {
            actionCallCount++;

            var result = new ObjectResult(new
            {
                id = 2,
                amount = 100
            })
            {
                StatusCode = StatusCodes.Status201Created
            };

            return Task.FromResult(
                CreateExecutedContext(secondContext, result)
            );
        };

        await filter.OnActionExecutionAsync(secondContext, secondNext);

        // Assert
        Assert.Equal(1, actionCallCount);
        Assert.IsType<ContentResult>(secondContext.Result);
    }

    private static ActionExecutingContext CreateActionContext(string idempotencyKey, CreatePaymentDTO request)
    {
        var httpContext = new DefaultHttpContext();

        httpContext.Request.Headers["X-Idempotency-Key"] =idempotencyKey;

        var actionContext = new ActionContext(httpContext, new RouteData(),new ActionDescriptor());

        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>
            {
                ["dto"] = request
            },
            controller: new object()
        );
    }

    private static ActionExecutedContext CreateExecutedContext(ActionExecutingContext executingContext, IActionResult result)
    {
        return new ActionExecutedContext(
            executingContext,
            new List<IFilterMetadata>(),
            controller: new object()
        )
        {
            Result = result
        };
    }

    [Fact]
    public async Task SameKeyDifferentRequest_ReturnsConflict()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        await using var dbContext = new SebDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var filter = new IdempotencyFilter(dbContext);

        var firstContext = CreateActionContext(
            "test-key-123",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        ActionExecutionDelegate firstNext = () =>
        {
            var result = new ObjectResult(new { id = 1 })
            {
                StatusCode = StatusCodes.Status201Created
            };

            return Task.FromResult(CreateExecutedContext(firstContext, result));
        };

        await filter.OnActionExecutionAsync(firstContext, firstNext);

        // Same key, different request
        var secondContext = CreateActionContext(
            "test-key-123",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 500,
                Currency = "SEK",
                Reference = "test"
            });

        var secondActionCalled = false;

        ActionExecutionDelegate secondNext = () =>
        {
            secondActionCalled = true;

            return Task.FromResult(
                CreateExecutedContext(
                    secondContext,
                    new OkResult()
                )
            );
        };

        // Act
        await filter.OnActionExecutionAsync(secondContext, secondNext);

        // Assert
        Assert.False(secondActionCalled);

        var result = Assert.IsType<ConflictObjectResult>(secondContext.Result);

        Assert.Equal(StatusCodes.Status409Conflict, result.StatusCode);
    }
    [Fact]
    public async Task MissingIdempotencyKey_ReturnsBadRequest()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        await using var dbContext = new SebDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        var filter = new IdempotencyFilter(dbContext);

        var httpContext = new DefaultHttpContext();

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());

        var executingContext = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            controller: new object()
        );

        var actionCalled = false;

        ActionExecutionDelegate next = () =>
        {
            actionCalled = true;

            return Task.FromResult(
                CreateExecutedContext(
                    executingContext,
                    new OkResult()
                )
            );
        };

        // Act
        await filter.OnActionExecutionAsync(executingContext, next);

        // Assert
        Assert.False(actionCalled);

        Assert.IsType<BadRequestObjectResult>(executingContext.Result);
    }
    [Fact]
    public async Task ExpiredKey_AllowsRequestToExecuteAgain()
    {
        // Arrange
        await using var connection = new SqliteConnection("Data Source=:memory:");

        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>().UseSqlite(connection).Options;

        await using var dbContext = new SebDbContext(options);
        await dbContext.Database.EnsureCreatedAsync();

        dbContext.IdempotencyKeys.Add(new IdempotencyKey
        {
            Key = "expired-key",
            RequestHash = "old-hash",
            ResponseContent = "{\"id\":1}",
            StatusCode = StatusCodes.Status201Created,
            CreatedAt = DateTime.UtcNow.AddMinutes(-2)
        });

        await dbContext.SaveChangesAsync();

        var filter = new IdempotencyFilter(dbContext);

        var context = CreateActionContext(
            "expired-key",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        var actionCallCount = 0;

        ActionExecutionDelegate next = () =>
        {
            actionCallCount++;

            var result = new ObjectResult(new
            {
                id = 2,
                amount = 100
            })
            {
                StatusCode = StatusCodes.Status201Created
            };

            return Task.FromResult(
                CreateExecutedContext(context, result)
            );
        };

        // Act
        await filter.OnActionExecutionAsync(context, next);

        // Assert
        Assert.Equal(1, actionCallCount);
    }
    [Fact]
    public async Task ConcurrentSameKeyAndRequest_ActionRunsOnlyOnce()
    {
        // Shared in-memory database so both requests use the same database
        const string connectionString =
            "Data Source=IdempotencyConcurrency;Mode=Memory;Cache=Shared";

        await using var keeperConnection =
            new SqliteConnection(connectionString);

        await keeperConnection.OpenAsync();

        var options = new DbContextOptionsBuilder<SebDbContext>()
            .UseSqlite(connectionString)
            .Options;

        await using (var setupContext = new SebDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        // Separate DbContext = separate HTTP request
        await using var firstDbContext = new SebDbContext(options);
        await using var secondDbContext = new SebDbContext(options);

        var firstFilter = new IdempotencyFilter(firstDbContext);
        var secondFilter = new IdempotencyFilter(secondDbContext);

        var firstContext = CreateActionContext(
            "concurrent-key",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        var secondContext = CreateActionContext(
            "concurrent-key",
            new CreatePaymentDTO
            {
                TenantId = 1,
                FromAccountId = 1,
                ToIban = "SE3550000000054910000003",
                Amount = 100,
                Currency = "SEK",
                Reference = "test"
            });

        var actionCallCount = 0;

        // Lets the test know when request A has reached the controller
        var firstRequestStarted =
            new TaskCompletionSource(
                TaskCreationOptions.RunContinuationsAsynchronously);

        // Keeps request A waiting until we allow it to finish
        var allowFirstRequestToFinish =
            new TaskCompletionSource(
                TaskCreationOptions.RunContinuationsAsynchronously);

        ActionExecutionDelegate firstNext = async () =>
        {
            Interlocked.Increment(ref actionCallCount);

            firstRequestStarted.SetResult();

            // Pretend payment creation is taking some time
            await allowFirstRequestToFinish.Task;

            var result = new CreatedResult(
                "/api/Payment/42",
                new
                {
                    id = 42,
                    amount = 100
                });

            return CreateExecutedContext(firstContext, result);
        };

        ActionExecutionDelegate secondNext = () =>
        {
            Interlocked.Increment(ref actionCallCount);

            var result = new CreatedResult(
                "/api/Payment/99",
                new
                {
                    id = 99,
                    amount = 100
                });

            return Task.FromResult(
                CreateExecutedContext(secondContext, result));
        };

        // Start request A
        var firstTask =
            firstFilter.OnActionExecutionAsync(
                firstContext,
                firstNext);

        // Wait until A has reserved the key and entered the action
        await firstRequestStarted.Task;

        // Start request B while A is still running
        var secondTask =
            secondFilter.OnActionExecutionAsync(
                secondContext,
                secondNext);

        // Give B time to discover that A is processing
        await Task.Delay(250);

        // Let A finish and save its response
        allowFirstRequestToFinish.SetResult();

        await Task.WhenAll(firstTask, secondTask);

        // Only A should have executed the controller action
        Assert.Equal(1, actionCallCount);

        // B should receive A's cached response
        var replay =
            Assert.IsType<ContentResult>(
                secondContext.Result);

        Assert.Equal(
            StatusCodes.Status201Created,
            replay.StatusCode);

        Assert.Contains(
            "\"id\":42",
            replay.Content);

        Assert.Equal(
            "/api/Payment/42",
            secondContext.HttpContext.Response.Headers.Location.ToString());
    }
}