namespace LezzetAtlasi.Models;

/// <summary>
/// Mekan/Restoran bilgilerini temsil eden DTO
/// </summary>
public class PlaceDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public LocationDto Location { get; set; } = new();
    public string PhoneNumber { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public List<string> CuisineTypes { get; set; } = new();
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public string PriceRange { get; set; } = string.Empty; // $, $$, $$$, $$$$
    public List<string> Features { get; set; } = new(); // WiFi, Parking, Outdoor Seating, etc.
    public WorkingHoursDto WorkingHours { get; set; } = new();
    public bool IsGourmetVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Konum bilgilerini temsil eden DTO
/// </summary>
public class LocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

/// <summary>
/// Çalışma saatleri bilgilerini temsil eden DTO
/// </summary>
public class WorkingHoursDto
{
    public DayHoursDto Monday { get; set; } = new();
    public DayHoursDto Tuesday { get; set; } = new();
    public DayHoursDto Wednesday { get; set; } = new();
    public DayHoursDto Thursday { get; set; } = new();
    public DayHoursDto Friday { get; set; } = new();
    public DayHoursDto Saturday { get; set; } = new();
    public DayHoursDto Sunday { get; set; } = new();
}

/// <summary>
/// Gün bazında çalışma saatleri
/// </summary>
public class DayHoursDto
{
    public bool IsOpen { get; set; }
    public string OpenTime { get; set; } = string.Empty; // "09:00"
    public string CloseTime { get; set; } = string.Empty; // "22:00"
}

/// <summary>
/// Mekan arama filtreleri için kullanılan DTO
/// </summary>
public class PlaceSearchFilterDto
{
    public string? SearchText { get; set; }
    public LocationDto? UserLocation { get; set; }
    public double? MaxDistance { get; set; } // km cinsinden
    public List<string> CuisineTypes { get; set; } = new();
    public string? PriceRange { get; set; }
    public double? MinRating { get; set; }
    public List<string> Features { get; set; } = new();
    public bool? IsGourmetVerified { get; set; }
}
