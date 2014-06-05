var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Получение информации о виджете
     *
     * @param Object data {
     *   string widget_uid - UID виджета
     *   string socket_id  - ID сокета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:info:sended
     */
    app.on('widget:info:get', function (data) {
        console.log('Redis widget:info:get');

        // Создаем пользователя в БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid, {}, function (err, response, widget) {
            try {
                widget = JSON.parse(widget);
                // Сервер вернул ошибку
                if (widget && widget.errors) {
                    console.log(widget.errors);
                } else {
                    widget.socket_id = data.socket_id;
                    widget.widget_uid = data.widget_uid;
                    app.publish('widget:info:sended', widget);
                }
            } catch(e) {
                console.log(widget);
            }
        });
    });

    /**
     * Сохранение настроек стилей виджета
     *
     * @param Object data {
     *   Object settings   - данные настроек стилей
     *   string widget_uid - UID виджета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:setting:style:edited
     */
    app.on('widget:setting:style:edit', function (data) {
        console.log('Redis widget:setting:style:edit');

        // Сохраняем настройки стилей виджета в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/settings', {
                form: { settings: data.settings }
            }, function (err, response, body) {
            try {
                body = JSON.parse(body);
                // Сервер вернул ошибку
                if (body && body.errors) {
                    console.log(body.errors);
                } else {
                    app.publish('widget:setting:style:edited', { widget_uid: body.uid,  settings: body.settings });
                }
            } catch(e) {
                console.log(body);
            }
        });
    });

    /**
     * Сохранение триггера виджета
     *
     * @param Object data {
     *   Object trigger     - данные триггера
     *   string trigger_uid - UID триггера
     *   string widget_uid  - UID виджета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:setting:triggers:edited
     */
    app.on('widget:setting:triggers:edit', function (data) {
        console.log('Redis widget:setting:triggers:edit');

        // Сохраняем триггер виджета в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/triggers/'+data.trigger.uid, {
                form: data.trigger
            }, function (err, response, trigger) {
            try {
                trigger = JSON.parse(trigger);
                // Сервер вернул ошибку
                if (trigger && trigger.errors) {
                    console.log(trigger.errors);
                } else {
                    var res = {};
                    res.widget_uid = data.widget_uid;
                    res.trigger = trigger;
                    app.publish('widget:setting:triggers:edited', res);
                }
            } catch(e) {
                console.log(trigger);
            }
        });
    });

    /**
     * Удаление триггера виджета
     *
     * @param Object data {
     *   Object trigger     - данные триггера
     *   string trigger_uid - UID триггера
     *   string widget_uid  - UID виджета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:setting:triggers:removed
     */
    app.on('widget:setting:triggers:remove', function (data) {
        console.log('Redis widget:setting:triggers:remove');

        // Удаляем триггер виджета в БД
        request.del(app.config.backend.url + 'widgets/'+data.widget_uid+'/triggers/'+data.trigger_uid,
            function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        var res = {};
                        res.widget_uid = data.widget_uid;
                        res.trigger_uid = data.trigger_uid;
                        app.publish('widget:setting:triggers:removed', res);
                    }
                } catch(e) {
                    console.log(body);
                }
        });
    });

    /**
     * Запрос списка непрочитанных сообщений виджета
     *
     * @param Object data {
     *   string widget_uid - UID виджета
     * }
     */
    app.on('widget:message:new:get', function (data) {
        console.log('Redis widget:message:new:get');

        // Записываем в БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/messages/new', {
            }, function (err, response, messages) {
                try {
                    messages = JSON.parse(messages);
                    // Сервер вернул ошибку
                    if (messages && messages.errors) {
                        console.log(messages.errors);
                    } else {
                        // Оповещаем слушателей об авторизации пользователя
                        app.publish('widget:message:new:list', { new_messages: messages, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(messages);
                }
            }
        );
    });

    /**
     * Оплата услуг виджета
     *
     * @param Object data {
     *   Object payment    - метод оплаты
     *   string agent_uid  - UID агента
     *   string widget_uid - UID виджета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:payment:transaction
     */
    app.on('widget:payment:made', function (data) {
        console.log('Redis widget:payment:made', data);

        // Сохраняем триггер виджета в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/transactions/'+data.agent_uid, {
                form: { payment: data.payment }
            }, function (err, response, data) {
            try {
                data = JSON.parse(data);
                // Сервер вернул ошибку
                if (data && data.errors) {
                    console.log(data.errors);
                } else {
                    app.publish('widget:payment:transaction', { transaction: data.transaction, url: data.url, agent_uid: data. agent_uid, widget_uid: data.widget_uid });
                }
            } catch(e) {
                console.log(data);
            }
        });
    });

    /**
     * Смена тарифного плана виджета
     *
     * @param Object data {
     *   Object payment    - метод оплаты
     *   string widget_uid - UID виджета
     * }
     *
     * @todo Использовать Redis
     *
     * @publish widget:plan:changed
     */
    app.on('widget:plan:change', function (data) {
        console.log('Redis widget:plan:change');

        // Сохраняем триггер виджета в БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/plan', {
                form: { plan: data.plan }
            }, function (err, response, body) {
            try {
                body = JSON.parse(body);
                // Сервер вернул ошибку
                if (body && body.errors) {
                    console.log(body.errors);
                } else {
                    app.publish('widget:plan:changed', { widget_uid: data.widget_uid });
                }
            } catch(e) {
                console.log(body);
            }
        });
    });

};