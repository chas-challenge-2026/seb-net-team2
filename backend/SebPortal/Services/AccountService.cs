using SebPortal.Models;
using SebPortal.Api.Repositories;
using SebPortal.Api.Dtos;

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

        public async Task<Account> CreateAccountAsync(CreateAccountDTO dto)
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

            return await _accountRepository.CreateAccountAsync(createdAccount);
        }

        public async Task<Account?> GetAccountByIdAsync(int accountId)
        {
            return await _accountRepository.GetAccountByIdAsync(accountId);
        }

        public async Task<IEnumerable<Account>> GetAccountsByTenantIdAsync(int tenantId)
        {
            return await _accountRepository.GetAccountsByTenantIdAsync(tenantId);
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
