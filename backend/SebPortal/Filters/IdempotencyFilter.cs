using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using SebPortal.Api.Dtos;
using SebPortal.Data;
using SebPortal.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SebPortal.Api.Filters
{
    public class IdempotencyFilter : IAsyncActionFilter
    {
        private readonly SebDbContext _context;

        //Idempotency keys are valid for 1 minute. After that, they can be reused. CHANGE THIS LATER
        private static readonly TimeSpan IdempotencyKeyLifetime = TimeSpan.FromMinutes(1);

        public IdempotencyFilter(SebDbContext context)
        {
            _context = context;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Require idempotency header
            if (!context.HttpContext.Request.Headers.TryGetValue("X-Idempotency-Key",out var idempotencyKey) || string.IsNullOrWhiteSpace(idempotencyKey))
            {
                context.Result = new BadRequestObjectResult("X-Idempotency-Key header is required.");

                return;
            }

            var key = idempotencyKey.ToString();

            // Create a hash of the payment request only
            if (!context.ActionArguments.TryGetValue("dto", out var dtoObject) ||
                dtoObject is not CreatePaymentDTO dto)
            {
                context.Result = new BadRequestObjectResult("Payment request is missing.");
                return;
            }

            var requestJson = JsonSerializer.Serialize(
                dto,
                new JsonSerializerOptions(JsonSerializerDefaults.Web));

            var requestHash = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));

            // Check if this key has already been used
            var existingKey = await _context.IdempotencyKeys.FirstOrDefaultAsync(x => x.Key == key);

            if (existingKey != null)
            {
                var hasExpired = DateTime.UtcNow - existingKey.CreatedAt > IdempotencyKeyLifetime;

                if (hasExpired)
                {
                    _context.IdempotencyKeys.Remove(existingKey);
                    await _context.SaveChangesAsync();

                    existingKey = null;
                }
                else
                {
                    // Same key, but different request
                    if (existingKey.RequestHash != requestHash)
                    {
                        context.Result = new ConflictObjectResult("The idempotency key has already been used for a different request.");

                        return;
                    }

                    // Same key + same request and the first request is already finished
                    if (existingKey.ResponseContent != null && existingKey.StatusCode != null)
                    {
                        if (!string.IsNullOrWhiteSpace(existingKey.ResponseLocation))
                        {
                            context.HttpContext.Response.Headers.Location = existingKey.ResponseLocation;
                        }

                        context.Result = new ContentResult
                        {
                            Content = existingKey.ResponseContent,
                            ContentType = "application/json",
                            StatusCode = existingKey.StatusCode
                        };

                        return;
                    }

                    // Same request is currently being processed by another request.
                    // Wait for it to finish and replay its response.
                    context.Result = await WaitForCompletedResponseAsync(key, requestHash, context.HttpContext);

                    return;
                }
            }

            // Reserve the key BEFORE running the controller
            var idempotencyRecord = new IdempotencyKey
            {
                Key = key,
                RequestHash = requestHash,
                CreatedAt = DateTime.UtcNow
            };

            _context.IdempotencyKeys.Add(idempotencyRecord);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Another request inserted the same key before us.
                _context.Entry(idempotencyRecord).State = EntityState.Detached;

                context.Result = await WaitForCompletedResponseAsync(key, requestHash, context.HttpContext);

                return;
            }

            // Run the actual controller/service
            ActionExecutedContext executedContext;

            try
            {
                executedContext = await next();
            }
            catch
            {
                // Request failed completely, remove the reservation
                _context.IdempotencyKeys.Remove(idempotencyRecord);
                await _context.SaveChangesAsync();

                throw;
            }

            // Save the response from the controller
            if (executedContext.Result is ObjectResult objectResult)
            {
                idempotencyRecord.ResponseContent = JsonSerializer.Serialize(objectResult.Value,new JsonSerializerOptions(JsonSerializerDefaults.Web));

                idempotencyRecord.StatusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;

                if (objectResult is CreatedResult createdResult)
                {
                    idempotencyRecord.ResponseLocation = createdResult.Location;
                }

                await _context.SaveChangesAsync();
            }

        }

        private async Task<IActionResult> WaitForCompletedResponseAsync(string key,string requestHash,HttpContext httpContext)
        {
            const int maxAttempts = 10;
            const int delayMilliseconds = 100;

            for (var attempt = 0; attempt < maxAttempts; attempt++)
            {
                var concurrentKey = await _context.IdempotencyKeys.AsNoTracking().FirstOrDefaultAsync(x => x.Key == key);

                if (concurrentKey != null)
                {
                    if (concurrentKey.RequestHash != requestHash)
                    {
                        return new ConflictObjectResult("The idempotency key has already been used for a different request.");
                    }

                    if (concurrentKey.ResponseContent != null && concurrentKey.StatusCode != null)
                    {
                        if (!string.IsNullOrWhiteSpace(concurrentKey.ResponseLocation))
                        {
                            httpContext.Response.Headers.Location = concurrentKey.ResponseLocation;
                        }

                        return new ContentResult
                        {
                            Content = concurrentKey.ResponseContent,
                            ContentType = "application/json",
                            StatusCode = concurrentKey.StatusCode
                        };
                    }
                }

                await Task.Delay(delayMilliseconds, httpContext.RequestAborted);
            }

            return new ConflictObjectResult("A request with this idempotency key is still being processed.");
        }
    }
}