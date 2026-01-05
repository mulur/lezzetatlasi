namespace LezzetAtlasi.Core.Entities;

public class PriceHistory : BaseEntity
{
    public long MenuItemId { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "TRY";
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public long? RecordedBy { get; set; }
    
    // Navigation properties
    public virtual MenuItem MenuItem { get; set; } = null!;
}
