/*globals $ */

var Recipes = [];

(function () {
    'use strict';
    
    var recipes = JSON.parse($('#recipes').val()) || [];
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
        }
    });
    
    $('#EditRecipeModal')
        .on('editrecipe.load', function (e, recipe) {
            $('#editrecipe-recipeid').val(recipe.RecipeId || '');
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
    // $('#editrecipe-preptime, #editrecipe-cooktime')
    //     .on('focusout', function () {
    //         $('#editrecipe-totaltime').val((parseInt($('#editrecipe-preptime').val(), 10) || 0) + (parseInt($('#editrecipe-cooktime').val(), 10) || 0));
    //     });
}());