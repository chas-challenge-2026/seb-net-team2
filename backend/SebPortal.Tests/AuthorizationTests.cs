using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using SebPortal.Api.Authorization;
using System.Security.Claims;

namespace SebPortal.Tests;

public class AuthorizationTests
{
    [Fact]
    public async Task UserRole_CannotAccessAdminEndpoint()
    {
        // Arrange
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddAuthorization();

        var serviceProvider = services.BuildServiceProvider();

        var authorizationService =
            serviceProvider.GetRequiredService<IAuthorizationService>();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "123"),
            new Claim(ClaimTypes.Role, UserRoles.User)
        };

        var identity = new ClaimsIdentity(
            claims,
            authenticationType: "Test",
            nameType: ClaimTypes.Name,
            roleType: ClaimTypes.Role);

        var user = new ClaimsPrincipal(identity);

        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireRole(UserRoles.Admin)
            .Build();

        // Act
        var result = await authorizationService.AuthorizeAsync(
            user,
            resource: null,
            policy);

        // Assert
        Assert.False(result.Succeeded);
    }
    [Fact]
    public async Task AdminRole_CanAccessAdminEndpoint()
    {
        var services = new ServiceCollection();

        services.AddLogging();
        services.AddAuthorization();

        var serviceProvider = services.BuildServiceProvider();

        var authorizationService =
            serviceProvider.GetRequiredService<IAuthorizationService>();

        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, "123"),
        new Claim(ClaimTypes.Role, UserRoles.Admin)
    };

        var identity = new ClaimsIdentity(
            claims,
            "Test",
            ClaimTypes.Name,
            ClaimTypes.Role);

        var user = new ClaimsPrincipal(identity);

        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireRole(UserRoles.Admin)
            .Build();

        var result = await authorizationService.AuthorizeAsync(
            user,
            null,
            policy);

        Assert.True(result.Succeeded);
    }
}