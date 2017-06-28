/*globals $ */

(function () {
    'use strict';
    var table = $('#users')
        .DataTable({
            order: [[2, 'asc']],
            searching: false,
            autoWidth: false,
            lengthChange: true,
            serverSide: true,
            ajax: {
                url: '/admin/users',
                dataType: 'json',
                type: 'POST'
            },
            columns: [
                {
                    data: 'UserId',
                    name: 'rowId',
                    visible: false
                },
                {
                    data: null,
                    width: '40px',
                    orderable: false,
                    className: 'text-center',
                    render: function (data) {
                        return '<div class="btn-group btn-group-xs"><button type="button" class="btn btn-default" onclick="$(\'#EditUserPermissionModal\').trigger(\'edituser.load\', $(\'#users\').DataTable().row($(this).closest(\'tr\')).data()).modal(\'show\')"><span class="glyphicon glyphicon-cog"></span></button></div>';
                    }
                },
                {
                    data: 'Name',
                    title: 'Name',
                    width: 'auto'
                },
                {
                    data: 'EmailAddress',
                    title: 'E-mail',
                    width: '400px',
                    className: 'hidden-xs hidden-sm'
                }
            ]
        });
    $('#edituser')
        .on('edituser.done', function () {
            table.draw();
        });
}());