// Yet Another Event Manager (Pub/Sub)
//
// all listeners are executed in context of a instance of the EventManager

module.exports = EventManager;

/**
 * @constructor
 *
 * @param {Boolean} [doDebug] to do 'console.error' for errors of 'listeners' or not.
 */
function EventManager (doDebug) {
    this._events = {};
    this._debug = !!doDebug;
}


EventManager.fn = EventManager.prototype;


/**
 * @param {String} eventName
 * @returns {Array} of listeners for the event
 */
EventManager.fn._getListeners = function (eventName) {
    return this._events[eventName] || ( this._events[eventName] = [] );
};


/**
 * @param {String} eventName
 * @param {Function} listener
 */
EventManager.fn.subscribe = function (eventName, listener){
    this._getListeners(eventName).push(listener);
};


/**
 * @param {String} eventName
 * @param {*} [data] whatever you want to transfer to listeners (just single param)
 */
EventManager.fn.publish = function (eventName, data) {
    var _this = this,
        listeners = this._getListeners(eventName);
    
    for (var i = 0, l = listeners.length; i < l; ) try {
        listeners[i++].call(_this, {name:eventName, target:_this}, data);
    } catch (error) {
        if ( _this._debug && console && console.error ) {
            console.error(
                '\nERROR [EventManager]:\nEVENT NAME: "%s"\nSTACK: %s',
                eventName,
                error.stack
            );
        }
    };
};


/**
 * @param {String} eventName
 * @param {Function} listener
 */
EventManager.fn.unsubscribe = function (eventName, listener) {
    var listeners = this._getListeners(eventName),
        index = listeners.indexOf(listener);

    if ( ~index ) listeners.splice(index, 1);
};
