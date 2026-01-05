namespace LezzetAtlasi.Core.Entities;

public class InviteCode : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public long CreatedBy { get; set; }
    public long? UsedBy { get; set; }
    public DateTime? UsedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public int MaxUses { get; set; } = 1;
    public int CurrentUses { get; set; } = 0;
    
    // Navigation properties
    public virtual ApplicationUser Creator { get; set; } = null!;
    public virtual ApplicationUser? User { get; set; }
}
