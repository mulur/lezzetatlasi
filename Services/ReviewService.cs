namespace LezzetAtlasi.Services;

/// <summary>
/// Yorum servisi arayüzü
/// </summary>
public interface IReviewService
{
    Task<List<ReviewDto>> GetPlaceReviewsAsync(string placeId);
    Task<ReviewDto?> GetReviewByIdAsync(string reviewId);
    Task<ReviewDto> CreateReviewAsync(CreateReviewDto createReview);
    Task<ReviewDto> UpdateReviewAsync(string reviewId, CreateReviewDto updateReview);
    Task<bool> DeleteReviewAsync(string reviewId);
    Task<bool> LikeReviewAsync(string reviewId);
    Task<bool> UnlikeReviewAsync(string reviewId);
    Task<List<ReviewDto>> GetUserReviewsAsync(string userId);
}

/// <summary>
/// Yorum servisi implementasyonu (Mock)
/// </summary>
public class ReviewService : IReviewService
{
    private readonly List<ReviewDto> _mockReviews = new();

    public ReviewService()
    {
        InitializeMockData();
    }

    private void InitializeMockData()
    {
        _mockReviews.AddRange(new[]
        {
            new ReviewDto
            {
                Id = "1",
                PlaceId = "1",
                UserId = "user1",
                UserName = "Ahmet Yılmaz",
                IsGourmetReview = true,
                Rating = 4.5,
                Comment = "Harika bir mekan, mezeler çok lezzetliydi!",
                DetailedRatings = new ReviewRatingsDto
                {
                    FoodQuality = 5.0,
                    ServiceQuality = 4.0,
                    Ambiance = 4.5,
                    ValueForMoney = 4.0,
                    Cleanliness = 5.0
                },
                VisitDate = DateTime.Now.AddDays(-7),
                CreatedAt = DateTime.Now.AddDays(-6),
                LikesCount = 15
            }
        });
    }

    public Task<List<ReviewDto>> GetPlaceReviewsAsync(string placeId)
    {
        var reviews = _mockReviews.Where(r => r.PlaceId == placeId).ToList();
        return Task.FromResult(reviews);
    }

    public Task<ReviewDto?> GetReviewByIdAsync(string reviewId)
    {
        var review = _mockReviews.FirstOrDefault(r => r.Id == reviewId);
        return Task.FromResult(review);
    }

    public Task<ReviewDto> CreateReviewAsync(CreateReviewDto createReview)
    {
        var review = new ReviewDto
        {
            Id = Guid.NewGuid().ToString(),
            PlaceId = createReview.PlaceId,
            UserId = "current-user",
            UserName = "Current User",
            Rating = createReview.Rating,
            Comment = createReview.Comment,
            ImageUrls = createReview.ImageUrls,
            DetailedRatings = createReview.DetailedRatings,
            VisitDate = createReview.VisitDate,
            CreatedAt = DateTime.Now
        };

        _mockReviews.Add(review);
        return Task.FromResult(review);
    }

    public Task<ReviewDto> UpdateReviewAsync(string reviewId, CreateReviewDto updateReview)
    {
        var review = _mockReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            review.Rating = updateReview.Rating;
            review.Comment = updateReview.Comment;
            review.ImageUrls = updateReview.ImageUrls;
            review.DetailedRatings = updateReview.DetailedRatings;
            review.UpdatedAt = DateTime.Now;
        }
        return Task.FromResult(review!);
    }

    public Task<bool> DeleteReviewAsync(string reviewId)
    {
        var review = _mockReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            _mockReviews.Remove(review);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> LikeReviewAsync(string reviewId)
    {
        var review = _mockReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            review.LikesCount++;
            review.IsLikedByCurrentUser = true;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> UnlikeReviewAsync(string reviewId)
    {
        var review = _mockReviews.FirstOrDefault(r => r.Id == reviewId);
        if (review != null)
        {
            review.LikesCount--;
            review.IsLikedByCurrentUser = false;
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<List<ReviewDto>> GetUserReviewsAsync(string userId)
    {
        var reviews = _mockReviews.Where(r => r.UserId == userId).ToList();
        return Task.FromResult(reviews);
    }
}
