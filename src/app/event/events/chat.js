var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Создание чата
     *
     * @param Object data {
     *   Object chat       - информация о пользователе
     *   string widget_uid - UID виджета
     *   string socket_id  - ID сокета
     * }
     *
     * @store hset chats:(Widget UID) (Chat UID)
     *
     * @publish chat:created
     * @publish chat:connected
     */
    app.on('chat:create', function (data) {
        console.log('Redis chat:create');

        // Создаем пользователя в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats',
            { form: data.chat },
            function (err, response, body) {
                prepareResponse(body, data, function(chat) {
                    // Оповещаем слушателей о создании чата
                    app.publish('chat:created', { chat: chat, widget_uid: data.widget_uid, socket_id: data.socket_id });
                });
            }
        );
    });

    /**
     * Чат подключился
     *
     * @param Object data {
     *   string chat       - данные чата
     *   string widget_uid - UID виджета
     *   string socket_id  - ID сокета
     * }
     *
     * @publish chat:connected
     */
    app.on('chat:connect', function (data) {
        console.log('Redis chat:connect');

        var status = 'online';

        // Если пользователь обновился находясь В чате, тогда не обновляем статус
        if (data.chat.old_status == 2) {
            status = 'chatting';
        }

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/'+status,
            {},
            function (err, response, body) {
                prepareResponse(body, data, function() {
                    // Оповещаем слушателей
                    app.publish('chat:connected', { chat: data.chat, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Чат отключился
     *
     * @param Object data {
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @publish chat:disconnected
     */
    app.on('chat:disconnect', function (data) {
        console.log('Redis chat:disconnect');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/offline',
            {},
            function (err, response, body) {
                prepareResponse(body, data, function() {
                    // Оповещаем слушателей
                    app.publish('chat:disconnected', { chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Чат закрыт
     *
     * @param Object data {
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @publish chat:closed
     */
    app.on('chat:close', function (data) {
        console.log('Redis chat:close');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/closed',
            {},
            function (err, response, body) {
                prepareResponse(body, data, function() {
                    // Оповещаем слушателей
                    app.publish('chat:closed', { chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Агент подключися к чату
     *
     * @param Object data {
     *   Object agent      - данные агента
     *   string chat.uid   - данные чата
     *   string widget_uid - UID виджета
     * }
     *
     * @request PUT agent/:widget_uid/chats/:chat_uid
     *
     * @publish chat:agent:entered
     */
    app.on('chat:agent:enter', function (data) {
        console.log('Redis chat:agent:enter');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/agents/'+data.agent.uid,
            {},
            function (err, response, body) {
                prepareResponse(body, data, function(chat) {
                    // Оповещаем слушателей
                    app.publish('chat:agent:entered', { agent: data.agent, chat: chat, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Агент отключился от чата
     *
     * @param Object data {
     *   Object agent      - данные агента
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @request DELETE agent/:widget_uid/chats/:chat_uid/agents/:agent_uid
     *
     * @publish chat:agent:leaved
     */
    app.on('chat:agent:leave', function (data) {
        console.log('Redis chat:agent:leave');

        // Записываем в БД
        request.del(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/agents/'+data.agent.uid,
            function (err, response, body) {
                prepareResponse(body, data, function(chat) {
                    // Оповещаем слушателей
                    app.publish('chat:agent:entered', { agent: data.agent, chat: chat, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Пользователь отправил сообщение
     *
     * @param Object data {
     *   Object message    - данные сообщения
     *   string widget_uid - UID виджета
     *   string chat_uid   - UID чата
     * }
     *
     * @store HMSET message:(Chat UID)
     *
     * @publish chat:message:sended:user
     */
    app.on('chat:message:send:user', function (data) {
        console.log('Redis chat:message:send:user', data);

        // Записываем в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/messages', {
            form: data.message
        }, function (err, response, body) {
            prepareResponse(body, data, function(chat_message) {
                // Оповещаем слушателей
                app.publish('chat:message:sended:user', { message: chat_message, chat_uid: data.chat.uid, widget_uid: data.widget_uid });

                // Проверяем статус чата
                if (data.chat.status != 2) {
                    // Устананавливаем статус чата "В чате"
                    data.chat.status = 2;
                    // Оповещаем слушателей о смене статуса чата
                    app.publish('chat:status:changed', { chat: data.chat, widget_uid: data.widget_uid });
                }
            });
        });
    });

    /**
     * Агент отправил сообщение
     *
     * @param Object data {
     *   Object message    - данные сообщения
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @publish chat:message:sended:agent
     */
    app.on('chat:message:send:agent', function (data) {
        console.log('Redis chat:message:send:agent');

        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages',
            { form: data.message },
            function (err, response, body) {
                prepareResponse(body, data, function(chat_message) {
                    // Оповещаем слушателей
                    app.publish('chat:message:sended:agent', { message: chat_message, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Запрос существующих чатов
     *
     * @param Object data {
     *   string agent_uid  - UID агента
     *   string widget_uid - UID виджета
     * }
     *
     * @request GET widgets/(Widget UID)/chats/existed
     *
     * @publish chat:existed:list
     */
    app.on('chat:existed', function (data) {
        console.log('Redis chat:existed');

        // Читаем из БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.agent_uid+'/existed',
            {},
            function (err, response, body) {
                prepareResponse(body, data, function(chats) {
                    // Оповещаем слушателей
                    app.publish('chat:existed:list', chats);
                });
            }
        );
    });


    /**
     * Запрос онлайн чатов
     *
     * @param Object data {
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @request GET widgets/(Widget UID)/chats/online
     *
     * @publish chat:online:list
     */
    app.on('chat:online', function (data) {
        console.log('Redis chat:online');

        // Читаем из БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/online',
            {},
            function (err, response, body) {
                prepareResponse(body, data, function(chats) {
                    // Оповещаем слушателей
                    app.publish('chat:online:list', { chats: chats, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Запрос архивных чатов
     *
     * @param Object data {
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @request GET widgets/(Widget UID)/chats/archive
     *
     * @publish chat:archives:list
     */
    app.on('chat:archives', function (data) {
        console.log('Redis chat:archives');

        // Читаем в БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/archive',
            {},
            function (err, response, body) {
                prepareResponse(body, data, function(chats) {
                    // Оповещаем слушателей
                    app.publish('chat:archives:list', chats);
                });
            }
        );
    });

    /**
     * Пользователь ввел авторизационные данные
     *
     * @param Object data {
     *   Object user       - данные пользователя
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     *   string socket_id  - ID сокета
     * }
     *
     * @publish user:auth:entered
     */
    app.on('chat:user:auth', function (data) {
        console.log('Redis chat:user:auth');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/auth',
            { form: data.user },
            function (err, response, body) {
                prepareResponse(body, data, function() {
                    // Оповещаем слушателей
                    app.publish('chat:user:authed', { user: data.user, chat_uid: data.chat_uid, widget_uid: data.widget_uid, socket_id: data.socket_id });
                });
            }
        );
    });

    /**
     * Сообщение было прочитано
     *
     * @param Object data {
     *   string message_uid - UID сообщения
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     */
    app.on('chat:message:readed', function (data) {
        console.log('Redis chat:message:readed');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages/'+data.message_uid+'/read', {
            }, function (err, response, body) {
                prepareResponse(body, data, function() {
                    // @todo
                });
            }
        );
    });

    /**
     * Изменена текущая страница чата
     *
     * @param Object data {
     *   string new_url    - текущий URL чата
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     */
    app.on('chat:url:change', function (data) {
        console.log('Redis chat:url:change');

        // Записываем в БД
        request.patch(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/url',
            { form: { current_url: encodeURIComponent(data.new_url) } },
            function (err, response, body) {
                prepareResponse(body, data, function() {
                    app.publish('chat:url:changed', { new_url: data.new_url, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });


    /**
     * Изменен referrer сайта
     *
     * @param Object data {
     *   string referrer   - Referrer сайта
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     */
    app.on('chat:referrer:change', function (data) {
        console.log('Redis chat:referrer:change');

        // Записываем в БД
        request.patch(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/referrer',
            { form: { referrer: encodeURIComponent(data.referrer) } },
            function (err, response, body) {
                prepareResponse(body, data, function(info) {
                    app.publish('chat:referrer:changed', { referrer: info.referrer, keywords: info.keywords, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });

    /**
     * Робот отправил сообщение
     *
     * @param Object data {
     *   Object message    - данные сообщения
     *   string chat_uid   - UID чата
     *   string widget_uid - UID виджета
     * }
     *
     * @publish chat:message:sended:robot
     */
    app.on('chat:message:send:robot', function (data) {
        console.log('Redis chat:message:send:robot');

        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages',
            { form: data.message },
            function (err, response, body) {
                prepareResponse(body, data, function(chat_message) {
                    app.publish('chat:message:sended:robot', { message: chat_message, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                });
            }
        );
    });

    var prepareResponse = function(response, data, success, error) {
        try {
            var parsed_response = JSON.parse(response);

            // Сервер вернул ошибку
            if (parsed_response && parsed_response.errors) {
                console.error(parsed_response.errors);

                app.publish('chat:error:sended', data);

                if (error) {
                    error(parsed_response);
                }
            } else {
                if (success) {
                    success(parsed_response)
                }
            }
        } catch(e) {
            // Ошибка парсинга
            console.error(response);

            if (error) {

                app.publish('chat:error:sended', data);

                if (error) {
                    error(response);
                }
            }
        }
    };

};