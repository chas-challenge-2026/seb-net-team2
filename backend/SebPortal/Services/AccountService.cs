using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;
using System.Security.Principal;

namespace SebPortal.Api.Services
{
    public class AccountService : IAccountService
    {
        private const string countryCode = "SE"; // Country code for Sweden
        private const string bankCode = "500"; // Bank code for Sweden

        private readonly IAccountRepository _accountRepository;
        private readonly IGenerateIban _generateIban;

        public AccountService(IAccountRepository accountRepository, IGenerateIban generateIban)
        {
            _accountRepository = accountRepository;
            _generateIban = generateIban;
        }

        public async Task<AccountResponseDTO> CreateAccountAsync(CreateAccountDTO dto)
        {

            var createdAccount = new Account
            {
                TenantId = dto.TenantId,
                AccountName = dto.AccountName,
                Iban = _generateIban.GenerateIban(countryCode, bankCode, GenerateRandomAccountNumber())
            };

            // Check if the generated IBAN already exists in the database
            if (await _accountRepository.IbanExistsAsync(createdAccount.Iban))
            {
                throw new Exception("IBAN already exists. Please try again.");
            }

            var newAccount = await _accountRepository.CreateAccountAsync(createdAccount);
            
            return new AccountResponseDTO
            {
                Id = newAccount.Id,
                TenantId = newAccount.TenantId,
                AccountName = newAccount.AccountName,
                Iban = newAccount.Iban,
                Balance = newAccount.Balance,
                Currency = newAccount.Currency
            };
        }

        public async Task<AccountResponseDTO?> GetAccountByIdAsync(int accountId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId);
            if (account == null)
            {
                return null;
            }
            return new AccountResponseDTO
            {
                Id = account.Id,
                TenantId = account.TenantId,
                AccountName = account.AccountName,
                Iban = account.Iban,
                Balance = account.Balance,
                Currency = account.Currency
            };
        }

        public async Task<IEnumerable<AccountResponseDTO>> GetAccountsByTenantIdAsync(int tenantId)
        {
            var accounts = await _accountRepository.GetAccountsByTenantIdAsync(tenantId);
            if (accounts == null)
            {
                return Enumerable.Empty<AccountResponseDTO>();
            }
            
            return accounts.Select(account => new AccountResponseDTO
            {
                Id = account.Id,
                TenantId = account.TenantId,
                AccountName = account.AccountName,
                Iban = account.Iban,
                Balance = account.Balance,
                Currency = account.Currency
            });
        }

        public async Task UpdateAccountAsync(Account account)
        {
            await _accountRepository.UpdateAccountAsync(account);
        }

        // This method generates a random 17-digit account number
        private string GenerateRandomAccountNumber()
        {
            Random random = new Random();
            long accountNumber = random.NextInt64(10000000000000000, 99999999999999999);
            return accountNumber.ToString();
        }
    }
}
