/*globals $ */

(function () {
    'use strict';
    
    $('#UploadImageModal')
        .on('uploadimage.load', function (e, recipe) {
            $('#uploadimage-uniqueid').val(recipe.UniqueId || '');
        })
        .on('show.bs.modal', function () {
            $('#uploadimage-progress > .progress-bar').attr('aria-valuenow', 0).css('width', '0%');
            $('#uploadimage-file').val(null);
        });
    $('#uploadimage-file')
        .on('change', function (e) {
            var data = new FormData();
            $.each(this.files, function (index, file) {
                data.append('file[' + index + ']', file);
            });
            
            $.ajax({
                type: 'PUT',
                url: 'photo/' + $('#uploadimage-uniqueid').val(),
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
                    $('#uploadimage-file').trigger('uploadimage.done');
                }
            });
        });
}());