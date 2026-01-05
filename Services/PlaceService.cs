namespace LezzetAtlasi.Services;

/// <summary>
/// Mekan servisi arayüzü
/// </summary>
public interface IPlaceService
{
    Task<List<PlaceDto>> GetPlacesAsync(PlaceSearchFilterDto? filter = null);
    Task<PlaceDto?> GetPlaceByIdAsync(string placeId);
    Task<List<PlaceDto>> GetNearbyPlacesAsync(LocationDto location, double radiusKm = 5);
    Task<List<PlaceDto>> SearchPlacesAsync(string searchText);
    Task<bool> AddToFavoritesAsync(string placeId);
    Task<bool> RemoveFromFavoritesAsync(string placeId);
    Task<List<PlaceDto>> GetFavoritePlacesAsync();
}

/// <summary>
/// Mekan servisi implementasyonu (Mock)
/// </summary>
public class PlaceService : IPlaceService
{
    private readonly List<PlaceDto> _mockPlaces = new();

    public PlaceService()
    {
        // Initialize with mock data
        InitializeMockData();
    }

    private void InitializeMockData()
    {
        _mockPlaces.AddRange(new[]
        {
            new PlaceDto
            {
                Id = "1",
                Name = "Meze Lokantası",
                Description = "Geleneksel Türk mutfağı ve mezeleri",
                Address = "Asmalımescit Mahallesi, İstanbul",
                City = "İstanbul",
                District = "Beyoğlu",
                Location = new LocationDto { Latitude = 41.0311, Longitude = 28.9749 },
                CuisineTypes = new List<string> { "Türk", "Meze" },
                AverageRating = 4.5,
                TotalReviews = 150,
                PriceRange = "$$",
                IsGourmetVerified = true
            },
            new PlaceDto
            {
                Id = "2",
                Name = "Pizza Napoli",
                Description = "Otantik İtalyan pizzası",
                Address = "Nişantaşı, İstanbul",
                City = "İstanbul",
                District = "Şişli",
                Location = new LocationDto { Latitude = 41.0461, Longitude = 28.9940 },
                CuisineTypes = new List<string> { "İtalyan", "Pizza" },
                AverageRating = 4.7,
                TotalReviews = 230,
                PriceRange = "$$$",
                IsGourmetVerified = true
            }
        });
    }

    public Task<List<PlaceDto>> GetPlacesAsync(PlaceSearchFilterDto? filter = null)
    {
        return Task.FromResult(_mockPlaces);
    }

    public Task<PlaceDto?> GetPlaceByIdAsync(string placeId)
    {
        var place = _mockPlaces.FirstOrDefault(p => p.Id == placeId);
        return Task.FromResult(place);
    }

    public Task<List<PlaceDto>> GetNearbyPlacesAsync(LocationDto location, double radiusKm = 5)
    {
        return Task.FromResult(_mockPlaces);
    }

    public Task<List<PlaceDto>> SearchPlacesAsync(string searchText)
    {
        var results = _mockPlaces
            .Where(p => p.Name.Contains(searchText, StringComparison.OrdinalIgnoreCase))
            .ToList();
        return Task.FromResult(results);
    }

    public Task<bool> AddToFavoritesAsync(string placeId)
    {
        return Task.FromResult(true);
    }

    public Task<bool> RemoveFromFavoritesAsync(string placeId)
    {
        return Task.FromResult(true);
    }

    public Task<List<PlaceDto>> GetFavoritePlacesAsync()
    {
        return Task.FromResult(_mockPlaces.Take(1).ToList());
    }
}
