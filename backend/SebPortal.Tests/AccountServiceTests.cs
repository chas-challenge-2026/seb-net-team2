using Moq;
using Xunit;
using SebPortal.Api.Services;
using SebPortal.Api.Repositories;
using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Tests
{
    public class AccountServiceTests
    {
        private readonly Mock<IAccountRepository> _accountRepositoryMock;
        private readonly Mock<IGenerateIban> _generateIbanMock;
        private readonly AccountService _service; 

        public AccountServiceTests()
        {
            _accountRepositoryMock = new Mock<IAccountRepository>();
            _generateIbanMock = new Mock<IGenerateIban>();
            _service = new AccountService(_accountRepositoryMock.Object, _generateIbanMock.Object);
        }

        [Fact]
        public async Task CreateAccountAsync_ShouldCreateAndReturnAccount_WhenDataIsValid()
        {
            // Arrange
            var tenantId = 1;
            var dto = new CreateAccountDTO { AccountName = "Lönekonto" };

            _generateIbanMock.Setup(g => g.GenerateIban(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                             .Returns("SE500123456789");

            _accountRepositoryMock.Setup(r => r.IbanExistsAsync(It.IsAny<string>()))
                                  .ReturnsAsync(false);

            _accountRepositoryMock.Setup(r => r.CreateAccountAsync(It.IsAny<Account>()))
                                  .ReturnsAsync((Account a) =>
                                  {
                                      a.Id = 10;
                                      return a;
                                  });

            // Act
            var result = await _service.CreateAccountAsync(dto, tenantId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(10, result.Id);
            Assert.Equal("Lönekonto", result.AccountName);
            Assert.Equal(tenantId, result.TenantId);
            Assert.Equal("SE500123456789", result.Iban);
        }

        [Fact]
        public async Task GetAccountByIdAsync_ShouldReturnNull_WhenAccountBelongsToAnotherTenant()
        {
            // Arrange
            var accountId = 1;
            var currentTenantId = 1;

            // Kontot tillhör tenant 2, men inloggad användare är tenant 1
            var accountFromDb = new Account { Id = accountId, TenantId = 2, AccountName = "Annan Tenants Kontot", Iban = "SE500123456789" };

            _accountRepositoryMock.Setup(r => r.GetAccountByIdAsync(accountId))
                                  .ReturnsAsync(accountFromDb);

            // Act
            var result = await _service.GetAccountByIdAsync(accountId, currentTenantId);

            // Assert
            // Ska returnera null så att controllern kan svara med 404 (förhindrar information leakage)
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateAccountAsync_ShouldUpdateAccountName_WhenAccountExistsAndBelongsToTenant()
        {
            // Arrange
            var accountId = 1;
            var tenantId = 1;
            var existingAccount = new Account { Id = accountId, TenantId = tenantId, AccountName = "Gamla Namnet", Iban = "SE500123456789", Currency = "SEK" };
            var updateDto = new UpdateAccountDTO { AccountName = "Nya Namnet" };

            _accountRepositoryMock.Setup(r => r.GetAccountByIdAsync(accountId))
                                  .ReturnsAsync(existingAccount);

            // Act
            var result = await _service.UpdateAccountAsync(accountId, tenantId, updateDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Nya Namnet", result.AccountName);
            _accountRepositoryMock.Verify(r => r.UpdateAccountAsync(It.Is<Account>(a => a.AccountName == "Nya Namnet")), Times.Once);
        }
    }
}