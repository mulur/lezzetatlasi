namespace LezzetAtlasi.Services;

/// <summary>
/// Gurme servisi arayüzü
/// </summary>
public interface IGourmetService
{
    Task<GourmetDto?> GetGourmetProfileAsync(string gourmetId);
    Task<bool> ActivateGourmetAsync(GourmetActivationRequestDto request);
    Task<bool> DeactivateGourmetAsync();
    Task<GourmetDto?> GetCurrentUserGourmetProfileAsync();
    Task<List<GourmetListItemDto>> GetFeaturedGourmetsAsync();
    Task<List<GourmetListItemDto>> SearchGourmetsAsync(string searchText);
    Task<bool> FollowGourmetAsync(string gourmetId);
    Task<bool> UnfollowGourmetAsync(string gourmetId);
}

/// <summary>
/// Gurme servisi implementasyonu (Mock)
/// </summary>
public class GourmetService : IGourmetService
{
    private GourmetDto? _currentGourmet;
    private readonly List<GourmetListItemDto> _mockGourmets = new();

    public GourmetService()
    {
        InitializeMockData();
    }

    private void InitializeMockData()
    {
        _mockGourmets.AddRange(new[]
        {
            new GourmetListItemDto
            {
                Id = "1",
                DisplayName = "Chef Mehmet Özcan",
                Specializations = new List<string> { "Türk Mutfağı", "Meze" },
                FollowersCount = 1250,
                TotalReviews = 89
            },
            new GourmetListItemDto
            {
                Id = "2",
                DisplayName = "Ayşe Yılmaz",
                Specializations = new List<string> { "İtalyan Mutfağı", "Pasta" },
                FollowersCount = 2100,
                TotalReviews = 145
            }
        });
    }

    public Task<GourmetDto?> GetGourmetProfileAsync(string gourmetId)
    {
        if (_currentGourmet?.Id == gourmetId)
            return Task.FromResult(_currentGourmet);

        var gourmet = new GourmetDto
        {
            Id = gourmetId,
            UserId = "user-" + gourmetId,
            DisplayName = "Mock Gourmet",
            Bio = "Lezzet tutkunu",
            Specializations = new List<string> { "Türk Mutfağı" },
            Stats = new GourmetStatsDto
            {
                TotalReviews = 50,
                FollowersCount = 100,
                PlacesVisited = 75
            },
            Verification = new GourmetVerificationDto
            {
                IsVerified = true,
                VerificationType = "FoodCritic"
            },
            IsActive = true,
            ActivatedAt = DateTime.Now.AddMonths(-6)
        };

        return Task.FromResult<GourmetDto?>(gourmet);
    }

    public Task<bool> ActivateGourmetAsync(GourmetActivationRequestDto request)
    {
        _currentGourmet = new GourmetDto
        {
            Id = Guid.NewGuid().ToString(),
            UserId = "current-user-id",
            DisplayName = request.DisplayName,
            Bio = request.Bio,
            Specializations = request.Specializations,
            Verification = new GourmetVerificationDto
            {
                IsVerified = false,
                VerificationType = request.VerificationType
            },
            Stats = new GourmetStatsDto(),
            IsActive = true,
            ActivatedAt = DateTime.Now
        };

        return Task.FromResult(true);
    }

    public Task<bool> DeactivateGourmetAsync()
    {
        if (_currentGourmet != null)
        {
            _currentGourmet.IsActive = false;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<GourmetDto?> GetCurrentUserGourmetProfileAsync()
    {
        return Task.FromResult(_currentGourmet);
    }

    public Task<List<GourmetListItemDto>> GetFeaturedGourmetsAsync()
    {
        return Task.FromResult(_mockGourmets);
    }

    public Task<List<GourmetListItemDto>> SearchGourmetsAsync(string searchText)
    {
        var results = _mockGourmets
            .Where(g => g.DisplayName.Contains(searchText, StringComparison.OrdinalIgnoreCase))
            .ToList();
        return Task.FromResult(results);
    }

    public Task<bool> FollowGourmetAsync(string gourmetId)
    {
        var gourmet = _mockGourmets.FirstOrDefault(g => g.Id == gourmetId);
        if (gourmet != null)
        {
            gourmet.IsFollowedByCurrentUser = true;
            gourmet.FollowersCount++;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> UnfollowGourmetAsync(string gourmetId)
    {
        var gourmet = _mockGourmets.FirstOrDefault(g => g.Id == gourmetId);
        if (gourmet != null)
        {
            gourmet.IsFollowedByCurrentUser = false;
            gourmet.FollowersCount--;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}
