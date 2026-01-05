namespace LezzetAtlasi.Core.Entities;

public class CommentReaction : BaseEntity
{
    public long CommentId { get; set; }
    public long UserId { get; set; }
    public string ReactionType { get; set; } = string.Empty; // "helpful", "funny", "love", etc.
    
    // Navigation properties
    public virtual PlaceComment Comment { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
}
