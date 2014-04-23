var request = require('request');

var self = module.exports = function (app)
{
    /**
     * Получаем список агентоа
     *
     * @param Object data {
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:existed', function (data) {
        console.log('Redis agent:existed');

        // Читаем из БД
        request.get(app.config.backend.url + 'widgets/'+data.widget_uid+'/agents/existed',
            {},
            function (err, response, agents) {
                try {
                    agents = JSON.parse(agents);
                    // Сервер вернул ошибку
                    if (agents && agents.errors) {
                        console.log(agents.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('agent:existed:list', { agents: agents, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(agents);
                }
            }
        );
    });

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

        // Записываем в БД
        request.post(app.config.backend.url + 'widgets/'+data.widget_uid+'/agents/'+data.agent.uid+'/auths',
            {}, function (err, response, body) {
                try {
                    body = JSON.parse(body);
                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Записываем данные агента в Redis
                        // app.store.hset('agents:' + data.widget_uid, data.agent.uid, JSON.stringify({ agent: data.agent }), function(e, r) {
                        //     // Оповещаем слушателей о подключени агента
                        //     app.publish('agent:connected', { agent: data.agent, widget_uid: data.widget_uid });
                        // });
                        // Оповещаем слушателей о подключени агента
                        app.publish('agent:connected', { agent: data.agent, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    console.log(body);
                }
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
        // app.store.hdel('agents:' + data.widget_uid, data.agent_uid, function(e, r) {
        //     // Оповещаем слушателей об отключении агента
        //     app.publish('agent:disconnected', { agent_uid: data.agent_uid, widget_uid: data.widget_uid });
        // });
        // Оповещаем слушателей об отключении агента
        app.publish('agent:disconnected', { agent_uid: data.agent_uid, widget_uid: data.widget_uid });
    });

    /**
     * Сохраняем данные агента
     *
     * @param Object data {
     *   Object agent      - данные агента
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:save', function (data) {
        console.log('Redis agent:save');

        // Читаем из БД
        request.put(app.config.backend.url + 'widgets/'+data.widget_uid+'/agents/'+data.agent.uid,
            { form: data.agent },
            function (err, response, agent) {
                try {
                    agent = JSON.parse(agent);
                    // Сервер вернул ошибку
                    if (agent && agent.errors) {
                        console.log(agent.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('agent:saved', { agent: agent, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(agent);
                }
            }
        );
    });

    /**
     * Удаляем агента
     *
     * @param Object data {
     *   Object agent_uid  - UID агента
     *   string widget_uid - UID виджета
     * }
     */
    app.on('agent:remove', function (data) {
        console.log('Redis agent:remove');

        // Удаляем из БД
        request.del(app.config.backend.url + 'widgets/'+data.widget_uid+'/agents/'+data.agent_uid,
            function (err, response, body) {
                try {
                    body = JSON.parse(body);

                    // Сервер вернул ошибку
                    if (body && body.errors) {
                        console.log(body.errors);
                    } else {
                        // Оповещаем слушателей
                        app.publish('agent:removed', { agent_uid: data.agent_uid, widget_uid: data.widget_uid });
                    }
                } catch(e) {
                    // Ошибка сервера
                    console.log(body);
                }
            }
        );
    });

};