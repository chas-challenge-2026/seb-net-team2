using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IPaymentRepository
    {
        Task<Payment> CreatePaymentAsync(Payment payment);
        Task<Payment?> GetPaymentByIdAsync(int paymentId, int tenantId);
        Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId, int tenantId);
        Task UpdatePaymentStatusAsync(int paymentId, string status, int tenantId);
        Task CompletePaymentAsync(int paymentId, int tenantId);
        Task RejectPaymentAsync(int paymentId, int tenantId);
    }
}
