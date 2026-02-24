namespace LezzetAtlasi.Core.Entities;

public class GourmetRank
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MinScore { get; set; }
    public decimal MaxScore { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string? Benefits { get; set; } // JSON serialized benefits
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<GourmetProfile> GourmetProfiles { get; set; } = new List<GourmetProfile>();
    public virtual ICollection<GourmetScoreSnapshot> ScoreSnapshots { get; set; } = new List<GourmetScoreSnapshot>();
}
