using Microsoft.EntityFrameworkCore;
using SebPortal.Data;
using SebPortal.Models;

namespace SebPortal.Api.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly SebDbContext _context;

        public PaymentRepository(SebDbContext context)
        {
            _context = context;
        }

        public async Task<Payment> CreatePaymentAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            return payment;
        }

        public async Task<Payment?> GetPaymentByIdAsync(int paymentId)
        {
            return await _context.Payments.Include(p => p.Tenant)
                .Include(p => p.FromAccount)
                .Include(p => p.CreatedByUser)
                .FirstOrDefaultAsync(p => p.Id == paymentId);
        }

        public Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId)
        {
            throw new NotImplementedException();
        }

        public async Task UpdatePaymentStatusAsync(int paymentId, string status, uint rowVersion)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null)
                throw new KeyNotFoundException($"Payment with id {paymentId} not found.");

            _context.Entry(payment).Property(p => p.RowVersion).OriginalValue = rowVersion;
            payment.Status = status;

            await _context.SaveChangesAsync();
        }
    }
}
