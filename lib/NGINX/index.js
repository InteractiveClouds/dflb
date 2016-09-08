const
    Q  = require('q'),
    fs = require('fs'),
    CP = require('child_process'),
    MAP_PATH = CFG.tenantsMapPath,
    RGX_CNAME = /^(dev|dep|dfc)$/,
    RGX_MAP_LINE = /^([^=]+)=([^=]+)$/;

exports.readConfig = function () {

    return readFile(MAP_PATH)
    .then(function(cnt){
        const lines = cnt.split('\n');
        var res, cname, parsed = {};

        for ( var i = 0, l = lines.length, line = lines[i]; i < l; line = lines[++i] ) {
            if ( line === '' ) continue;
            res = RGX_MAP_LINE.exec(line) || RGX_CNAME.exec(line) || [];
            if ( res.length === 2 && !parsed.hasOwnProperty(res[1]) ) {
                cname = res[1];
                parsed[cname] = {};
            } else if ( res.length === 3 && cname ) {
                parsed[cname][res[1]] = res[2];
            } else return Q.reject('Syntax error at line ' + i);
        }

        return parsed;
    });
};

exports.changeConfig = function ( config ) {

    var cnt = '';

    for (var cname in config ) {
        cnt += cname + "\n";
        for (var tenant in config[cname] ) {
            cnt += tenant + '=' + config[cname][tenant] + "\n"
        }
    }

    cnt = cnt.replace(/\n$/, '');

    console.log('changing config to \n>' + cnt + '<\n');

    return writeFile(MAP_PATH, cnt)
    .then(function(){

        console.log('restarting nginx...');

        const
            D = Q.defer(),
            child = CP.spawn(
                'nginx-perl',
                ['-s', 'reload'],
                {
                    detached : true
                }
            )
            .on('error', function(error){
                console.error('NGINX ERROR : ', error);
            })
            .on('data', function(data){
                console.error('NGINX DATA : ', data);
            })
            .on('close', function(exitCode){

                console.error('NGINX EXIT CODE : ', exitCode);

                if ( exitCode !== 0 && exitCode !== 130 ) {
                    D.reject(Error('exit code is : ' + exitCode));
                } else {
                    D.resolve();
                }
            });

        child.unref();

        return D.promise;
    });
};

function writeFile ( filePath, content ) {
    const D = Q.defer();

    fs.writeFile(filePath, content, function (error) {
        error ? D.reject(error) : D.resolve();
    });

    return D.promise;
}

function readFile ( filePath ) {
    const D = Q.defer();

    fs.readFile(filePath, {encoding : 'utf8'}, function (error, cnt) {
        error ? D.reject(error) : D.resolve(cnt);
    });

    return D.promise;
}
