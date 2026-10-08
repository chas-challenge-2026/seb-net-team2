using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public interface ICreatePaymentService
    {
        Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId, int tenantId);
        Task<Payment?> GetPaymentById(Guid paymentId, int tenantId);
        Task<IEnumerable<Payment>> GetPaymentsByUserId(int userId, int tenantId);
    }
}
