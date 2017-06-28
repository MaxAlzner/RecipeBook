/*globals $ */

(function () {
    'use strict';
    
    $('#EditUserPermissionModal')
        .on('edituser.load', function (e, data) {
            $('#edituser-userid').val(data.UserId);
            $('.edituser-permission').prop('checked', false);
            data.Permissions.forEach(function (permission) {
                $('.edituser-permission[value="' + permission.PermissionId + '"]').prop('checked', true);
            });
        })
        .on('show.bs.modal', function () {
            $('#EditUserPermissionSaveFailure').hide();
        });
    $('#edituser')
        .on('submit', function (e) {
            e.preventDefault();
            $('#EditUserPermissionSaveFailure').hide();
            if ($(this).valid()) {
                $('#edituser button[type=submit]').prop('disabled', true);
                $.post(this.action, $(this).serialize(), function () {
                    $('#edituser button[type=submit]').prop('disabled', false);
                    $('#EditUserPermissionModal').modal('hide');
                    $('#edituser').trigger('edituser.done');
                })
                .fail(function () {
                    $('#EditUserPermissionSaveFailure').show();
                });
            }

            return false;
        });
}());