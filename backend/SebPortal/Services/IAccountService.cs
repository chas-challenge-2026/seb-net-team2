using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IAccountService
    {
        Task<AccountResponseDTO> CreateAccountAsync(CreateAccountDTO dto, int tenantId);
        Task<AccountResponseDTO?> GetAccountByIdAsync(Guid accountId, int tenantId);
        Task<IEnumerable<AccountResponseDTO>> GetAccountsByTenantIdAsync(int tenantId);
        Task<AccountResponseDTO?> UpdateAccountAsync(Guid id, int tenantId, UpdateAccountDTO dto);
    }
}
