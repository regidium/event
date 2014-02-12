var request = require('request');

var self = module.exports = function (events)
{
    /**
     * Агент подключился
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:connected', function (data) {
        console.log('Redis agent:connected');
    });

    /**
     * Агент отключился
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:disconnected', function (data) {
        console.log('Redis agent:disconnected');
        self.store.del('agents:' + data.person.uid);
    });

    /**
     * Агент подключися к чату
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:chat:enter', function (data) {
        console.log('Redis agent:chat:enter');
    });

    /**
     * Агент отключился от чата
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:chat:leave', function (data) {
        console.log('Redis agent:chat:leave');
    });

    /**
     * Агент отправил сообщение
     *
     * @param Object data {
     *   Object person     - персона агента,
     *   string widget_uid - UID виджета
     *   string chat_uid   - UID чата
     * }
     */
    events.on('agent:chat:message:sended', function (data) {
        console.log('Redis agent:chat:message:sended');
        request.post({
            url: app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages',
            data: { sender: data.agent, text: data.text }
        }, function (err, response, body) {
            console.log(err, response, body);
        });
    });

    /**
     * Агент прочел сообщение
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:chat:message:readed', function (data) {
        console.log('Redis agent:chat:message:readed');
        /** @todo Запись в базе */
    });

    /**
     * Агент удалил сообщение
     *
     * @param Object data {
     *   Object  person - персона агента,
     *   integer widget - UID виджета
     * }
     */
    events.on('agent:chat:message:removed', function (data) {
        console.log('Redis agent:chat:message:removed');
        /** @todo Запись в базе */
    });

};