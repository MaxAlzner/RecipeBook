/*globals $ */

var Recipes = (function () {
    'use strict';
    return {
        Find: function (id) {
            id = typeof id === 'string' ? parseInt(id, 10) : id;
            var recipes = JSON.parse($('#recipes').val() || '[]'), recipe;
            Object.values(recipes).forEach(function (group) {
                recipe = recipe || group.find(function (recipe) {
                    return recipe.RecipeId === id;
                });
            });
            return recipe;
        },
        
        Draw: function (recipes) {
            var alpha = {};
            Object.values(JSON.parse($('#recipes').val() || '[]'))
                .reduce(function (acc, val) { return acc.concat(val); }, [])
                .forEach(function (recipe) {
                    var ch = recipe.Name.toUpperCase().charAt(0);
                    ch = !!ch.match(/[A-Z]/i) ? ch : '#';
                    if (alpha[ch] === undefined) {
                        alpha[ch] = recipe.UniqueId;
                    }
                });
            
            $('#recipes').val(JSON.stringify(recipes));
            $('#recipelist').empty().append($('#RecipeViewTemplate').render({
                Recipes: recipes
            }));
            
            $('#pager li').addClass('disabled');
            $('#pager [data-group]').removeAttr('data-group');
            for (var ch in alpha) {
                $('#pager li > a[data-char="' + ch + '"]')
                    .attr('data-group', alpha[ch])
                    .parent()
                    .removeClass('disabled');
            }
        },
        Refresh: function () {
            var defer = $.Deferred();
            $.get('/api/recipes', function (response) {
                $('#recipes').val(JSON.stringify(response));
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
    
    Recipes.Draw(JSON.parse($('#recipes').val() || '[]'));
    
    $(window)
        .on('scroll', function (e) {
            var element = $('.recipe:visible').filter(function () {
                return $(this).offset().top >= window.pageYOffset;
            })
            .toArray()
            .sort(function (a, b) {
                return $(a).offset().top - $(b).offset().top;
            })[0];
            var highlight = $(element).attr('data-name').toUpperCase().charAt(0);
            $('#pager li.active').removeClass('active');
            $('#pager li > a[data-char="' + highlight + '"]').parent().addClass('active');
        })
        .trigger('scroll');
    
    $('#pager')
        .on('click', 'a', function (e) {
            e.preventDefault();
            var group = $(this).attr('data-group');
            if (group) {
                $('html, body').animate({
                    scrollTop: $('#recipelist [data-group="' + group + '"]').position().top
                }, 500);
            }
            return false;
        });
    
    $('#recipelist')
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