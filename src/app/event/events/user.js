var request = require('request');

var self = module.exports = function (app)
{

    /**
     * Пользователь авторизировался
     *
     * @param Object data {
     *   Object person     - Объект пользователя
     *   string socket_id  - ID сокета
     *   string widget_uid - UID виджета
     * }
     *
     * @publish user:auth:entered
     */
    app.on('user:auth:enter', function (data) {
        console.log('Redis user:auth:enter');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/users/'+data.person.uid+'/auth',
            { fullname: data.fullname, email: data.email },
            function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей об авторизации пользователя
                        app.publish('user:auth:entered', { person: data.person, socket_id: data.socket_id , widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });
};