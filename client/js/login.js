/*globals $ */

(function () {
    'use strict';
    $('#login')
        .on('change', 'input', function () {
            $(this).valid();
        })
        .validate({
            submitHandler: function (form) {
                if ($(form).valid()) {
                    form.submit();
                }

                return false;
            }
        });
}());