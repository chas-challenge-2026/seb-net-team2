using System.Runtime.InteropServices;
using System.Text;
using SebPortal.Api.Dtos;

namespace SebPortal.Csv
{
    static class NativeCsv
    {
        [DllImport("csvparser", CallingConvention = CallingConvention.Cdecl)]
        static extern int csv_parse(byte[] content, int contentLen, ref Csv outCsv);

        [DllImport("csvparser", CallingConvention = CallingConvention.Cdecl)]
        static extern void csv_free(ref Csv csv);

        [StructLayout(LayoutKind.Sequential)]
        struct Csv
        {
            public IntPtr data;        // void**
            public nuint dataCapacity; // size_t
            public nuint dataLength;   // size_t
        }

        public class CSVPayment
        {
            public int FromAccountId { get; set; }
            public string ToIban { get; set; } = "";
            public decimal Amount { get; set; }
            public string Reference { get; set; } = "";
        }

        public static List<CSVPayment> Parse(byte[] utf8)
        {
            var csv = new Csv();
            var rc = csv_parse(utf8, utf8.Length, ref csv);
            try
            {
                if (rc != 0)
                    throw new InvalidDataException($"{rc}");

                int n = (int)csv.dataLength;
                if (n < 8 || n % 4 != 0)
                    throw new InvalidDataException("Expected a header and 4 columns per row.");

                var rows = new List<CSVPayment>();
                for (int i = 4; i < n; i += 4)
                {
                    rows.Add(new CSVPayment
                    {
                        FromAccountId = ReadInt32(csv.data, i),
                        ToIban = ReadUtf8(csv.data, i + 1),
                        Amount = ReadAmount(csv.data, i + 2),
                        // Currency = "SEK", Is this needed?
                        Reference = ReadUtf8(csv.data, i + 3),
                    });
                }

                return rows;
            }
            finally
            {
                csv_free(ref csv);
            }
        }

        static IntPtr Field(IntPtr data, int index) => Marshal.ReadIntPtr(data, index * IntPtr.Size);

        static int ReadInt32(IntPtr data, int index) => Marshal.ReadInt32(Field(data, index));

        static string ReadUtf8(IntPtr data, int index) => Marshal.PtrToStringUTF8(Field(data, index)) ?? "";

        static decimal ReadAmount(IntPtr data, int index)
        {
            var p = Field(data, index);

            return new decimal(BitConverter.Int64BitsToDouble(Marshal.ReadInt64(p)));
        }
    }
}