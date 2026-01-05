namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Profil ekranı ViewModel
/// Kullanıcının profil bilgilerini gösterir
/// </summary>
public partial class ProfileViewModel : BaseViewModel
{
    private readonly IUserService _userService;
    private readonly IReviewService _reviewService;
    private readonly IPlaceService _placeService;
    private readonly IAuthService _authService;

    [ObservableProperty]
    private UserDto? currentUser;

    [ObservableProperty]
    private ObservableCollection<ReviewDto> userReviews = new();

    [ObservableProperty]
    private ObservableCollection<PlaceDto> favoritePlaces = new();

    [ObservableProperty]
    private int totalReviews;

    [ObservableProperty]
    private int totalFavorites;

    public ProfileViewModel(
        INavigationService navigationService, 
        IUserService userService,
        IReviewService reviewService,
        IPlaceService placeService,
        IAuthService authService) 
        : base(navigationService)
    {
        _userService = userService;
        _reviewService = reviewService;
        _placeService = placeService;
        _authService = authService;
        Title = "Profil";
    }

    public override async Task OnAppearingAsync()
    {
        await base.OnAppearingAsync();
        await LoadProfileAsync();
    }

    [RelayCommand]
    private async Task LoadProfileAsync()
    {
        await ExecuteSafelyAsync(async () =>
        {
            var user = await _userService.GetCurrentUserProfileAsync();
            if (user != null)
            {
                CurrentUser = user;

                var reviewsTask = _reviewService.GetUserReviewsAsync(user.Id);
                var favoritesTask = _placeService.GetFavoritePlacesAsync();

                await Task.WhenAll(reviewsTask, favoritesTask);

                UserReviews = new ObservableCollection<ReviewDto>(reviewsTask.Result);
                FavoritePlaces = new ObservableCollection<PlaceDto>(favoritesTask.Result);

                TotalReviews = UserReviews.Count;
                TotalFavorites = FavoritePlaces.Count;
            }

            IsRefreshing = false;
        });
    }

    [RelayCommand]
    private async Task EditProfileAsync()
    {
        await Application.Current!.MainPage!.DisplayAlert("Bilgi", "Profil düzenleme özelliği yakında eklenecek.", "Tamam");
    }

    [RelayCommand]
    private async Task NavigateToSettingsAsync()
    {
        await NavigationService.NavigateToAsync(nameof(SettingsPage));
    }

    [RelayCommand]
    private async Task ViewReviewAsync(ReviewDto review)
    {
        if (review == null)
            return;

        var parameters = new Dictionary<string, object>
        {
            { "PlaceId", review.PlaceId }
        };

        await NavigationService.NavigateToAsync(nameof(PlaceDetailPage), parameters);
    }

    [RelayCommand]
    private async Task ViewFavoritePlaceAsync(PlaceDto place)
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
    private async Task ChangeProfilePhotoAsync()
    {
        try
        {
            var photo = await MediaPicker.PickPhotoAsync();
            if (photo != null)
            {
                // In real app, upload photo and update profile
                await _userService.UploadProfileImageAsync(photo.FullPath);
                await LoadProfileAsync();
            }
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, "Profil fotoğrafı değiştirilemedi.");
        }
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        var result = await Application.Current!.MainPage!.DisplayAlert(
            "Onay", 
            "Çıkış yapmak istediğinizden emin misiniz?", 
            "Evet", 
            "Hayır");

        if (result)
        {
            await _authService.LogoutAsync();
            await NavigationService.NavigateToAsync(nameof(LoginPage));
        }
    }
}
