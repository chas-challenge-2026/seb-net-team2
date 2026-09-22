using SebPortal.Api.Dtos;
using System.Threading.Channels;

namespace SebPortal.Api.Services
{
    public class NotificationQueue : INotificationQueue
    {
        private readonly Channel<NotificationMessageDTO> _channel = Channel.CreateUnbounded<NotificationMessageDTO>(new UnboundedChannelOptions
        {
            SingleWriter = false,
            SingleReader = true
        });

        public async ValueTask EnqueueNotificationAsync(NotificationMessageDTO notification)
        {
            ArgumentNullException.ThrowIfNull(notification);
            await _channel.Writer.WriteAsync(notification);
        }

        public async ValueTask<NotificationMessageDTO> ReadAsync(CancellationToken cancellationToken)
        {
            return await _channel.Reader.ReadAsync(cancellationToken);
        }

    }
}
