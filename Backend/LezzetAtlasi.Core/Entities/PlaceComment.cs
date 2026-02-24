namespace LezzetAtlasi.Core.Entities;

public class PlaceComment : BaseEntity
{
    public long PlaceId { get; set; }
    public long UserId { get; set; }
    public long? RatingId { get; set; }
    public string CommentText { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = true;
    public bool IsFlagged { get; set; } = false;
    
    // Navigation properties
    public virtual Place Place { get; set; } = null!;
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual PlaceRating? Rating { get; set; }
    public virtual ICollection<CommentReaction> Reactions { get; set; } = new List<CommentReaction>();
}
