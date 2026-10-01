using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IAccountService
    {
        Task<AccountResponseDTO> CreateAccountAsync(CreateAccountDTO dto);
        Task<AccountResponseDTO?> GetAccountByIdAsync(int accountId);
        Task<IEnumerable<AccountResponseDTO>> GetAccountsByTenantIdAsync(int tenantId);
        Task UpdateAccountAsync(Account account);
    }
}
