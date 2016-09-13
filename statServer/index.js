var express = require('express');
var config = require('./config.js');
var path = require('path');
var fs = require('fs');
var watchTree = require("fs-watch-tree").watchTree;
var QFS = require('q-io/fs');
var app = express();
var Q = require('q');
var server = require('http').createServer(app);
var socket = require('socket.io').listen(server, { log: false });

app.use("/html", express.static("html"));
app.use("/socket.io", express.static("socket.io"));

(function(){
    if ((!config.logs.cpu) || (!config.logs.request)){
        throw "Please fill out config.js first!";
    }
    // If log files not exists - create new empty files
    var date = new Date();
    Q.all([
        function() {
            return QFS.exists(config.logs.cpu).then(function (exists) {
                if (!exists) {
                    return QFS.makeTree(config.logs.cpu);
                } else {
                    return Q.resolve();
                }
            })
        }(),
        function() {
            return QFS.exists(config.logs.request).then(function (exists) {
                if (!exists) {
                    return QFS.makeTree(config.logs.request);
                } else {
                    return Q.resolve();
                }
            })
        }()
    ]).then(function(res){
        console.log("HERE");
        // watch CPU log files on changes
        var cpuWatcher = watchTree(config.logs.cpu,function (event) {
            if (!event.isDirectory() && !event.isMkdir() && !event.isDelete() && event.isModify() && (path.extname(event.name).substring(1) == 'log') ){
                var filePath = event.name;
                return QFS.exists(filePath).then(function (exists) {
                    if (exists) {
                        return QFS.read(filePath).then(function (cont) {
                            var lines = cont.trim().split('\n');
                            var lastLine = lines.slice(-1)[0];
                            var dataArray = lastLine.trim().split(',');
                            var obj = {
                                type     : 'cpu',
                                dep      : dataArray[0],
                                dev      : dataArray[1],
                                dfc      : dataArray[2],
                                instance : dataArray[3],
                                time     : dataArray[4]
                            }
                                console.log("SEND_CPU");
                                console.log(obj);
                                socket.sockets.emit("statistics", obj);
                        });
                    }
                });
            }
        });

        // watch Requests log files on changes
        var reqWatcher = watchTree(config.logs.request, function(event){
            if (!event.isDirectory() && !event.isMkdir() && !event.isDelete() && event.isModify() && (path.extname(event.name).substring(1) == 'log') ) {
                var filePath = event.name;
                return QFS.exists(filePath).then(function (exists) {
                    if (exists) {
                        return QFS.read(filePath).then(function (cont) {
                            var lines = cont.trim().split('\n');
                            var lastLine = lines.slice(-1)[0];
                            var dataArray = lastLine.trim().split(',');
                            var obj = {
                                type     : 'req',
                                time: dataArray[0],
                                instance: dataArray[1],
                                tenant: dataArray[2],
                                component: dataArray[3],
                                url: dataArray[4]
                            }
                                console.log("SEND_REQ");
                                console.log(obj);
                                socket.sockets.emit("statistics", obj);
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