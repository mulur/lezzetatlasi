namespace LezzetAtlasi.Views;

public partial class PlaceDetailPage : ContentPage
{
    public PlaceDetailPage(PlaceDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
