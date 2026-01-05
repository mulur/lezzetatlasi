namespace LezzetAtlasi.Core.Entities;

public class ApplicationRole : Microsoft.AspNetCore.Identity.IdentityRole<long>
{
    public ApplicationRole() : base()
    {
    }

    public ApplicationRole(string roleName) : base(roleName)
    {
    }
}
