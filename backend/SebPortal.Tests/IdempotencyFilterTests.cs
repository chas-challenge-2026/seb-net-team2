using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
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
            new
            {
                amount = 100,
                reference = "test"
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
            new
            {
                amount = 100,
                reference = "test"
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

    private static ActionExecutingContext CreateActionContext(string idempotencyKey, object request)
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
            new
            {
                amount = 100,
                reference = "test"
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
            new
            {
                amount = 500,
                reference = "test"
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

        var context = CreateActionContext("expired-key", new{amount = 100, reference = "test"});

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
}