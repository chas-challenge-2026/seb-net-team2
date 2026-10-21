using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIdempotencyResponseLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "response_location",
                table: "idempotency_keys",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "response_location",
                table: "idempotency_keys");
        }
    }
}
