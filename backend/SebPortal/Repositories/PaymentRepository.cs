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

        public async Task<IEnumerable<Payment>> GetPaymentsByUserIdAsync(int userId)
        {
            var payments = await _context.Payments.Include(p => p.Tenant)
                .Include(p => p.FromAccount)
                .Include(p => p.CreatedByUser)
                .Where(p => p.CreatedByUserId == userId)
                .ToListAsync();

            return payments.AsEnumerable();
        }

        public async Task UpdatePaymentStatusAsync(int paymentId, string status)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment != null)
            {
                payment.Status = status;
                await _context.SaveChangesAsync();
            }
        }

        public async Task CompletePaymentAsync(int paymentId)
        {
            await _context.Payments
                .Where(p => p.Id == paymentId && p.Status == "pending_approval")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, "completed")
                    .SetProperty(p => p.ExecutedAt, DateTime.UtcNow));
        }

        public async Task RejectPaymentAsync(int paymentId)
        {
            await _context.Payments
                .Where(p => p.Id == paymentId && p.Status == "pending_approval")
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.Status, "rejected"));
        }
    }
}
