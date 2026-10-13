
using System.Runtime.InteropServices;

namespace SebPortal.Audit
{
    /// <summary>
    /// Wrapper för Native Audit-biblioteket.
    /// </summary>
    public static class NativeAudit
    {
        private const string LibraryName = "auditsigner";

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_append(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey,
            int userId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string action,
            int entityId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string description);

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_verify(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey);

        public static int Append(
            string logPath,
            string secretKey,
            int userId,
            string action,
            int entityId,
            string description)
        {
            return audit_append(
                logPath, secretKey, userId, action, entityId, description);
        }

        public static int Verify(string logPath, string secretKey)
        {
            return audit_verify(logPath, secretKey);
        }
    }
}
