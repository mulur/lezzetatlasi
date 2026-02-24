namespace LezzetAtlasi.Core.Entities;

public class PlacePhoto : BaseEntity
{
    public long PlaceId { get; set; }
    public long UserId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? Caption { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsCover { get; set; } = false;
    public bool IsApproved { get; set; } = true;
    
    // Navigation properties
    public virtual Place Place { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
}
