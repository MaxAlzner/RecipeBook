/*globals $, Fraction */
(function () {
    'use strict';
    
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
    
    $.validator.addMethod('fraction', function (value, element) {
        var check;
        try {
            var f = new Fraction(value);
            check = !isNaN(f.n) && !isNaN(f.d);
        }
        catch (e) {
            check = false;
        }
        
        return this.optional(element) || check;
    }, 'Please enter a valid fraction.');
    
    $.validator.addClassRules({
        fraction: {
            fraction: true
        }
    });
    
    $.views.tags({
        html: function (val) {
            return (val || '').replace(/\n/g, '<br />');
        }
    });

    $.breakpoint({
        condition: function () {
            return !$('#pager').is(':visible');
        },
        first_enter: function () {
            $('#content').css('padding-right', '15px');
        },
        enter: function () {
            $('#content').css('padding-right', '15px');
        },
        exit: function () {
            $('#content').css('padding-right', '');
        }
    });
}());