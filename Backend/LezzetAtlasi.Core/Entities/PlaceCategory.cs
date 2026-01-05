namespace LezzetAtlasi.Core.Entities;

public class PlaceCategory
{
    public long PlaceId { get; set; }
    public long CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Place Place { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
}
