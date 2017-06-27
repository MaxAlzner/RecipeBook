/*globals $ */

(function () {
    'use strict';
    
    $('#ViewImageModal')
        .on('viewimage.load', function (e, data) {
            $('#ViewImageModalLabel').text(data.image);
            $('#viewimage')
                .prop('src', '/photo/' + data.id + '/' + data.image)
                .prop('alt', data.image);
        });
}());