/*globals $, Fraction */

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
            $('#recipelist').empty().append($('#RecipeViewTemplate').render(recipes));
            
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
            $.get('recipes', function (response) {
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
    
    var units = JSON.parse($('#units').val() || '[]');
    
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
    
    $('#EditRecipeModal')
        .on('editrecipe.load', function (e, recipe) {
            if (recipe.RecipeId) {
                $('#editrecipe-addtitle').hide();
                $('#editrecipe-edittitle').show();
            }
            else {
                $('#editrecipe-addtitle').show();
                $('#editrecipe-edittitle').hide();
            }
            
            $('#editrecipe-uniqueid').val(recipe.UniqueId || '');
            $('#editrecipe-name').prop('readonly', !!recipe.RecipeId).val(recipe.Name || '');
            $('#editrecipe-preptime').val(recipe.PrepTime || '');
            $('#editrecipe-cooktime').val(recipe.CookTime || '');
            $('#editrecipe-totaltime').val(recipe.TotalTime || '');
            $('#editrecipe-servings').val(recipe.Servings || '');
            $('#editrecipe-calories').val(recipe.Calories || '');
            $('#editrecipe-notes').val(recipe.Notes || '');
            
            $('#ingredients-empty').hide().siblings().remove();
            if (recipe.Ingredients && recipe.Ingredients.length) {
                recipe.Ingredients.forEach(function (ingredient, index) {
                    $('#ingredients').append($('#IngredientTemplate').render({
                        Ingredient: ingredient,
                        Units: units,
                        i: index
                    }));
                });
                $('#ingredients').trigger('editrecipe.reorder');
            }
            else {
                $('#ingredients-empty').show();
            }
            
            $('#directions-empty').hide().siblings().remove();
            if (recipe.Directions && recipe.Directions.length) {
                recipe.Directions.forEach(function (direction, index) {
                    $('#directions').append($('#DirectionTemplate').render({
                        Direction: direction,
                        i: index
                    }));
                });
                $('#directions').trigger('editrecipe.reorder');
            }
            else {
                $('#directions-empty').show();
            }
        })
        .on('show.bs.modal', function () {
            $('#EditRecipeSaveFailure').hide();
            $('#editrecipe').validate().resetForm();
            $('#editrecipe .has-error').removeClass('has-error');
            $('#editrecipe textarea').css('height', '');
            $('#ingredients .ingredient-section').first().trigger('focusout');
        });
    $('#editrecipe')
        .on('submit', function (e) {
            e.preventDefault();
            $('#EditRecipeSaveFailure').hide();
            if ($(this).valid()) {
                $.post(this.action, $(this).serialize(), function () {
                    Recipes.Refresh().done(function () {
                        $('#EditRecipeModal')
                            .modal('hide');
                    });
                })
                .fail(function () {
                    $('#EditRecipeSaveFailure').show();
                });
            }

            return false;
        })
        .on('change', 'input, textarea, select', function () {
            $(this).valid();
        })
        .validate();
    $('#editrecipe-addingredient')
        .on('click', function () {
            $('#ingredients-empty').hide();
            $('#ingredients')
                .append($('#IngredientTemplate').render({
                    i: $('.ingredient').length,
                    Ingredient: {
                        RecipeId: $('#editrecipe-recipeid').val()
                    },
                    Units: units
                }))
                .trigger('editrecipe.reorder');
        });
    $('#editrecipe-adddirection')
        .on('click', function () {
            $('#directions-empty').hide();
            $('#directions')
                .append($('#DirectionTemplate').render({
                    i: $('.direction').length,
                    Direction: {
                        RecipeId: $('#editrecipe-recipeid').val(),
                        Step: $('.direction').length + 1
                    }
                }))
                .trigger('editrecipe.reorder');
        });
    $('#ingredients')
        .on('editrecipe.reorder', function () {
            $('#ingredients .ingredient-recipeid').each(function (index) {
                this.name = 'recipe[Ingredients][' + index + '][RecipeId]';
            });
            $('#ingredients .ingredient-name').each(function (index) {
                this.name = 'recipe[Ingredients][' + index + '][Name]';
            });
            $('#ingredients .ingredient-unitcode').each(function (index) {
                this.name = 'recipe[Ingredients][' + index + '][UnitCode]';
            });
            $('#ingredients .ingredient-quantity').each(function (index) {
                this.name = 'recipe[Ingredients][' + index + '][Quantity]';
            });
            $('#ingredients .ingredient-section').each(function (index) {
                this.name = 'recipe[Ingredients][' + index + '][Section]';
            });
        })
        .on('focusout', '.ingredient-quantity', function () {
            if (this.value) {
                $(this).val((new Fraction (this.value)).toFraction(true));
            }
        })
        .on('focusout', '.ingredient-section', function () {
            var options = Array.from(new Set($('#ingredients .ingredient-section').map(function () {
                return this.value;
            }).toArray()));
            $('.ingredient-section-list').empty().append(options.filter(function (val) {
                return val.length > 0;
            }).map(function (val) {
                return '<option value="' + val + '" />';
            }));
        });
    $('#directions')
        .on('editrecipe.reorder', function () {
            $('#directions .direction-recipeid').each(function (index) {
                this.name = 'recipe[Directions][' + index + '][RecipeId]';
            });
            $('#directions .direction-step').each(function (index) {
                this.name = 'recipe[Directions][' + index + '][Step]';
                this.value = index + 1;
            });
            $('#directions .direction-description').each(function (index) {
                this.name = 'recipe[Directions][' + index + '][Description]';
            });
        });
    
    $('#ViewImageModal')
        .on('viewimage.load', function (e, data) {
            $('#ViewImageModalLabel').text(data.image);
            $('#viewimage')
                .prop('src', '/data/' + data.id + '/photo/' + data.image)
                .prop('alt', data.image);
        });
    
    $('#UploadImageModal')
        .on('uploadimage.load', function (e, recipe) {
            $('#uploadimage-uniqueid').val(recipe.UniqueId || '');
        })
        .on('show.bs.modal', function () {
            $('#uploadimage-progress > .progress-bar').attr('aria-valuenow', 0).css('width', '0%');
            $('#uploadimage-file').val(null);
        });
    $('#uploadimage-file')
        .change(function (e) {
            var data = new FormData();
            $.each(this.files, function (index, file) {
                data.append('file[' + index + ']', file);
            });
            
            $.ajax({
                type: 'PUT',
                url: 'data/' + $('#uploadimage-uniqueid').val() + '/photo',
                contentType: false,
                processData: false,
                cache: false,
                data: data,
                xhr: function () {
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', function (e) {
                            var percentage = Math.round((e.loaded * 100) / e.total);
                            $('#uploadimage-progress > .progress-bar').attr('aria-valuenow', percentage).css('width', percentage + '%');
                        }, false);
                    }
                    return xhr;
                },
                success: function (response) {
                    $('#uploadimage-progress > .progress-bar').attr('aria-valuenow', 100).css('width', '100%');
                    Recipes.Refresh().done(function () {
                        $('#UploadImageModal')
                            .modal('hide');
                    });
                }
            });
        });
}());