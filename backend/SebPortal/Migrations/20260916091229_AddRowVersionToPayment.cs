using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SebPortal.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionToPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // xmin is PostgreSQL's built-in system column, not a real column to add.
            // EF's migration scaffolding doesn't know that and generates an AddColumn
            // that Postgres rejects ("conflicts with a system column name"), so this
            // migration is intentionally a no-op.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
