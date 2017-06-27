/*globals $, Fraction */

(function () {
    'use strict';
    
    var units = JSON.parse($('#units').val() || '[]');
    
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
                $('#editrecipe-ingredients').val(recipe.Ingredients.length);
                $('#ingredients').trigger('editrecipe.reorder');
            }
            else {
                $('#ingredients-empty').show();
                $('#editrecipe-ingredients').val('');
            }
            
            $('#directions-empty').hide().siblings().remove();
            if (recipe.Directions && recipe.Directions.length) {
                recipe.Directions.forEach(function (direction, index) {
                    $('#directions').append($('#DirectionTemplate').render({
                        Direction: direction,
                        i: index
                    }));
                });
                $('#editrecipe-directions').val(recipe.Directions.length);
                $('#directions').trigger('editrecipe.reorder');
            }
            else {
                $('#directions-empty').show();
                $('#editrecipe-directions').val('');
            }
        })
        .on('show.bs.modal', function () {
            $('#EditRecipeSaveFailure').hide();
            $('#editrecipe').validate().resetForm();
            $('#editrecipe .has-error').removeClass('has-error');
            $('#editrecipe textarea').css('height', '');
            $('#ingredients .ingredient-section').first().trigger('focusout');
            $('#EditRecipeModal').find('button[type=submit], button[data-dismiss=modal]').prop('disabled', false);
        });
    $('#editrecipe')
        .on('submit', function (e) {
            e.preventDefault();
            $('#EditRecipeSaveFailure').hide();
            if ($(this).valid()) {
                $('#EditRecipeModal').find('button[type=submit], button[data-dismiss=modal]').prop('disabled', true);
                $.post(this.action, $(this).serialize(), function () {
                    $('#editrecipe').trigger('editrecipe.done');
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
    $('#editrecipe-ingredients')
        .on('change', function () {
            var len = $('#ingredients .ingredient').length,
                mod = (parseInt(this.value, 10) || 0) - len;
            if (mod > 0) {
                $('#ingredients-empty').hide();
                for (var i = 0; i < mod; i++) {
                    $('#ingredients')
                        .append($('#IngredientTemplate').render({
                            i: len + i,
                            Ingredient: {
                                RecipeId: $('#editrecipe-recipeid').val()
                            },
                            Units: units
                        }));
                }
            }
            else if (mod < 0) {
                $($('#ingredients .ingredient').get().reverse().slice(0, Math.abs(mod))).remove();
            }
            
            $('#ingredients').trigger('editrecipe.reorder');
        });
    $('#editrecipe-directions')
        .on('change', function () {
            var len = $('#directions .direction').length,
                mod = (parseInt(this.value, 10) || 0) - len;
            if (mod > 0) {
                $('#directions-empty').hide();
                for (var i = 0; i < mod; i++) {
                    $('#directions')
                        .append($('#DirectionTemplate').render({
                            i: len + i,
                            Direction: {
                                RecipeId: $('#editrecipe-recipeid').val(),
                                Step: len + i + 1
                            }
                        }));
                }
            }
            else if (mod < 0) {
                $($('#directions .direction').get().reverse().slice(0, Math.abs(mod))).remove();
            }
            
            $('#directions').trigger('editrecipe.reorder');
        });
    $('#ingredients')
        .on('editrecipe.reorder', function () {
            if ($('.ingredient').length < 1) {
                $('#ingredients-empty').show();
            }

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
                $(this).val((new Fraction(this.value)).toFraction(true));
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
            if ($('.direction').length < 1) {
                $('#directions-empty').show();
            }
            
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
}());