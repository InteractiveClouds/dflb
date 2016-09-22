const
    Q  = require('q'),
    AR = require('./lib/authRequest').getRequestInstance({}),
    EV = new EventManager(true),
    POTOCOL   = 'http',
    PASSWORD  = 'admin1'
    APP_PRFX  = 'A',
    VDGT_PRFX = 'V',
    RGX_IS_CT_JSON = /application\/json/,

    DOMAIN    =  process.argv[2],
    PORT      = +process.argv[3],
    USERID    =  process.argv[4],
    TENANTID  =  process.argv[5],
    TIMEOUT   = +process.argv[6],
    MAX       = +process.argv[7], // max iterations

    RS = [
        function(){return{
            method : 'get',
            path   : '/studio/index.html#/home'
        }},
        function(){return{
            method : 'post',
            path   : '/studio/application/create',
            body   : {
                applicationName : app.name,
                logo     : '/images/dfx_login_logo_black.png',
                ownerId  : '',
                platform : 'web',
                title    : ''
            }
        }},
        function(){return{
            method : 'get',
            path   : '/studio/widget/category/list/' + app.name + '/web'
        }},
        function(){return{
            method : 'post',
            path   : '/studio/widget/create/',
            body   : {
                application :  app.name,
                category    : 'Default',
                description : '',
                name        : vdgt.name,
                owner       : USERID,
                platform    : 'web',
                src         : {
                        'properties' : {},
                        'definition' : {
                            'default': [
                                {
                                    'id'         : 1000 + vdgt.postfix,
                                    'type'       : 'panel',
                                    'attributes' : {
                                        'name' : {
                                            'value'  : 'pnlPanel1',
                                            'status' : 'overridden'
                                        }
                                    },
                                    'children' : []
                                }
                            ]
                        }
                    },
                src_styles  : '',
                wtype       : 'visual'
            }
        }},
        function(){return{
            method : 'get',
            path   : '/studio/widget/web/' + app.name + '/' + vdgt.name + '/index.html',
        }},
        function(){return{
            method : 'post',
            path   : '/studio/widget/update/' + vdgt.name,
            body   : {
                change : {
                    application : app.name,
                    category : "Default",
                    platform : "web",
                    src : JSON.stringify({
                        "properties":{},
                        "definition":{
                            "default":[
                                {
                                    "id":1000 + vdgt.postfix,
                                    "type":"panel",
                                    "attributes":{
                                        "name":{
                                            "value":"pnlPanel1",
                                            "status":"overridden"
                                        },
                                        "flex":{
                                            "value":"100",
                                            "status":"overridden"
                                        }
                                    },
                                    "children":[
                                        {
                                            "id":50000 + vdgt.postfix,
                                            "type":"statictext",
                                            "flex":"false",
                                            "just_dropped":true,
                                            "attributes":{
                                                "name":{
                                                    "value":"txtText1",
                                                    "status":"overridden"
                                                }
                                            },
                                            "children":[],
                                            "container":"layout_0_row_0_column_0"
                                        }
                                    ],
                                    "animation":{
                                        "in":"fadeIn",
                                        "out":"slideOutLeft"
                                    }
                                }
                            ]
                        }
                    }),
                    src_script : '// this line should not be removed\nvar v1 = angular.module("'+app.name+'",["dfxAppServices"]);\n\nv1.controller( "v1Controller", [ "$scope", function( $scope ) {\n	\n}]);\n',
                    src_styles : ""
                }
            }
        }},
        function(){return{
            method : 'post',
            path   : '/studio/widget/delete/',
            body   : {
                widgetName      : vdgt.name,
                applicationName : app.name,
                platform        : 'web'
            }
        }},
        function(){return{
            method : 'post',
            path   : '/studio/application/delete',
            body   : {
                applicationName : app.name
            }
        }}
    ],
    undefined;

var app  = new App(APP_PRFX),
    vdgt = new App(VDGT_PRFX);

function Cookies () {
    this.bin = {};
    this.packed = '';
}

Cookies.prototype.parse = function (arr) {
    const bin = this.bin;

    arr.forEach(function(raw){
        const pair = raw.split(';')[0].split('=');
        bin[pair[0]] = pair[1];
    });

    this.packed = Object.keys(bin).map(function(name){
        return [ name, bin[name] ].join('=')
    })
    .join('; ');
};


