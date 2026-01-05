namespace LezzetAtlasi.Services;

/// <summary>
/// Sayfa navigasyonu için servis arayüzü
/// </summary>
public interface INavigationService
{
    Task NavigateToAsync(string route, IDictionary<string, object>? parameters = null);
    Task GoBackAsync();
    Task NavigateToRootAsync();
}

/// <summary>
/// Navigasyon servisi implementasyonu
/// </summary>
public class NavigationService : INavigationService
{
    public Task NavigateToAsync(string route, IDictionary<string, object>? parameters = null)
    {
        return parameters == null
            ? Shell.Current.GoToAsync(route)
            : Shell.Current.GoToAsync(route, parameters);
    }

    public Task GoBackAsync()
    {
        return Shell.Current.GoToAsync("..");
    }

    public Task NavigateToRootAsync()
    {
        return Shell.Current.GoToAsync("//");
    }
}
