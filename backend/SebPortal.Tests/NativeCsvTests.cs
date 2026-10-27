using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SebPortal.Api.Controllers;
using SebPortal.Api.Repositories;
using SebPortal.Api.Services;
using SebPortal.Csv;

namespace SebPortal.Tests;

public class NativeCsvTests
{
    [Fact]
    public void Parse_ExampleBatch_ReturnsThreePayments()
    {
        var bytes = File.ReadAllBytes(RepoFile(Path.Combine("shared", "example-batch.csv")));

        var rows = NativeCsv.Parse(bytes);

        Assert.Equal(3, rows.Count);
        Assert.Equal(1, rows[0].FromAccountId);
        Assert.Equal("SE8550000000054910000003", rows[0].ToIban);
        Assert.Equal(5000.00m, rows[0].Amount);
        Assert.Equal("Faktura #2001", rows[0].Reference);

        Assert.Equal(1, rows[1].FromAccountId);
        Assert.Equal("SE8550000000054910000005", rows[1].ToIban);
        Assert.Equal(12500.00m, rows[1].Amount);
        Assert.Equal("Faktura #2002", rows[1].Reference);

        Assert.Equal(1, rows[2].FromAccountId);
        Assert.Equal("SE8550000000054910000006", rows[2].ToIban);
        Assert.Equal(8750.50m, rows[2].Amount);
        Assert.Equal("Faktura #2003", rows[2].Reference);
    }

    [Fact]
    public void Parse_UnclosedQuote_ThrowsReadableParseError()
    {
        var ex = Assert.Throws<InvalidDataException>(() =>
            NativeCsv.Parse(Encoding.UTF8.GetBytes("\"unterminated")));

        Assert.Equal("CSV could not parse, CSV is not formatted correctly", ex.Message);
    }

    [Fact]
    public void Parse_WrongColumnCount_ThrowsColumnMessage()
    {
        const string csv = "from_account_id,to_iban,amount,reference\n1,SE8550000000054910000003,5000.00\n";

        var ex = Assert.Throws<InvalidDataException>(() =>
            NativeCsv.Parse(Encoding.UTF8.GetBytes(csv)));

        Assert.Equal("Expected a header and 4 columns per row.", ex.Message);
    }

    [Fact]
    public async Task Upload_UnclosedQuote_ReturnsReadableBadRequest()
    {
        var result = await Upload("\"unterminated");

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("CSV could not parse, CSV is not formatted correctly", badRequest.Value);
    }

    [Fact]
    public async Task Upload_WrongColumnCount_ReturnsColumnMessage()
    {
        var result = await Upload("from_account_id,to_iban,amount,reference\n1,SE8550000000054910000003,5000.00\n");

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Expected a header and 4 columns per row.", badRequest.Value);
    }

    private static async Task<IActionResult> Upload(string csv)
    {
        var bytes = Encoding.UTF8.GetBytes(csv);
        await using var stream = new MemoryStream(bytes);
        var file = new FormFile(stream, 0, bytes.Length, "file", "batch.csv");
        var controller = new PaymentBatchController(
            new Mock<ICreatePaymentService>().Object,
            new Mock<IAccountRepository>().Object);

        return await controller.Upload(file, CancellationToken.None);
    }

    private static string RepoFile(string relativePath)
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, relativePath);
            if (File.Exists(candidate))
                return candidate;
            dir = dir.Parent;
        }

        throw new FileNotFoundException($"Could not find {relativePath} from {AppContext.BaseDirectory}.");
    }
}
