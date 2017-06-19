/*globals $ */

var Recipes = [];

(function () {
    'use strict';
    
    var recipes = JSON.parse($('#recipes').val() || '[]');
    var units = JSON.parse($('#units').val() || '[]');
    recipes.forEach(function (recipe) {
        Recipes[recipe.RecipeId] = recipe;
    });
    
    $('[data-recipe]').not(':first-child').find('.collapse').removeClass('in');
    
    $.validator.setDefaults({
        debug: true,
        ignore: '.ignore',
        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function (element) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorElement: 'div',
        errorClass: 'help-block',
        focusInvalid: false,
        errorPlacement: function (error, element) {
            if (element.parent('.input-group').length) {
                error.insertAfter(element.parent());
            }
            else {
                error.insertAfter(element);
            }
        },
        invalidHandler: function (form, validator) {
            if (!validator.numberOfInvalids()) {
                return;
            }

            var top = $(validator.errorList[0].element).closest('.form-group').offset().top || 0;
            if (top >= window.innerHeight - 200 || top < 0) {
                $('.modal, body').animate({
                    scrollTop: Math.max(top - 20, 0)
                }, 500);
            }
        }
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
            
            // $('#editrecipe-recipeid').val(recipe.RecipeId || '');
            $('#editrecipe-uniqueid').val(recipe.UniqueId || '');
            $('#editrecipe-name').val(recipe.Name || '');
            $('#editrecipe-preptime').val(recipe.PrepTime || '');
            $('#editrecipe-cooktime').val(recipe.CookTime || '');
            $('#editrecipe-totaltime').val(recipe.TotalTime || '');
            $('#editrecipe-servings').val(recipe.Servings || '');
            $('#editrecipe-calories').val(recipe.Calories || '');
            $('#editrecipe-notes').val(recipe.Notes || '');
            $('#editrecipe-revision').val(recipe.Revision || '');
            $('#editrecipe-createdate').val(recipe.CreateDate || '');
            
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
        })
        .on('shown.bs.modal', function () {
            // $('#editrecipe-name').focus();
        });
    $('#editrecipe')
        .submit(function (e) {
            e.preventDefault();
            $('#EditRecipeSaveFailure').hide();
            if ($(this).valid()) {
                $
                    .post(this.action, $(this).serialize(), function (response) {
                        Recipes[response.RecipeId] = response;
                        $('#EditRecipeModal')
                            .modal('hide');
                    })
                    .fail(function () {
                        $('#EditRecipeSaveFailure').show();
                    });
            }

            return false;
        })
        .on('change', 'input', function () {
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
            // $('#ingredients .ingredient-ingredientid').each(function (index) {
            //     this.name = 'recipe[Ingredients][' + index + '][IngredientId]';
            // });
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
        });
    $('#directions')
        .on('editrecipe.reorder', function () {
            // $('#directions .direction-directionid').each(function (index) {
            //     this.name = 'recipe[Directions][' + index + '][DirectionId]';
            // });
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
    // $('#editrecipe-preptime, #editrecipe-cooktime')
    //     .on('focusout', function () {
    //         $('#editrecipe-totaltime').val((parseInt($('#editrecipe-preptime').val(), 10) || 0) + (parseInt($('#editrecipe-cooktime').val(), 10) || 0));
    //     });
}());