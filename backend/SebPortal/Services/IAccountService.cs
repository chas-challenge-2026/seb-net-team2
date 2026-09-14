using SebPortal.Models;
using SebPortal.Api.Dtos;

namespace SebPortal.Api.Services
{
    public interface IAccountService
    {
        Task<Account> CreateAccountAsync(CreateAccountDTO dto);
        Task<Account?> GetAccountByIdAsync(int accountId);
        Task<IEnumerable<Account>> GetAccountsByTenantIdAsync(int tenantId);
        Task UpdateAccountAsync(Account account);
    }
}
