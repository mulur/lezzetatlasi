namespace LezzetAtlasi.Core.Entities;

public class MenuItem : BaseEntity
{
    public long MenuId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "TRY";
    public int DisplayOrder { get; set; } = 0;
    public bool IsAvailable { get; set; } = true;
    
    // Navigation properties
    public virtual PlaceMenu Menu { get; set; } = null!;
    public virtual ICollection<PriceHistory> PriceHistory { get; set; } = new List<PriceHistory>();
}
