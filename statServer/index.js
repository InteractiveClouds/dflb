var express = require('express');
var config = require('./config.js');
var path = require('path');
var fs = require('fs');
var watch = require('node-watch');
var QFS = require('q-io/fs');
var app = express();
var Q = require('q');
var server = require('http').createServer(app);
var socket = require('socket.io').listen(server, { log: false });

app.use("/html", express.static("html"));
app.use("/socket.io", express.static("socket.io"));

(function(){
    // If log files not exists - create new empty files
    Q.all([
        function() {
            return QFS.exists(config.logsPath).then(function (exists) {
                if (!exists) {
                    return QFS.makeTree(config.logsPath);
                } else {
                    return Q.resolve();
                }
            })
        }()
    ]).then(function(res){
        watch(config.logsPath, {followSymLinks: true}, function( event ) {
            if (path.extname(event).substring(1) == 'log'){
                var filePath = event;
                return QFS.exists(filePath).then(function (exists) {
                    if (exists) {
                        return QFS.read(filePath).then(function (cont) {
                            return QFS.read(path.join(filePath, '..', '..', 'config.json')).then(function (configFileContent) {
                                //cpu
                                if (filePath.indexOf('/' + config.cpuLogsFolderName + '/') > 0) {
                                    var lines = cont.trim().split('\n');
                                    var lastLine = lines.slice(-1)[0];
                                    var dataArray = lastLine.trim().split(',');
                                    var obj = {
                                        type: 'cpu',
                                        dep: dataArray[0],
                                        dev: dataArray[1],
                                        dfc: dataArray[2],
                                        instance: dataArray[3],
                                        time: dataArray[4],
                                        info: JSON.parse(configFileContent)
                                    }
                                    console.log("SEND_CPU");
                                    console.log(obj);
                                    socket.sockets.emit("statistics", obj);
                                }

                                // requests
                                if (filePath.indexOf('/' + config.requestLogsFolderName + '/') > 0) {
                                    var lines = cont.trim().split('\n');
                                    var lastLine = lines.slice(-1)[0];
                                    var dataArray = lastLine.trim().split(',');
                                    var obj = {
                                        type: 'req',
                                        time: dataArray[0],
                                        instance: dataArray[1],
                                        tenant: dataArray[2],
                                        component: dataArray[3],
                                        url: dataArray[4],
                                        info: JSON.parse(configFileContent)
                                    }
                                    console.log("SEND_REQ");
                                    console.log(obj);
                                    socket.sockets.emit("statistics", obj);
                                }
                            });
                        });
                    }
                });
            }
        });
    }).fail(function(err){
        console.log(err);
    });
}());

app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname,'html','index.html'));
});

server.listen(config.port, function () {
    console.log('Server listening on port ' + config.port);
});