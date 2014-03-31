var self = module.exports = {};

self.initialize = function (app)
{
    require('./events/agent.js')(app);
    require('./events/chat.js')(app);
    require('./events/widget.js')(app);
};