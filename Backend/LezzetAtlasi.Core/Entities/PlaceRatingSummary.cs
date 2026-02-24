namespace LezzetAtlasi.Core.Entities;

public class PlaceRatingSummary
{
    public long PlaceId { get; set; }
    
    // Overall statistics
    public decimal AverageRating { get; set; }
    public int TotalRatings { get; set; }
    
    // User ratings
    public decimal AverageUserRating { get; set; }
    public int TotalUserRatings { get; set; }
    
    // Gourmet ratings
    public decimal AverageGourmetRating { get; set; }
    public int TotalGourmetRatings { get; set; }
    
    // Detailed gourmet ratings averages
    public decimal? AverageFoodQuality { get; set; }
    public decimal? AveragePresentation { get; set; }
    public decimal? AverageService { get; set; }
    public decimal? AverageAmbiance { get; set; }
    public decimal? AverageValue { get; set; }
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation property
    public virtual Place Place { get; set; } = null!;
}
