var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Получение информации о виджете
     *
     * @param Object data {
     *   string widget_uid - UID виджета
     *   Object socket_id  - ID сокета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:info:sended
     */
    app.on('widget:info:get', function (data) {
        console.log('Redis widget:info:get');

        // Создаем пользователя в БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid, {
            form: data.user_data
        }, function (err, response, widget) {
            widget = JSON.parse(widget);
            // Сервер вернул ошибку
            if (widget && widget.errors) {
                console.log(widget.errors);
            } else {
                widget.socket_id = data.socket_id;
                widget.widget_uid = data.widget_uid;
                app.publish('widget:info:sended', widget);
            }
        });
    });

};