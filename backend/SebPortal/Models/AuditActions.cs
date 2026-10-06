namespace SebPortal.Models
{
    // Action names written to audit_entries. Keep in sync with the frontend's audit log filters.
    public static class AuditActions
    {
        // Payments
        public const string CreatePayment = "CREATE_PAYMENT";
        public const string ApproveStep = "APPROVE_STEP";
        public const string RejectStep = "REJECT_STEP";
        public const string ExecutePayment = "EXECUTE_PAYMENT";
        public const string RejectPayment = "REJECT_PAYMENT";

        // Users
        public const string CreateUser = "CREATE_USER";
        public const string UpdateUser = "UPDATE_USER";
        public const string DeleteUser = "DELETE_USER";

        // Approval limits
        public const string CreateApprovalLimit = "CREATE_APPROVAL_LIMIT";
        public const string UpdateApprovalLimit = "UPDATE_APPROVAL_LIMIT";
        public const string DeleteApprovalLimit = "DELETE_APPROVAL_LIMIT";
    }

    public static class AuditEntityTypes
    {
        public const string Payment = "payment";
        public const string User = "user";
        public const string ApprovalLimit = "approvalLimit";
    }
}
