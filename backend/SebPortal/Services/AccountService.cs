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

        public async Task<AccountResponseDTO> CreateAccountAsync(CreateAccountDTO dto, int tenantId)
        {

            var createdAccount = new Account
            {
                TenantId = tenantId,
                AccountName = dto.AccountName,
                Iban = _generateIban.GenerateIban(countryCode, bankCode, GenerateRandomAccountNumber())
            };

            // Check if the generated IBAN already exists in the database
            if (await _accountRepository.IbanExistsAsync(createdAccount.Iban))
            {
                throw new Exception("IBAN already exists. Please try again.");
            }

            var newAccount = await _accountRepository.CreateAccountAsync(createdAccount);

            return MapToDto(newAccount);
        }

        public async Task<AccountResponseDTO?> GetAccountByIdAsync(int accountId, int tenantId)
        {
            var account = await _accountRepository.GetAccountByIdAsync(accountId, tenantId);
            if (account == null || account.TenantId != tenantId)
            {
                return null;
            }
            return MapToDto(account);
        }

        public async Task<IEnumerable<AccountResponseDTO>> GetAccountsByTenantIdAsync(int tenantId)
        {
            var accounts = await _accountRepository.GetAccountsByTenantIdAsync(tenantId);
                       
            return accounts.Select(MapToDto);
        }

        public async Task<AccountResponseDTO?> UpdateAccountAsync(int id, int tenantId, UpdateAccountDTO dto)
        {
            var account = await _accountRepository.GetAccountByIdAsync(id, tenantId);
            if (account == null || account.TenantId != tenantId)
            {
                return null;
            }

            // Update if updated
            if (!string.IsNullOrWhiteSpace(dto.AccountName))
            {
                account.AccountName = dto.AccountName;
            }

            await _accountRepository.UpdateAccountAsync(account);

            return MapToDto(account);
        }
        // This method generates a random 17-digit account number
        private string GenerateRandomAccountNumber()
        {
            Random random = new Random();
            long accountNumber = random.NextInt64(10000000000000000, 99999999999999999);
            return accountNumber.ToString();
        }

        //Helpmethod to avoid duplicate code
        private static AccountResponseDTO MapToDto(Account account) => new()
        {
            Id = account.Id,
            TenantId = account.TenantId,
            AccountName = account.AccountName,
            Iban = account.Iban,
            Balance = account.Balance,
            Currency = account.Currency
        };
    }
}
