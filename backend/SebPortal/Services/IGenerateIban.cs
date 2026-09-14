namespace SebPortal.Api.Services
{
    public interface IGenerateIban
    {
        string GenerateIban(string countryCode, string bankCode, string accountNumber);
    }
}
