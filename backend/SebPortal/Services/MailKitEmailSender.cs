using MailKit.Net.Smtp;
using MimeKit;

namespace SebPortal.Api.Services
{
    public class MailKitEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public MailKitEmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public async Task SendMailAsync( string recipientEmail, string subject, string message, CancellationToken cancellationToken)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress("SebPortal", _configuration["Email:Sender"] ?? "noreply@sebportal.se"));
            email.To.Add(MailboxAddress.Parse(recipientEmail));
            email.Subject = subject;
            email.Body = new TextPart("plain") { Text = message };

            using var client = new SmtpClient();

            var host = _configuration["Email:SmtpHost"] ?? "localhost";
            var port = int.Parse(_configuration["Email:SmtpPort"] ?? "1025");

            // Connect to SMTP mock (Smtp4dev) 
            await client.ConnectAsync(host, port, false, cancellationToken);
            await client.SendAsync(email, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
