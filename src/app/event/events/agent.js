var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Агент подключился
     *
     * @param Object data {
     *   Object agent      - данные агента,
     *   string widget_uid - UID виджета
     * }
     *
     * @store hset agents:(Widget UID)
     *
     * @publish agent:connected
     */
    app.on('agent:connect', function (data) {
        console.log('Redis agent:connect');

        // Записываем данные агента в Redis
        app.store.hset('agents:' + data.widget_uid, data.agent.uid, JSON.stringify({ agent: data.agent }), function(e, r) {
            // Оповещаем слушателей о подключени агента
            app.publish('agent:connected', { agent: data.agent, widget_uid: data.widget_uid });
        });
    });

    /**
     * Агент отключился
     *
     * @param Object data {
     *   string agent_uid  - UID агента
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:disconnect', function (data) {
        console.log('Redis agent:disconnect');

        // Удаляем данные о агента из Redis
        app.store.hdel('agents:' + data.widget_uid, data.agent_uid, function(e, r) {
            // Оповещаем слушателей об отключении агента
            app.publish('agent:disconnected', { agent_uid: data.agent_uid, widget_uid: data.widget_uid });
        });
    });

};