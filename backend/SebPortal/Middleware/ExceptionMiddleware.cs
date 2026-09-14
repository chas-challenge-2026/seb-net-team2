using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace SebPortal.Api.Middleware
{
    public class GlobalExceptionHandler(
     ILogger<GlobalExceptionHandler> logger,
     IProblemDetailsService problemDetailsService) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            var (status, title) = exception switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, "Resource not found"),
                ValidationException => (StatusCodes.Status400BadRequest, "Validation failed"),
                UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Forbidden"),
                BusinessRuleException => (400, "Business rule violated"),
                ServiceUnavailableException => (StatusCodes.Status503ServiceUnavailable, "Service unavailable"),
                DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "The payment was modified by someone else. Reload and try again."), // rowversion conflict
                _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
            };

            if (status == 500)
                logger.LogError(exception, "Unhandled exception on {Path}", httpContext.Request.Path);
            else
                logger.LogWarning(exception, "Handled {ExceptionType} on {Path}", exception.GetType().Name, httpContext.Request.Path);

            httpContext.Response.StatusCode = status;

            return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                Exception = exception,
                ProblemDetails = new ProblemDetails
                {
                    Status = status,
                    Title = title,
                    Detail = status == 500 ? null : exception.Message,
                    Instance = httpContext.Request.Path
                }
            });
        }
    }
}
