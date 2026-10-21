namespace SebPortal.Api.Services
{
    public class GenerateIbanService : IGenerateIban
    {

        // This method generates an IBAN based on the provided country code, bank code, and account number.
        public string GenerateIban(string countryCode, string bankCode, string accountNumber)
        {
            if (string.IsNullOrWhiteSpace(countryCode) || countryCode.Length != 2)
                throw new ArgumentException("Landskod måste vara exakt 2 bokstäver.", nameof(countryCode));

            if (string.IsNullOrWhiteSpace(bankCode))
                throw new ArgumentException("Bankkod saknas.", nameof(bankCode));

            if (string.IsNullOrWhiteSpace(accountNumber))
                throw new ArgumentException("Kontonummer saknas.", nameof(accountNumber));

            countryCode = countryCode.ToUpperInvariant();
            var bban = $"{bankCode}{accountNumber}".ToUpperInvariant();

            var checkDigits = CalculateCheckDigits(countryCode, bban);

            return $"{countryCode}{checkDigits}{bban}";
        }

        private static string CalculateCheckDigits(string countryCode, string bban)
        {

            var rearranged = bban + countryCode + "00";
            var remainder = 0;

            foreach (var c in rearranged)
            {
                if (char.IsAsciiDigit(c))
                {
                    remainder = (remainder * 10 + (c - '0')) % 97;
                }
                else if (char.IsAsciiLetterUpper(c))
                {
                    var value = c - 'A' + 10; // A=10 ... Z=35
                    remainder = (remainder * 10 + value / 10) % 97;
                    remainder = (remainder * 10 + value % 10) % 97;
                }
                else
                {
                    throw new ArgumentException($"Ogiltigt tecken i underlaget för IBAN: '{c}'.");
                }
            }

            var checkDigits = 98 - remainder;
            return checkDigits.ToString("D2");
        }
    }
}
