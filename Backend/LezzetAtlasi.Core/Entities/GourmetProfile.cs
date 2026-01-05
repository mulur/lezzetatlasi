namespace LezzetAtlasi.Core.Entities;

public class GourmetProfile : BaseEntity
{
    public long UserId { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public int TotalReviews { get; set; } = 0;
    public int? CurrentRankId { get; set; }
    public decimal TotalScore { get; set; } = 0;
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual GourmetRank? CurrentRank { get; set; }
    public virtual ICollection<GourmetScoreSnapshot> ScoreSnapshots { get; set; } = new List<GourmetScoreSnapshot>();
}
