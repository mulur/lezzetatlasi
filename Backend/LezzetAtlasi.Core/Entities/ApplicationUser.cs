using Microsoft.AspNetCore.Identity;

namespace LezzetAtlasi.Core.Entities;

public class ApplicationUser : IdentityUser<long>
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public DateTime? EmailVerifiedAt { get; set; }
    
    // Navigation properties
    public virtual GourmetProfile? GourmetProfile { get; set; }
    public virtual ICollection<InviteCode> CreatedInviteCodes { get; set; } = new List<InviteCode>();
    public virtual ICollection<InviteCode> UsedInviteCodes { get; set; } = new List<InviteCode>();
    public virtual ICollection<Place> CreatedPlaces { get; set; } = new List<Place>();
    public virtual ICollection<PlaceRating> Ratings { get; set; } = new List<PlaceRating>();
    public virtual ICollection<PlaceComment> Comments { get; set; } = new List<PlaceComment>();
    public virtual ICollection<PlacePhoto> Photos { get; set; } = new List<PlacePhoto>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
