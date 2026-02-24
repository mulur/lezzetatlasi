using NetTopologySuite.Geometries;
using LezzetAtlasi.Core.Enums;

namespace LezzetAtlasi.Core.Entities;

public class Place : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public Point? Location { get; set; } // PostGIS geography point
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? Email { get; set; }
    public int? PriceRange { get; set; } // 1-4 scale
    public PlaceStatus Status { get; set; } = PlaceStatus.Active;
    public bool IsVerified { get; set; } = false;
    public long CreatedBy { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser Creator { get; set; } = null!;
    public virtual ICollection<PlacePhoto> Photos { get; set; } = new List<PlacePhoto>();
    public virtual ICollection<PlaceMenu> Menus { get; set; } = new List<PlaceMenu>();
    public virtual ICollection<PlaceRating> Ratings { get; set; } = new List<PlaceRating>();
    public virtual ICollection<PlaceComment> Comments { get; set; } = new List<PlaceComment>();
    public virtual ICollection<PlaceCategory> PlaceCategories { get; set; } = new List<PlaceCategory>();
    public virtual PlaceRatingSummary? RatingSummary { get; set; }
}
