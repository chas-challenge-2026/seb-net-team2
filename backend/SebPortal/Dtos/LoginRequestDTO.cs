using System.ComponentModel.DataAnnotations;

namespace SebPortal.Api.Dtos
{
    public class LoginRequestDTO
    {
        [Required(ErrorMessage = "E-postadress är obligatorisk.")]
        [EmailAddress(ErrorMessage = "Ogiltigt e-postformat.")]
        public string Email { get; set; } = "";
        [Required(ErrorMessage = "Lösenord är obligatoriskt.")]
        public string Password { get; set; } = "";

    }
}
