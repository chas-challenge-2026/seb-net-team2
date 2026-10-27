using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public interface ICreatePaymentService
    {
        Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId, int tenantId);

        // One transaction for the whole list. A rejected row rolls every payment back
        // and throws InvalidOperationException with the message "Row {n}: …".
        Task<IReadOnlyList<Payment>> CreatePaymentsAsync(IReadOnlyList<CreatePaymentDTO> payments, int userId, int tenantId);
        Task<Payment?> GetPaymentById(Guid paymentId, int tenantId);
        Task<IEnumerable<Payment>> GetPaymentsByUserId(int userId, int tenantId);
    }
}
