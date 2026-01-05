namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Yorum/puan verme modal ekranı ViewModel
/// </summary>
public partial class ReviewModalViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IReviewService _reviewService;

    [ObservableProperty]
    private string placeId = string.Empty;

    [ObservableProperty]
    private string placeName = string.Empty;

    [ObservableProperty]
    private double overallRating = 3.0;

    [ObservableProperty]
    private double foodQualityRating = 3.0;

    [ObservableProperty]
    private double serviceQualityRating = 3.0;

    [ObservableProperty]
    private double ambianceRating = 3.0;

    [ObservableProperty]
    private double valueForMoneyRating = 3.0;

    [ObservableProperty]
    private double cleanlinessRating = 3.0;

    [ObservableProperty]
    private string comment = string.Empty;

    [ObservableProperty]
    private DateTime visitDate = DateTime.Today;

    public ObservableCollection<string> SelectedImages { get; } = new();

    public ReviewModalViewModel(INavigationService navigationService, IReviewService reviewService) 
        : base(navigationService)
    {
        _reviewService = reviewService;
        Title = "Yorum Yaz";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("PlaceId", out var placeId))
        {
            PlaceId = placeId.ToString()!;
        }

        if (query.TryGetValue("PlaceName", out var placeName))
        {
            PlaceName = placeName.ToString()!;
            Title = $"{PlaceName} - Yorum Yaz";
        }
    }

    [RelayCommand]
    private async Task SubmitReviewAsync()
    {
        if (string.IsNullOrWhiteSpace(Comment))
        {
            await Application.Current!.MainPage!.DisplayAlert("Uyarı", "Lütfen yorumunuzu yazın.", "Tamam");
            return;
        }

        await ExecuteSafelyAsync(async () =>
        {
            var createReview = new CreateReviewDto
            {
                PlaceId = PlaceId,
                Rating = OverallRating,
                Comment = Comment,
                DetailedRatings = new ReviewRatingsDto
                {
                    FoodQuality = FoodQualityRating,
                    ServiceQuality = ServiceQualityRating,
                    Ambiance = AmbianceRating,
                    ValueForMoney = ValueForMoneyRating,
                    Cleanliness = CleanlinessRating
                },
                VisitDate = VisitDate,
                ImageUrls = SelectedImages.ToList()
            };

            var review = await _reviewService.CreateReviewAsync(createReview);

            if (review != null)
            {
                await Application.Current!.MainPage!.DisplayAlert("Başarılı", "Yorumunuz başarıyla eklendi!", "Tamam");
                await NavigationService.GoBackAsync();
            }
        }, "Yorum gönderilirken bir hata oluştu.");
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        var result = await Application.Current!.MainPage!.DisplayAlert(
            "Onay", 
            "Yorumunuz kaydedilmeyecek. Çıkmak istediğinizden emin misiniz?", 
            "Evet", 
            "Hayır");

        if (result)
        {
            await NavigationService.GoBackAsync();
        }
    }

    [RelayCommand]
    private async Task AddPhotoAsync()
    {
        try
        {
            var photo = await MediaPicker.PickPhotoAsync();
            if (photo != null)
            {
                // In real app, upload the photo and get URL
                SelectedImages.Add(photo.FullPath);
            }
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Fotoğraf eklenirken bir hata oluştu.");
        }
    }

    [RelayCommand]
    private void RemovePhoto(string photoPath)
    {
        SelectedImages.Remove(photoPath);
    }
}
