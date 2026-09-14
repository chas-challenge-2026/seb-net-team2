using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IAccountRepository
    {
        Task<Account> CreateAccountAsync(Account account);
        Task<Account?> GetAccountByIdAsync(int accountId);
        Task<IEnumerable<Account>> GetAccountsByTenantIdAsync(int tenantId);
        Task UpdateAccountAsync(Account account);
        Task<bool> IbanExistsAsync(string iban); // New method to check if IBAN exists
        Task RefundAsync(int accountId, decimal amount);
    }
}
