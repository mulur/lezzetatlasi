namespace LezzetAtlasi.Models;

/// <summary>
/// Gurme kullanıcı bilgilerini temsil eden DTO
/// </summary>
public class GourmetDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty;
    public List<string> Specializations { get; set; } = new(); // İtalyan mutfağı, Asya mutfağı, vb.
    public GourmetStatsDto Stats { get; set; } = new();
    public GourmetVerificationDto Verification { get; set; } = new();
    public DateTime ActivatedAt { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Gurme istatistikleri
/// </summary>
public class GourmetStatsDto
{
    public int TotalReviews { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int PlacesVisited { get; set; }
    public double AverageRating { get; set; }
    public int HelpfulVotes { get; set; } // Yorumlarına gelen yararlı oyları
}

/// <summary>
/// Gurme doğrulama bilgileri
/// </summary>
public class GourmetVerificationDto
{
    public bool IsVerified { get; set; }
    public string VerificationType { get; set; } = string.Empty; // Chef, FoodCritic, FoodBlogger, etc.
    public DateTime? VerifiedAt { get; set; }
    public List<string> Credentials { get; set; } = new(); // Sertifikalar, ödüller, vb.
}

/// <summary>
/// Gurme aktivasyon başvurusu DTO
/// </summary>
public class GourmetActivationRequestDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public List<string> Specializations { get; set; } = new();
    public string VerificationType { get; set; } = string.Empty;
    public List<string> CredentialUrls { get; set; } = new(); // Sertifika/referans belge URL'leri
    public string ExperienceDescription { get; set; } = string.Empty;
}

/// <summary>
/// Gurme listesi item DTO (keşfet/arama için)
/// </summary>
public class GourmetListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty;
    public List<string> Specializations { get; set; } = new();
    public int FollowersCount { get; set; }
    public int TotalReviews { get; set; }
    public bool IsFollowedByCurrentUser { get; set; }
}
