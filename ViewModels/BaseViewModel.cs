namespace LezzetAtlasi.ViewModels;

/// <summary>
/// Tüm ViewModel'ların türeyeceği temel sınıf
/// CommunityToolkit.Mvvm'den ObservableObject kullanıyor
/// </summary>
public partial class BaseViewModel : ObservableObject
{
    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private string title = string.Empty;

    [ObservableProperty]
    private bool isRefreshing;

    protected INavigationService NavigationService { get; }

    public BaseViewModel(INavigationService navigationService)
    {
        NavigationService = navigationService;
    }

    /// <summary>
    /// Async komutları güvenli bir şekilde çalıştırmak için yardımcı metot
    /// </summary>
    protected async Task ExecuteSafelyAsync(Func<Task> operation, string? errorMessage = null)
    {
        if (IsBusy)
            return;

        try
        {
            IsBusy = true;
            await operation();
        }
        catch (Exception ex)
        {
            await HandleErrorAsync(ex, errorMessage);
        }
        finally
        {
            IsBusy = false;
        }
    }

    /// <summary>
    /// Hata yönetimi için sanal metot
    /// </summary>
    protected virtual async Task HandleErrorAsync(Exception exception, string? customMessage = null)
    {
        var message = customMessage ?? "Bir hata oluştu. Lütfen tekrar deneyin.";
        await Application.Current!.MainPage!.DisplayAlert("Hata", message, "Tamam");
        
        // Log the error
        System.Diagnostics.Debug.WriteLine($"Error: {exception.Message}");
        System.Diagnostics.Debug.WriteLine($"StackTrace: {exception.StackTrace}");
    }

    /// <summary>
    /// Sayfa görünür olduğunda çağrılır
    /// </summary>
    public virtual Task OnAppearingAsync()
    {
        return Task.CompletedTask;
    }

    /// <summary>
    /// Sayfa görünmez olduğunda çağrılır
    /// </summary>
    public virtual Task OnDisappearingAsync()
    {
        return Task.CompletedTask;
    }
}
