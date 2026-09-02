using SebPortal.Api.Dtos;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public interface ICreatePaymentService
    {
        Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId);
        Task<Payment> GetPaymentById(int paymentId);
    }
}
