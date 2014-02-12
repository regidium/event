var request = require('request');

var self = module.exports = function (events)
{
    /**
     * Пользователь подключился
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:connected', function (data) {
        console.log('Redis user:connected');
    });

    /**
     * Пользователь отключился
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:disconnected', function (data) {
        console.log('Redis user:disconnected');
        self.store.del('users:' + data.widget_uid + ':' + data.person_uid);
    });

    /**
     * Пользователь сменил страницу
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:page:changed', function (data) {
        console.log('Redis user:page:changed');
    });


    /**
     * Пользователь открыл чат
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:chat:opened', function (data) {
        console.log('Redis user:chat:opened');
    });

    /**
     * Пользователь закрыл чат
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:chat:closed', function (data) {
        console.log('Redis user:chat:closed');
    });

    /**
     * Пользователь отправил сообщение
     *
     * @param Object data {
     *   Object person_uid - UID персоны пользователя,
     *   string widget_uid - UID виджета
     *   string chat_uid   - UID чата
     * }
     */
    events.on('user:chat:message:sended', function (data) {
        console.log('Redis user:chat:message:sended');
        request.post({
            url: app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages',
            data: { sender: data.user, text: data.text }
        }, function (err, response, body) {
            console.log(err, response, body);
        });
    });

    /**
     * Пользователь прочел сообщение
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:chat:message:readed', function (data) {
        console.log('Redis user:chat:message:readed');
        /** @todo Запись в базе */
    });

    /**
     * Пользователь удалил сообщение
     *
     * @param Object data {
     *   Object  person_uid - UID персоны пользователя,
     *   integer widget_uid - UID виджета
     * }
     */
    events.on('user:chat:message:removed', function (data) {
        console.log('Redis user:chat:message:removed');
        /** @todo Запись в базе */
    });

};