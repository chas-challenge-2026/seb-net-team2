using SebPortal.Models;
using SebPortal.Data;
using Microsoft.EntityFrameworkCore;

namespace SebPortal.Api.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly SebDbContext _context;

        public AccountRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<Account> CreateAccountAsync(Account account)
        {
            var result = await _context.Accounts.AddAsync(account);
            await _context.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<Account?> GetAccountByIdAsync(int accountId, int tenantId)
        {
            return await _context.Accounts.FirstOrDefaultAsync(a => a.Id == accountId && a.TenantId == tenantId);
        }

        public async Task<IEnumerable<Account>> GetAccountsByTenantIdAsync(int tenantId)
        {
            return await _context.Accounts
                .Where(a => a.TenantId == tenantId)
                .ToListAsync();
        }

        public async Task UpdateAccountAsync(Account account)
        {
            _context.Accounts.Update(account);
            await _context.SaveChangesAsync();
        }

        // This method checks if an IBAN already exists in the database
        public async Task<bool> IbanExistsAsync(string iban)
        {
            return await _context.Accounts.AnyAsync(a => a.Iban == iban);
        }

        public async Task RefundAsync(int accountId, decimal amount, int tenantId)
        {
            await _context.Accounts
                .Where(a => a.Id == accountId && a.TenantId == tenantId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Balance, a => a.Balance + amount));
        }

        public Task<Account?> GetByPublicIdAsync(Guid publicId, int tenantId)
        {
            return _context.Accounts.FirstOrDefaultAsync(a => a.PublicId == publicId && a.TenantId == tenantId);
        }
    }
}
