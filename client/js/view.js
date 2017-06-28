/*globals $ */

var Recipes = (function () {
    return {
        Find: function (id) {
            id = typeof id === 'string' ? parseInt(id, 10) : id;
            var recipe = JSON.parse($('#recipe').val() || '{}');
            return recipe.RecipeId === id ? recipe : null;
        },
        
        Draw: function (recipe) {
            var data = {};
            data[recipe.UniqueId] = [recipe];
            $('#recipe').val(JSON.stringify(recipe));
            $('#recipeview').empty().append($('#RecipeViewTemplate').render({
                Recipes: data
            }));
        },
        Refresh: function () {
            var defer = $.Deferred();
            $.get('/api' + window.location.pathname, function (response) {
                $('#recipe').val(JSON.stringify(response));
                Recipes.Draw(response);
                defer.resolve();
            }).fail(function () {
                defer.reject();
            });
            return defer.promise();
        }
    };
}());

(function () {
    'use strict';
    
    Recipes.Draw(JSON.parse($('#recipe').val() || '{}'));
    
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
        })
        .on('click', '.recipe-photo-delete', function (e) {
            e.preventDefault();
            this.disabled = true;
            $.ajax({
                url: this.formAction,
                type: 'DELETE',
                success: function () {
                    Recipes.Refresh();
                }
            });
            return false;
        })
        .on('change', '.recipe-photo-primary', function () {
            $.post(this.formAction, {
                primary: this.value
            }, function () {
                Recipes.Refresh();
            });
        });
    
    $('#editrecipe')
        .on('editrecipe.done', function () {
            Recipes.Refresh().done(function () {
                $('#EditRecipeModal')
                    .modal('hide');
            });
        });
    
    $('#uploadimage-file')
        .on('uploadimage.done', function () {
            Recipes.Refresh().done(function () {
                $('#UploadImageModal')
                    .modal('hide');
            });
        });
}());