using System.Net.Mail;

namespace SebPortal.Api.Services
{
    //SMTP-based implementation of IEmailSender for delivering emails in production.
    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpClient _smtpClient;

        public SmtpEmailSender(SmtpClient smtpClient)
        {
            _smtpClient = smtpClient;
        }
        public async Task SendMailAsync(MailMessage mailMessage, CancellationToken cancellationToken)
        {
            await _smtpClient.SendMailAsync(mailMessage, cancellationToken);
        }
    }
}
