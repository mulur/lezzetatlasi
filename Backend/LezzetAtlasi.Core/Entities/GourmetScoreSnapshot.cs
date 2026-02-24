namespace LezzetAtlasi.Core.Entities;

public class GourmetScoreSnapshot : BaseEntity
{
    public long GourmetId { get; set; }
    public decimal Score { get; set; }
    public int? RankId { get; set; }
    public int ReviewCount { get; set; }
    public DateTime SnapshotDate { get; set; }
    
    // Navigation properties
    public virtual GourmetProfile Gourmet { get; set; } = null!;
    public virtual GourmetRank? Rank { get; set; }
}
