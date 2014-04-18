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

        // Добавляем Socket Id к данным чата
        data.chat.socket_id = data.socket_id;

        // Создаем пользователя в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats', {
            form: data.chat
        }, function (err, response, chat) {
            try {
                chat = JSON.parse(chat);
                // Сервер вернул ошибку
                if (chat && chat.errors) {
                    console.log(chat.errors);
                } else {
                    // Записываем данные чата и пользователя в Redis
                    // app.store.hset('chats:' + data.widget_uid, chat.uid, JSON.stringify({ chat: chat }), function(e, r) {
                    //     // Оповещаем слушателей о создании чата
                    //     app.publish('chat:created', { chat: chat, widget_uid: data.widget_uid, socket_id: data.socket_id });
                    //     // Оповещаем слушателей о подключении чата
                    //     app.publish('chat:connected', { chat: chat, widget_uid: data.widget_uid });
                    // });
                    // Оповещаем слушателей о создании чата
                    app.publish('chat:created', { chat: chat, widget_uid: data.widget_uid, socket_id: data.socket_id });
                    // Оповещаем слушателей о подключении чата
                    app.publish('chat:connected', { chat: chat, widget_uid: data.widget_uid });
                }
            } catch(e) {
                console.log(chat);
            }
        });
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

        // Если пользователь обновился находясь В чате, тогда не обновляем статус
        if (data.chat.old_status == 2) {
            var status = 'chatting';
        } else {
            var status = 'online';
        }

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/'+status, {
                form: { socket_id: data.socket_id }
            }, function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Записываем данные чата в Redis
                        // app.store.hset('chats:' + data.widget_uid, data.chat.uid, JSON.stringify({ chat: data.chat }), function(e, r) {
                        //     // Оповещаем слушателей о подключении чата
                        //     app.publish('chat:connected', { chat: data.chat, widget_uid: data.widget_uid });
                        // });
                        // Оповещаем слушателей о подключении чата
                        app.publish('chat:connected', { chat: data.chat, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
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
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // // Удаляем данные о чате из Redis
                        // app.store.hdel('chats:' + data.widget_uid, data.chat_uid, function(e, r) {
                        //     // Оповещаем слушателей об отключении чата
                        //     app.publish('chat:disconnected', { chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                        // });
                        // Оповещаем слушателей об отключении чата
                        app.publish('chat:disconnected', { chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
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
     * @request PUT agent/(Widget UID)/chats/(Chat UID)
     *
     * @publish chat:agent:entered
     */
    app.on('chat:agent:enter', function (data) {
        console.log('Redis chat:agent:enter');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/agents/'+data.agent.uid,
            {},
            function (err, response, chat) {
                try {
                    chat = JSON.parse(chat);
                    // Сервер вернул ошибку
                    if (chat && chat.errors) {
                        console.log(chat.errors);
                    } else {
                        // Добавляем агента в чат в Redis
                        // app.store.hget('chats:' + data.widget_uid, data.chat_uid, function(e, r) {
                        //     var d = JSON.parse(r);
                        //     var chat = d.chat;
                        //     d.agent = data.person;

                        //     // Добавляем агента в чат в Redis
                        //     app.store.hset('chats:' + data.widget_uid, data.chat_uid, JSON.stringify(d), function(e2, r2) {
                        //         // Оповещаем слушателей
                        //         app.publish('chat:agent:entered', { chat: chat, person: data.person, widget_uid: data.widget_uid });
                        //     });
                        // });
                        // Оповещаем слушателей
                        app.publish('chat:agent:entered', { agent: data.agent, chat: chat, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(chat);
                }
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
        console.log('Redis chat:message:send:user');

        // Записываем в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat.uid+'/messages', {
            form: data.message
        }, function (err, response, chat_message) {
            try {
                chat_message = JSON.parse(chat_message);
                // Сервер вернул ошибку
                if (chat_message && chat_message.errors) {
                    console.log(chat_message.errors);
                } else if (chat_message && chat_message.message) {
                    console.log(chat_message.message);
                } else {
                    // Записываем данные сообщения в Redis
                    // app.store.hmset('messages:' + data.chat.uid + ':' + data.chat.uid, chat_message.uid, JSON.stringify({ message: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat.uid: data.chat.uid, date: data.date, text: data.text }), function(e, r) {
                    //     // Оповещаем о смене состония чата
                    //     app.publish('chat:connected', { person: person, chat: chat, widget_uid: data.widget_uid });
                    //     // Оповещаем слушателей о создании сообщения
                    //     app.publish('chat:message:sended:user', { message: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat.uid, date: data.date, text: data.text });
                    // });

                    // Оповещаем о смене состония чата
                    //app.publish('chat:connected', { chat_uid: data.chat.uid, widget_uid: data.widget_uid });
                    // Оповещаем слушателей о создании сообщения
                    app.publish('chat:message:sended:user', { message: chat_message, chat_uid: data.chat.uid, widget_uid: data.widget_uid });
                    
                    // Проверяем статус чата
                    if (data.chat.status != 2) {
                        // Устананавливаем статус чата "В чате"
                        data.chat.status = 2;
                        // Оповещаем слушателей о смене статуса чата
                        app.publish('chat:connected', { chat: data.chat, widget_uid: data.widget_uid });
                    }
                }
            } catch(e) {
                // Ошибка сервера
                console.log(chat_message);
            }
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

        request.post({
            url: app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages',
            form: data.message
        }, function (err, response, chat_message) {
                try {
                    chat_message = JSON.parse(chat_message);
                    // Сервер вернул ошибку
                    if (chat_message && chat_message.errors) {
                        console.log(chat_message.errors);
                    } else {
                        // Записываем данные сообщения в Redis
                        //app.store.hmset('messages:' + data.chat_uid + ':' +data.chat_uid, chat_message.uid, JSON.stringify(data.message), function(e, r) {
                            // Оповещаем слушателей о создании сообщения
                            //app.publish('chat:message:sended:agent', { uid: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text });
                        //});
                        app.publish('chat:message:sended:agent', { message_uid: chat_message.uid, chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(chat_message);
                }
        });
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
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('chat:existed:list', body);
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
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
            function (err, response, chats) {
                try {
                    chats = JSON.parse(chats);
                    // Сервер вернул ошибку
                    if (chats && chats.errors) {
                        console.log(chats.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('chat:online:list', { chats: chats });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(chats);
                }
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
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('chat:archives:list', body);
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });

    /**
     * Пользователь ввел авторизационные данные
     *
     * @param Object data {
     *   Object user       - данные пользователя
     *   Object chat_uid   - UID чата
     *   string widget_uid - UID виджета
     *   string socket_id  - ID сокета
     * }
     *
     * @publish user:auth:entered
     */
    app.on('chat:user:auth', function (data) {
        console.log('Redis chat:user:auth');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/auth', {
                form: data.user,
            }, function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей об авторизации пользователя
                        app.publish('chat:user:authed', { user: data.user, chat_uid: data.chat_uid, widget_uid: data.widget_uid, socket_id: data.socket_id });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });

};