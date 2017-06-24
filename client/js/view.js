
(function () {
    'use strict';
    var recipe = JSON.parse($('#recipe').val() || '{}'),
        data = {};
    data[recipe.UniqueId] = [recipe];
    $('#recipeview').empty().append($('#RecipeViewTemplate').render({
        Recipes: data,
        _viewonly: true
    }));
    
    $('#recipeview')
        .on('click', '.recipe-photo', function (e) {
            e.preventDefault();
            $('#ViewImageModal')
                .trigger('viewimage.load', {
                    id: this.dataset.id,
                    image: this.dataset.image
                })
                .modal('show');
            return false;
        });
    
    $('#ViewImageModal')
        .on('viewimage.load', function (e, data) {
            $('#ViewImageModalLabel').text(data.image);
            $('#viewimage')
                .prop('src', '/data/' + data.id + '/photo/' + data.image)
                .prop('alt', data.image);
        });
}());