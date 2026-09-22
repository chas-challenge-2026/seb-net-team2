
namespace SebPortal.Api.Services
{
    //needed to be able to mock in tests (SMTP not mockable) 
    public interface IEmailSender
    {
        Task SendMailAsync(string recipientEmail, string subject, string message, CancellationToken cancellationToken);
    }
}
