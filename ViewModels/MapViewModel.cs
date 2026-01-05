namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Harita ekranı ViewModel
/// Mekanları harita üzerinde gösterir
/// </summary>
public partial class MapViewModel : BaseViewModel
{
    private readonly IPlaceService _placeService;

    [ObservableProperty]
    private ObservableCollection<PlaceDto> nearbyPlaces = new();

    [ObservableProperty]
    private PlaceDto? selectedPlace;

    [ObservableProperty]
    private LocationDto currentLocation = new() { Latitude = 41.0082, Longitude = 28.9784 }; // Istanbul default

    [ObservableProperty]
    private double zoomLevel = 13;

    [ObservableProperty]
    private bool showPlacesList = true;

    public MapViewModel(INavigationService navigationService, IPlaceService placeService) 
        : base(navigationService)
    {
        _placeService = placeService;
        Title = "Harita";
    }

    public override async Task OnAppearingAsync()
    {
        await base.OnAppearingAsync();
        await LoadNearbyPlacesAsync();
    }

    [RelayCommand]
    private async Task LoadNearbyPlacesAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var places = await _placeService.GetNearbyPlacesAsync(CurrentLocation, 5);
            NearbyPlaces = new ObservableCollection<PlaceDto>(places);
        });
    }

    [RelayCommand]
    private async Task SelectPlaceAsync(PlaceDto place)
    {
        if (place == null)
            return;

        SelectedPlace = place;

        var parameters = new Dictionary<string, object>
        {
            { "PlaceId", place.Id }
        };

        await NavigationService.NavigateToAsync(nameof(PlaceDetailPage), parameters);
    }

    [RelayCommand]
    private async Task CenterOnCurrentLocationAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            // In real app, get actual GPS location
            // For now, use default Istanbul location
            CurrentLocation = new LocationDto { Latitude = 41.0082, Longitude = 28.9784 };
            await LoadNearbyPlacesAsync();
        });
    }

    [RelayCommand]
    private void TogglePlacesList()
    {
        ShowPlacesList = !ShowPlacesList;
    }

    [RelayCommand]
    private void ZoomIn()
    {
        if (ZoomLevel < 20)
            ZoomLevel++;
    }

    [RelayCommand]
    private void ZoomOut()
    {
        if (ZoomLevel > 1)
            ZoomLevel--;
    }
}
