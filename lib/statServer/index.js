var net  = require('net'),
    http = require('http'),
    app  = require('express')();

var server = net.createServer(function(socket) {

    const CLIENT = socket.remoteAddress + ':' + socket.remotePort;

    console.log('client connected ' + CLIENT);

    socket.setKeepAlive(true);
    socket.setEncoding('utf8');

    socket.on('end', function () {
        console.log('client disconnected ' + CLIENT);
    });

    socket.on('data', function (data) {
        receiveDataChunk(data);
    });

    socket.on('error', function ( error ) {
        console.log('client error ' + CLIENT, error);
    });
});

server.listen(40008, '127.0.0.1');

app.get('/ping', function (req, res, next){
    res.end('pong');
});

app.get('/stat/:server', function (req, res, next){
    const
        sname  = req.params.server,
        comps  = tickBin[sname] ? tickBin[sname].components : {},
        cnames = Object.keys(comps), // component names
        stat   = {};
    for ( var c = 0, cl = cnames.length; c < cl; c++ ) {
        var cname    = cnames[c],
            tenants  = comps[cname],
            tnames   = Object.keys(tenants), // tenant names
            statComp = stat[cname] = {};

        for ( var t = 0, tl = tnames.length; t < tl; t++ ) {
            var tname = tnames[t];

            statComp[tname] = sumArray(tenants[tname].cbin.asArray());
        }
    }
    res.json(stat);
});

http.createServer(app).listen(40009, '127.0.0.1');

function sumArray ( a ) {
    for ( var sum = i = 0, l = a.length; i < l; sum += a[i++] );
    return sum;
}



var bin = '';
const POCKET_DIVIDER = '||';

var tlast = (new Date).getTime();

function receiveDataChunk ( chunk ) {
    chunk = chunk.toString('utf8');

    const
        total = bin + chunk,
        indexOfLastDivider = total.lastIndexOf('||'),
        hasDivider = indexOfLastDivider !== -1,
        unfinished = hasDivider ? total.slice(indexOfLastDivider + 2) : total,
        finished   = total.slice(0, indexOfLastDivider),
        parts = finished.replace(/^||/, '').split('||');

    bin = unfinished;

    var tnow = (new Date).getTime();
    tlast = tnow;

    if ( !hasDivider ) return;
    for ( var i = 0, l = parts.length; i < l; statRequest(parse(parts[i++])) );
}

function parse ( raw ) {
    const parts = raw.split('::');

    return {
        server : unshield(parts[0]),
        cname  : unshield(parts[1]),
        tenant : unshield(parts[2]),
        url    : unshield(parts[3])
    }
}

const
    CyclicBin = require('../cyclicBin'),
    tickBin = {},
    SPERIOD  = 20,
    STIMEOUT = 5 * 1000;

function statRequest ( pocket ) {
    const
        server = pocket.server,
        cname  = pocket.cname,
        tenant = pocket.tenant,
        url    = pocket.url;

    var $server = tickBin[server];
    if ( !$server ) $server = tickBin[server] = {components : {}};
    var $comp = $server.components[cname];
    if ( !$comp ) $comp = $server.components[cname] = {};
    var $tenant = $comp[tenant];
    if ( !$tenant ) $tenant = $comp[tenant] = {last : 0, cbin : new CyclicBin.Instance(SPERIOD)};

    $tenant.last++;
}

setInterval(sTick, STIMEOUT);

function sTick () {
    const snames = Object.keys(tickBin); // server names
    for ( var s = 0, sl = snames.length; s < sl; s++ ) {
        var comps  = tickBin[snames[s]].components,
            cnames = Object.keys(comps); // component names
        for ( var c = 0, cl = cnames.length; c < cl; c++ ) {
            var tenants = comps[cnames[c]],
                tnames  = Object.keys(tenants); // tenant names
            for ( var t = 0, tl = tnames.length; t < tl; t++ ) {
                var tenant = tenants[tnames[t]];
                tenant.cbin.push(tenant.last);
                tenant.last = 0;
            }
        }
    }
}

function unshield ( str ) {
    return str.replace(/\\:/g, ':').replace(/\\\|/g, '|');
}
