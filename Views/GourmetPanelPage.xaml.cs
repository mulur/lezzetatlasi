namespace LezzetAtlasi.Views;

public partial class GourmetPanelPage : ContentPage
{
    public GourmetPanelPage(GourmetPanelViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        if (BindingContext is BaseViewModel viewModel)
        {
            await viewModel.OnAppearingAsync();
        }
    }
}
