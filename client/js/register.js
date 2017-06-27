/*globals $ */

(function () {
    'use strict';
    $('#register')
        .on('change', 'input', function () {
            $(this).valid();
        })
        .validate({
            rules: {
                password2: {
                    equalTo: '#register-password'
                }
            },
            submitHandler: function (form) {
                if ($(form).valid()) {
                    form.submit();
                }

                return false;
            }
        });
}());