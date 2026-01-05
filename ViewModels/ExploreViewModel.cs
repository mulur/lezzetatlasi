namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Ana keşfet ekranı ViewModel
/// Kullanıcıların mekanları keşfettiği ana ekran
/// </summary>
public partial class ExploreViewModel : BaseViewModel
{
    private readonly IPlaceService _placeService;
    private readonly IGourmetService _gourmetService;

    [ObservableProperty]
    private string searchText = string.Empty;

    [ObservableProperty]
    private ObservableCollection<PlaceDto> places = new();

    [ObservableProperty]
    private ObservableCollection<PlaceDto> featuredPlaces = new();

    [ObservableProperty]
    private ObservableCollection<GourmetListItemDto> featuredGourmets = new();

    [ObservableProperty]
    private PlaceDto? selectedPlace;

    public ObservableCollection<string> Categories { get; } = new()
    {
        "Tümü",
        "Türk",
        "İtalyan",
        "Japon",
        "Fast Food",
        "Kahve",
        "Tatlı"
    };

    [ObservableProperty]
    private string selectedCategory = "Tümü";

    public ExploreViewModel(
        INavigationService navigationService, 
        IPlaceService placeService,
        IGourmetService gourmetService) 
        : base(navigationService)
    {
        _placeService = placeService;
        _gourmetService = gourmetService;
        Title = "Keşfet";
    }

    public override async Task OnAppearingAsync()
    {
        await base.OnAppearingAsync();
        await LoadDataAsync();
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var placesTask = _placeService.GetPlacesAsync();
            var gourmetsTask = _gourmetService.GetFeaturedGourmetsAsync();

            await Task.WhenAll(placesTask, gourmetsTask);

            Places = new ObservableCollection<PlaceDto>(placesTask.Result);
            FeaturedPlaces = new ObservableCollection<PlaceDto>(placesTask.Result.Take(5));
            FeaturedGourmets = new ObservableCollection<GourmetListItemDto>(gourmetsTask.Result);

            IsRefreshing = false;
        });
    }

    [RelayCommand]
    private async Task SearchAsync()
    {
        if (string.IsNullOrWhiteSpace(SearchText))
        {
            await LoadDataAsync();
            return;
        }

        await ExecuteSafelyAsync(async () =>
        {
            var results = await _placeService.SearchPlacesAsync(SearchText);
            Places = new ObservableCollection<PlaceDto>(results);
        });
    }

    [RelayCommand]
    private async Task SelectPlaceAsync(PlaceDto place)
    {
        if (place == null)
            return;

        var parameters = new Dictionary<string, object>
        {
            { "PlaceId", place.Id }
        };

        await NavigationService.NavigateToAsync(nameof(PlaceDetailPage), parameters);
    }

    [RelayCommand]
    private async Task SelectGourmetAsync(GourmetListItemDto gourmet)
    {
        if (gourmet == null)
            return;

        await Application.Current!.MainPage!.DisplayAlert("Bilgi", $"Gurme profili: {gourmet.DisplayName}", "Tamam");
    }

    [RelayCommand]
    private async Task FilterByCategoryAsync(string category)
    {
        SelectedCategory = category;
        
        await ExecuteSafelyAsync(async () =>
        {
            if (category == "Tümü")
            {
                var allPlaces = await _placeService.GetPlacesAsync();
                Places = new ObservableCollection<PlaceDto>(allPlaces);
            }
            else
            {
                var filter = new PlaceSearchFilterDto
                {
                    CuisineTypes = new List<string> { category }
                };
                var filteredPlaces = await _placeService.GetPlacesAsync(filter);
                Places = new ObservableCollection<PlaceDto>(filteredPlaces);
            }
        });
    }
}
