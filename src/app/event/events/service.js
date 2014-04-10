var request = require('request');

var self = module.exports = function (app)
{

    /** Запрашиваем список ID активных сокетов пользователей */
    app.publish('service:online:users');

    /**
     * Отключение повисших пользователей (после перезагрузки)
     *
     * @param Object data {
     *   array socket_ids - Массив ID активных сокетов
     * }
     *
     * @todo Использовать Redis
     *
     * @emit service:update:users:list
     */
    app.on('service:online:users:list', function (data) {
        console.log('Redis service:online:users:list');

        // Создаем пользователя в БД
        request.put(app.config.backend.url + 'service/disconnect/users', {
            form: { socket_ids: data.socket_ids }
        }, function (err, response, body) {
            try {
                body = JSON.parse(body);
                // Сервер вернул ошибку
                if (body && body.errors) {
                    console.log(body.errors);
                } else {
                    // Оповещаем слушателей о необходимости обновить список пользователей
                    app.publish('service:update:users:list');
                }
            } catch(e) {
                console.log(body);
            }
        });
    });

};