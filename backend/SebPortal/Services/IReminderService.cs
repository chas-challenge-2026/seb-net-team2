namespace SebPortal.Api.Services
{
    public interface IReminderService
    {
        Task ProcessRemindersAsync(CancellationToken cancellationToken = default);
    }
}