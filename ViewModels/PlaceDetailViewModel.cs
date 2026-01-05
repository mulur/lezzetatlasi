namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Mekan detay ekranı ViewModel
/// Seçilen mekanın tüm detaylarını gösterir
/// </summary>
public partial class PlaceDetailViewModel : BaseViewModel, IQueryAttributable
{
    private readonly IPlaceService _placeService;
    private readonly IReviewService _reviewService;

    [ObservableProperty]
    private PlaceDto? place;

    [ObservableProperty]
    private ObservableCollection<ReviewDto> reviews = new();

    [ObservableProperty]
    private bool isFavorite;

    [ObservableProperty]
    private int selectedImageIndex;

    [ObservableProperty]
    private string selectedTab = "Bilgi";

    public ObservableCollection<string> Tabs { get; } = new()
    {
        "Bilgi",
        "Yorumlar",
        "Fotoğraflar",
        "Konum"
    };

    public PlaceDetailViewModel(
        INavigationService navigationService, 
        IPlaceService placeService,
        IReviewService reviewService) 
        : base(navigationService)
    {
        _placeService = placeService;
        _reviewService = reviewService;
        Title = "Mekan Detayı";
    }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        if (query.TryGetValue("PlaceId", out var placeId))
        {
            LoadPlaceDetailsAsync(placeId.ToString()!).ConfigureAwait(false);
        }
    }

    private async Task LoadPlaceDetailsAsync(string placeId)
    {
        await ExecuteSafelyAsync(async () =>
        {
            var placeTask = _placeService.GetPlaceByIdAsync(placeId);
            var reviewsTask = _reviewService.GetPlaceReviewsAsync(placeId);

            await Task.WhenAll(placeTask, reviewsTask);

            Place = placeTask.Result;
            Reviews = new ObservableCollection<ReviewDto>(reviewsTask.Result);

            if (Place != null)
            {
                Title = Place.Name;
            }
        });
    }

    [RelayCommand]
    private async Task ToggleFavoriteAsync()
    {
        if (Place == null)
            return;

        await ExecuteSafelyAsync(async () =>
        {
            if (IsFavorite)
            {
                await _placeService.RemoveFromFavoritesAsync(Place.Id);
                IsFavorite = false;
            }
            else
            {
                await _placeService.AddToFavoritesAsync(Place.Id);
                IsFavorite = true;
            }
        });
    }

    [RelayCommand]
    private async Task WriteReviewAsync()
    {
        if (Place == null)
            return;

        var parameters = new Dictionary<string, object>
        {
            { "PlaceId", Place.Id },
            { "PlaceName", Place.Name }
        };

        await NavigationService.NavigateToAsync(nameof(ReviewModalPage), parameters);
    }

    [RelayCommand]
    private async Task CallPlaceAsync()
    {
        if (Place == null || string.IsNullOrWhiteSpace(Place.PhoneNumber))
            return;

        try
        {
            PhoneDialer.Open(Place.PhoneNumber);
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Telefon araması başlatılamadı.");
        }
    }

    [RelayCommand]
    private async Task OpenWebsiteAsync()
    {
        if (Place == null || string.IsNullOrWhiteSpace(Place.Website))
            return;

        try
        {
            await Browser.OpenAsync(Place.Website, BrowserLaunchMode.SystemPreferred);
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Web sitesi açılamadı.");
        }
    }

    [RelayCommand]
    private async Task GetDirectionsAsync()
    {
        if (Place == null)
            return;

        try
        {
            var location = new Location(Place.Location.Latitude, Place.Location.Longitude);
            var options = new MapLaunchOptions { Name = Place.Name };
            await Map.OpenAsync(location, options);
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Harita açılamadı.");
        }
    }

    [RelayCommand]
    private async Task SharePlaceAsync()
    {
        if (Place == null)
            return;

        try
        {
            await Share.RequestAsync(new ShareTextRequest
            {
                Text = $"{Place.Name} - {Place.Address}",
                Title = "Mekan Paylaş"
            });
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Paylaşım başarısız oldu.");
        }
    }

    [RelayCommand]
    private void SelectTab(string tab)
    {
        SelectedTab = tab;
    }
}
