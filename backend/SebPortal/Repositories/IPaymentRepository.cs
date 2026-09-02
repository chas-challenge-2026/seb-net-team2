using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public interface IPaymentRepository
    {
        Task<Payment> CreatePaymentAsync(Payment payment);
        Task<Payment> GetPaymentByIdAsync(int paymentId);
        Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId);
        Task UpdatePaymentStatusAsync(int paymentId, string status);
    }
}
