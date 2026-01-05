using LezzetAtlasi.Core.Enums;

namespace LezzetAtlasi.Core.Entities;

public class PlaceRating : BaseEntity
{
    public long PlaceId { get; set; }
    public long UserId { get; set; }
    public decimal Rating { get; set; } // 1.0 - 5.0
    public bool IsGourmet { get; set; } = false;
    
    // Gourmet-specific ratings (nullable for normal users)
    public decimal? FoodQualityRating { get; set; }
    public decimal? PresentationRating { get; set; }
    public decimal? ServiceRating { get; set; }
    public decimal? AmbianceRating { get; set; }
    public decimal? ValueRating { get; set; }
    
    public string? Title { get; set; }
    public string? ReviewText { get; set; }
    public DateTime? VisitDate { get; set; }
    public RatingStatus Status { get; set; } = RatingStatus.Approved;
    public bool IsVerifiedVisit { get; set; } = false;
    public int HelpfulCount { get; set; } = 0;
    public int SpamCount { get; set; } = 0;
    
    // Navigation properties
    public virtual Place Place { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual PlaceComment? Comment { get; set; }
}
