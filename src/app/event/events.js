var self = module.exports = {};

self.initialize = function (events)
{
    require('./events/user.js')(events);
    require('./events/agent.js')(events);
};