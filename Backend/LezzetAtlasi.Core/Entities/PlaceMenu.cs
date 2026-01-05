namespace LezzetAtlasi.Core.Entities;

public class PlaceMenu : BaseEntity
{
    public long PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual Place Place { get; set; } = null!;
    public virtual ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
}
