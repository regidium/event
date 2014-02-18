var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Агент подключился
     *
     * @param Object data {
     *   Object person     - персона агента,
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:connect', function (data) {
        console.log('Redis agent:connect');
        // Записываем данные агента в Redis
        app.store.hset('agents:' + data.widget_uid, data.person.uid, JSON.stringify({ person: data.person }), function(e, r) {
            // Оповещаем слушателей о подключени пользователя
            app.publish('agent:connected', { person: data.person, widget_uid: data.widget_uid });
        });
    });

    /**
     * Агент отключился
     *
     * @param Object data {
     *   string person_uid - UID агента
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:disconnect', function (data) {
        console.log('Redis agent:disconnect');

        // Удаляем данные о агента из Redis
        app.store.hdel('agents:' + data.widget_uid, data.person_uid, function(e, r) {
            // Оповещаем слушателей об отключении агента
            app.publish('agent:disconnected', { person_uid: data.person_uid, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
        });
    });

};