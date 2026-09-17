using System.Net.Mail;

namespace SebPortal.Api.Services
{
    //needed to be able to mock in tests (SMTP not mockable) 
    public interface IEmailSender
    {
        Task SendMailAsync(MailMessage mailMessage, CancellationToken cancellationToken);
    }
}
