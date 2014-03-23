var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Создание чата
     *
     * @param Object data {
     *   string widget_uid - UID виджета
     *   Object user_data  - информация о пользователе
     * }
     *
     * @store HSET chats:(Widget UID) (Chat UID)
     *
     * @publish chat:created
     * @publish chat:connected
     */
    app.on('chat:create', function (data) {
        console.log('Redis chat:create');

        // Создаем пользователя в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/users', {
            form: data.user_data
        }, function (err, response, person) {
            person = JSON.parse(person);
            // Сервер вернул ошибку
            if (person && person.errors) {
                console.log(person.errors);
            } else {
                // Создаем чат в БД
                request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/users/'+person.user.uid+'/chats',
                    {},
                    function (err2, response2, chat) {
                        console.log(chat);
                    try {
                        chat = JSON.parse(chat);
                        // Сервер вернул ошибку
                        if (chat && chat.errors) {
                            console.log(chat.errors);
                        } else {
    /*                        hset = {};
                            hset[chat.uid] = JSON.stringify({ chat: chat, person: person });*/
                            // Записываем данные чата и пользователя в Redis
                            app.store.hset('chats:' + data.widget_uid, chat.uid, JSON.stringify({ chat: chat, person: person }), function(e, r) {
                                // Оповещаем слушателей о создании чата
                                app.publish('chat:created', { person: person, chat: chat, widget_uid: data.widget_uid, socket_id: data.socket_id });
                                // Оповещаем слушателей о подключении чата
                                app.publish('chat:connected', { person: person, chat: chat, widget_uid: data.widget_uid });
                            });
                        }
                    } catch(e) {
                        // Ошибка сервера
                        console.log(body);
                    }
                });
            }
        });
    });

    /**
     * Чат подключился
     *
     * @param Object data {
     *   string chat       - данные чата
     *   string person     - данные пользователя
     *   string widget_uid - UID виджета
     * }
     *
     * @publish chat:connected
     */
    app.on('chat:connect', function (data) {
        console.log('Redis chat:connect');

        // Записываем в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/online',
            {},
            function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Записываем данные чата в Redis
                        app.store.hset('chats:' + data.widget_uid, data.chat.uid, JSON.stringify({ chat: data.chat, person: data.person }), function(e, r) {
                            // Оповещаем слушателей о подключении чата
                            app.publish('chat:connected', { chat: data.chat, person: data.person , widget_uid: data.widget_uid });
                        });
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
     *   Object person     - данные агента
     *   string chat_uid   - UID чата
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
        request.put(app.config.backend.url + 'agents/'+data.person.uid+'/chats/'+data.chat_uid,
            {},
            function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
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
                        app.publish('chat:agent:entered', { chat: chat, person: data.person, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });

    /**
     * Пользователь отправил сообщение
     *
     * @param Object data {
     *   Object person     - данные пользователь
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
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/'+data.chat_uid+'/messages', {
            form: { sender_uid: data.person.uid, text: data.text }
        }, function (err, response, chat_message) {
            try {
                chat_message = JSON.parse(chat_message);
                // Сервер вернул ошибку
                if (chat_message && chat_message.errors) {
                    console.log(chat_message.errors);
                } else {
                    // Записываем данные сообщения в Redis
                    // app.store.hmset('messages:' + data.chat_uid + ':' + data.chat_uid, chat_message.uid, JSON.stringify({ chat_uid: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text }), function(e, r) {
                    //     // Оповещаем о смене состония чата
                    //     app.publish('chat:connected', { person: person, chat: chat, widget_uid: data.widget_uid });
                    //     // Оповещаем слушателей о создании сообщения
                    //     app.publish('chat:message:sended:user', { chat_uid: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text });
                    // });
                    // Оповещаем о смене состония чата
                    app.publish('chat:connected', { person: person, chat: chat, widget_uid: data.widget_uid });
                    // Оповещаем слушателей о создании сообщения
                    app.publish('chat:message:sended:user', { person: data.person, message_uid: chat_message.uid, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text });
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
     *   Object person     - данные агента
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
            form: { sender_uid: data.person.uid, text: data.text }
        }, function (err, response, chat_message) {
                try {
                    chat_message = JSON.parse(chat_message);
                    // Сервер вернул ошибку
                    if (chat_message && chat_message.errors) {
                        console.log(chat_message.errors);
                    } else {
                        // Записываем данные сообщения в Redis
                        app.store.hmset('messages:' + data.chat_uid + ':' +data.chat_uid, chat_message.uid, JSON.stringify({ chat_uid: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text }), function(e, r) {
                            // Оповещаем слушателей о создании сообщения
                            app.publish('chat:message:sended:agent', { uid: chat_message.uid, person: data.person, widget_uid: data.widget_uid, chat_uid: data.chat_uid, date: data.date, text: data.text });
                        });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(chat_message);
                }
        });
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
                        // Удаляем данные о чате из Redis
                        app.store.hdel('chats:' + data.widget_uid, data.chat_uid, function(e, r) {
                            // Оповещаем слушателей об отключении чата
                            app.publish('chat:disconnected', { chat_uid: data.chat_uid, widget_uid: data.widget_uid });
                        });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });

    /**
     * Запрос существующих чатов
     *
     * @param Object data {
     *   string chat_uid   - UID чата
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
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/chats/existed',
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
            function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('chat:online:list', body);
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
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

};