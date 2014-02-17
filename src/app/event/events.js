var self = module.exports = {};

self.initialize = function (app)
{
    require('./events/user.js')(app);
    require('./events/agent.js')(app);
    require('./events/chat.js')(app);
};