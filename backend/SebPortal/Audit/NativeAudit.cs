using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace SebPortal.Audit
{
    /// <summary>
    /// Wrapper för Native Audit-biblioteket.
    /// </summary>
    public static class NativeAudit
    {
        private const string LibraryName = "auditsigner";

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_initialize(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey,
            int userId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string action,
            int entityId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string description);

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_append(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey,
            int userId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string action,
            int entityId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string description);

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_append_with_hash(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey,
            int userId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string action,
            int entityId,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string description,
            [Out] byte[] outHash,
            nuint outHashSize);

        [DllImport(LibraryName, CallingConvention = CallingConvention.Cdecl)]
        private static extern int audit_verify(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string logPath,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string secretKey);

        /// <summary>
        /// Explicitly initializes a new audit log. Does not overwrite an existing file.
        /// Must not be called automatically during normal application startup.
        /// </summary>
        public static int Initialize(
            string logPath, string secretKey, int userId,
            string action, int entityId, string description)
        {
            return audit_initialize(
                logPath, secretKey, userId, action, entityId, description);
        }

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

        public static (int Result, string? Hash) AppendWithHash(
            string logPath,
            string secretKey,
            int userId,
            string action,
            int entityId,
            string description)
        {
            byte[] hashBuffer = new byte[65];

            int result = audit_append_with_hash(
                logPath,
                secretKey,
                userId,
                action,
                entityId,
                description,
                hashBuffer,
                (nuint)hashBuffer.Length);

            string? hash = result == 0
                ? Encoding.ASCII.GetString(hashBuffer).TrimEnd('\0')
                : null;

            return (result, hash);
        }

        public static int Verify(string logPath, string secretKey)
        {
            return audit_verify(logPath, secretKey);
        }

        public static HashSet<int> ReadDatabaseIds(string logPath)
        {
            var ids = new HashSet<int>();

            foreach (var line in File.ReadLines(logPath))
            {
                var fields = line.Split('|');

                if (fields.Length < 5)
                    continue;

                foreach (var part in fields[4].Split(';'))
                {
                    if (part.StartsWith("dbId=") &&
                        int.TryParse(part.Substring(5), out var id))
                    {
                        ids.Add(id);
                        break;
                    }
                }
            }

            return ids;
        }
        public static Dictionary<int, string> ReadDatabaseHashes(string logPath)
        {
            var hashes = new Dictionary<int, string>();

            foreach (var line in File.ReadLines(logPath))
            {
                var fields = line.Split('|');

                // Native log format:
                // TIMESTAMP|USER_ID|ACTION|ENTITY_ID|DESCRIPTION|PREV_HASH|HMAC
                if (fields.Length < 7)
                    continue;

                var nativeHash = fields[^1].Trim();

                // HMAC-SHA256 should contain 64 hexadecimal characters.
                if (nativeHash.Length != 64)
                    continue;

                foreach (var part in fields[4].Split(';'))
                {
                    if (part.StartsWith("dbId=") &&
                        int.TryParse(part.Substring(5), out var id))
                    {
                        hashes[id] = nativeHash;
                        break;
                    }
                }
            }

            return hashes;
        }
    }
}