Cookies.prototype.toString = function () {
    return this.packed;
};

const _cookies = new Cookies();

function R ( o ) {
    const
        method = o.method || 'get',
        url = POTOCOL  + '://' + DOMAIN + ':' + PORT + o.path,
        body = o.body && JSON.stringify(o.body) || '',
        contentType = o.contentType || 'application/json',
        contentLength = body.length,
        cookies = _cookies.toString(),
        headers = {
            'Content-Type'  : contentType,
            'Cache-Control' : 'no-cache',
            'Origin'        : POTOCOL  + '://' + DOMAIN + ':' + PORT
        },
        opts = {
            url     : url,
            headers : headers
        };

        if ( cookies ) headers.Cookie = cookies;
        if ( body ) {
            opts.body = body;
            headers['Content-Length'] = contentLength;
        }

        //console.log('OPTS : ', opts);

    return AR[method](opts)
    .then(function(r){
        const rawCookies = r.headers['set-cookie'];
        if ( rawCookies ) _cookies.parse(rawCookies);

        if ( !r.body ) return r;
        //console.log('[R] CT : ', r.headers['content-type']);
        //console.log('[R] IS JSON : ', RGX_IS_CT_JSON.test(r.headers['content-type']));
        if ( RGX_IS_CT_JSON.test(r.headers['content-type'])) {
            try { r.body = JSON.parse(r.body.toString('utf8')); }
            catch (error) {
                console.error(
                    '[ERROR] modem : path "%s"\ncan not parse response body : %s',
                    o.path,
                    r.body.toString('utf8')
                );
                //return Q.reject('can not parse response body');
            }
        } else {
            r.body = r.body.toString('utf8');
        }

        //console.log('------------------------------------ REQUEST');
        //console.log('URL : ',    url);
        //console.log('STATUS : ', r.status);
        //console.log('HEADERS : ', r.headers);
        //console.log('BODY : ',   r.body);
        //console.log('');

        EV.publish('RSD', r);

        return r;
    })
    .fail(function(error){
        //console.log('------------------------------------ ERROR');
        //console.log('URL : ',    url);
        //console.log('STATUS : ', r.status);
        //console.log('HEADERS : ', r.headers);
        //console.log('BODY : ',   r.body);
        //console.log('');

        EV.publish('RSD', error);
    })

}

function random () {
    return '' + (new Date).getTime() +
        '' + Math.floor(Math.random()*1000000) +
        '' + Math.floor(Math.random()*1000000) +
        '' + Math.floor(Math.random()*1000000) +
        '' + Math.floor(Math.random()*1000000) +
        '' + Math.floor(Math.random()*1000000) +
        '' + Math.floor(Math.random()*1000000)
}

function App (prefix) {
    const app = this;
    this.prefix  = prefix;
    this.postfix = random();
    Object.defineProperty(this, 'name', {
        get : function () { return app.prefix + app.postfix }
    });
}

App.prototype.next = function () {
    this.postfix = (new Date).getTime();
};


// Yet Another Event Manager (Pub/Sub)
//
// all listeners are executed in context of a instance of the EventManager


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


R({
    method : 'post',
    path   : '/studio/login',
    body   : {
            userid   : USERID,
            tenantid : TENANTID,
            password : PASSWORD
        }
})
.then(function(r){
    //console.log('STATUS : %s, TO : %s, B : %s', r.status, typeof r.status, (r.status !== 302));
    //console.log('RESULT : %s, B : %s', r.body.result, (!r.body || r.body.result !== 'success'));
    if ( (r.status !== 302) && (!r.body || r.body.result !== 'success') ) return console.log('can not login');
    const
        l = RS.length,
        max = MAX;
    var i = l,
        total = 0;

    EV.subscribe('RSD', function main (event, data){
        if ( i === l ) {
            // next iteration
            if ( max && total === max ) { console.log('---- DONE ----'); return EV.unsubscribe('RSD', main); }
            total++;
            i = 0;
            app.next();
            vdgt.next();
        }

        setTimeout(function(){
            R(RS[i]()).done()
            i++;
        }, TIMEOUT);

    });

    EV.publish('RSD', {});

})
.done();
