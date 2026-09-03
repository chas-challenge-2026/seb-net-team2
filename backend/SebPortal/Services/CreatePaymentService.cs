using SebPortal.Api.Dtos;
using SebPortal.Api.Repositories;
using SebPortal.Models;

namespace SebPortal.Api.Services
{
    public class CreatePaymentService : ICreatePaymentService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPaymentRepository _paymentRepository;

        public CreatePaymentService(IUserRepository userRepository, IPaymentRepository paymentRepository)
        {
            _userRepository = userRepository;
            _paymentRepository = paymentRepository;
        }

        public async Task<Payment> CreatePaymentAsync(CreatePaymentDTO createPaymentDTO, int userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            var payment = new Payment
            {

                TenantId = user.TenantId,
                FromAccountId = createPaymentDTO.FromAccountId,
                ToIban = createPaymentDTO.ToIban,
                Amount = createPaymentDTO.Amount,
                Currency = createPaymentDTO.Currency,
                Reference = createPaymentDTO.Reference,
                Status = "pending_approval",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            return await _paymentRepository.CreatePaymentAsync(payment);
        }

        public async Task<Payment?> GetPaymentById(int paymentId)
        {
            var payment = await _paymentRepository.GetPaymentByIdAsync(paymentId);
            return payment;
        }
    }
}
