namespace SebPortal.Api.Middleware
{
    public class ServiceUnavailableException : Exception
    {
        public ServiceUnavailableException(string message) : base(message)
        {
        }
    }
}
