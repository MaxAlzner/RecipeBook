/*globals $ */

(function () {
    'use strict';
    
    $('#updateaccount')
        .on('submit', function (e) {
            e.preventDefault();
            $('#UpdateAccountSaveFailure').hide();
            if ($(this).valid()) {
                $('#updateaccount button[type=submit]').prop('disabled', true);
                $.post(this.action, $(this).serialize(), function () {
                    $('#updateaccount button[type=submit]').prop('disabled', false);
                })
                .fail(function () {
                    $('#UpdateAccountSaveFailure').show();
                });
            }

            return false;
        })
        .on('change', 'input', function () {
            $(this).valid();
        })
        .validate();
    
    $('#changepassword')
        .on('submit', function (e) {
            e.preventDefault();
            $('#ChangePasswordSaveFailure').hide();
            if ($(this).valid()) {
                $('#changepassword button[type=submit]').prop('disabled', true);
                $.post(this.action, $(this).serialize(), function () {
                    $('#changepassword button[type=submit]').prop('disabled', false);
                    $('#changepassword-oldpassword, #changepassword-newpassword, #changepassword-newpassword2').val('');
                })
                .fail(function () {
                    $('#ChangePasswordSaveFailure').show();
                });
            }

            return false;
        })
        .on('change', 'input', function () {
            $(this).valid();
        })
        .validate({
            rules: {
                newpassword2: {
                    equalTo: '#changepassword-newpassword'
                }
            }
        });
}());