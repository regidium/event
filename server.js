var _ = require('underscore');
var redis = require('redis');
var config = require('./config/config/config.json');

var self = module.exports = function ()
{
    self.initialize();
};

self.initialize = function ()
{
    self.config = config;
    self.client = redis.createClient();
    self.sub = redis.createClient();
    self.pub = redis.createClient();
    self.sub.subscribe(config.redis.io_in);
    self.sub.on('message', function (chanel, event) {
        event = JSON.parse(event);
        console.log('New event: '+event.key+' arrived on chanel: '+chanel);
        self.handle_event(chanel, event);
    });
    console.log('Subscribed on sending successfully in chanel ' + config.redis.io_in);

    // Events
    var events = require('./src/app/event/events');
    events.initialize(self);
};

self.events = [];
self.callbacks = {};

self.on = function (event, callback) {
    if (!self.callbacks[event]) {
        self.callbacks[event] = [];
    }

    self.callbacks[event].push(callback);
};

self.handle_event = function (chanell, event)
{
    if (self.callbacks[event.key]) {
        _.each(self.callbacks[event.key], function (cb) {
            cb(event.data);
        });
    }
};

self.store = function (key, data)
{
    var event = JSON.stringify(key, data)
    self.pub.publish(config.redis.io_out, event);
};

self();