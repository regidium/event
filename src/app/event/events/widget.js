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
                    var res = {};
                    res.widget_uid = body.uid;
                    res.settings = body.settings;
                    app.publish('widget:setting:style:edited', res);
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

};