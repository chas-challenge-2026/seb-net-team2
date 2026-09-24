using SebPortal.Api.Dtos;


namespace SebPortal.Api.Services
{
    public interface ICurrentUserService
    {
        Task<CurrentUserDTO?> GetCurrentUserAsync(int userId);
    }
}
