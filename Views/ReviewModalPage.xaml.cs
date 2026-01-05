namespace LezzetAtlasi.Views;

public partial class ReviewModalPage : ContentPage
{
    public ReviewModalPage(ReviewModalViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
