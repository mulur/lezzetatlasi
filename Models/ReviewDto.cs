namespace LezzetAtlasi.Models;

/// <summary>
/// Yorum/değerlendirme bilgilerini temsil eden DTO
/// </summary>
public class ReviewDto
{
    public string Id { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserProfileImageUrl { get; set; } = string.Empty;
    public bool IsGourmetReview { get; set; }
    public double Rating { get; set; } // 1-5 arası
    public string Comment { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public ReviewRatingsDto DetailedRatings { get; set; } = new();
    public DateTime VisitDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int LikesCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public List<ReviewReplyDto> Replies { get; set; } = new();
}

/// <summary>
/// Detaylı değerlendirme puanları
/// </summary>
public class ReviewRatingsDto
{
    public double FoodQuality { get; set; } // Yemek kalitesi
    public double ServiceQuality { get; set; } // Servis kalitesi
    public double Ambiance { get; set; } // Atmosfer
    public double ValueForMoney { get; set; } // Fiyat/performans
    public double Cleanliness { get; set; } // Temizlik
}

/// <summary>
/// Yoruma verilen cevap DTO
/// </summary>
public class ReviewReplyDto
{
    public string Id { get; set; } = string.Empty;
    public string ReviewId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsOwnerReply { get; set; } // Mekan sahibi mi cevap vermiş
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Yorum oluşturma/güncelleme için kullanılan DTO
/// </summary>
public class CreateReviewDto
{
    public string PlaceId { get; set; } = string.Empty;
    public double Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public ReviewRatingsDto DetailedRatings { get; set; } = new();
    public DateTime VisitDate { get; set; }
}
