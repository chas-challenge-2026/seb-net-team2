using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
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
            if (!context.HttpContext.Request.Headers.TryGetValue("X-Idempotency-Key",out var idempotencyKey) ||string.IsNullOrWhiteSpace(idempotencyKey))
            {
                context.Result = new BadRequestObjectResult("X-Idempotency-Key header is required.");

                return;
            }

            var key = idempotencyKey.ToString();

            // Create a hash of the request
            var requestJson = JsonSerializer.Serialize(context.ActionArguments);

            var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));

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

                    // Same key + same request
                    if (existingKey.ResponseContent != null && existingKey.StatusCode != null)
                    {
                        context.Result = new ContentResult
                        {
                            Content = existingKey.ResponseContent,
                            ContentType = "application/json",
                            StatusCode = existingKey.StatusCode
                        };

                        return;
                    }

                    context.Result = new ConflictObjectResult("A request with this idempotency key is already being processed.");

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
                // Another request may have inserted the same key at the same time.
                context.Result = new ConflictObjectResult("A request with this idempotency key is already being processed.");

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

                await _context.SaveChangesAsync();
            }
        }
    }
}