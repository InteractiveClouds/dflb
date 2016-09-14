//var data1 = [
//    {values: [{x:1,y:0}], key: 'Total'},
//    {values:[{x:1,y:0}], key:"Development"},
//    {values: [], key: 'Deployment'},
//    {values:[], key:"Compiler"},
//];
//
////console.log(JSON.stringify(data1));
////
////data1.map(function(data){
////    data.map(function(val){
////        if (val.x == 1){
////
////        }
////    })
////})
//
//data1.forEach(function(data, index1){
//    data.values.forEach(function(in_data, index2){
//        if(in_data.x == 1) {
//            data1[index1].values[index2].y++;
//            data1
//        }
//    })
//})
//
//console.log(JSON.stringify(data1));

var log = require('.');
var Q = require('q');
var fs = require('fs');
var QFS = require('q-io/fs');
//var watchTree = require("fs-watch-tree").watchTree;

//var watcher = watchTree("/tmp/logs",function (event) {
//    console.log(event);
//});

var watch = require('node-watch');
//
//watch('/tmp/logs', { recursive: true, followSymLinks: true }, function() {
//    console.log(arguments);
//});

//QFS.read('/tmp/test/cpulogs/2016_08_05.log').then(function(cont){
//    var lines = cont.trim().split('\n');
//    var lastLine = lines.slice(-1)[0];
//    var dataArray = lastLine.trim().split(',');
//    var obj = {
//        dep : dataArray[0],
//        dev : dataArray[1],
//        dfc : dataArray[2],
//        instance : dataArray[3]
//    }
//    console.log(obj);
//    // ('dep', 'dev', 'dfc')
//}).fail(function(err){
//    console.log(err);
//})



var cpu = log.initCPU({name : "test_instance1", ip : "127.0.0.1"});


cpu.put({
    dev : Math.round(Math.random() * 100),
    dfc : Math.round(Math.random() * 100),
    dep : Math.round(Math.random() * 100)
}).then(function(){
    var cpu1 = log.initCPU({name : "test_instance2", ip : "127.0.0.2"});
    cpu1.put({
        dev : Math.round(Math.random() * 100),
        dfc : Math.round(Math.random() * 100),
        dep : Math.round(Math.random() * 100)
    }).then(function(){

        cpu.put({
            dev : Math.round(Math.random() * 100),
            dfc : Math.round(Math.random() * 100),
            dep : Math.round(Math.random() * 100)
        }).then(function(){
            var cpu = log.initCPU({name : "test_instance3", ip : "127.0.0.3"});
            cpu.put({
                dev : Math.round(Math.random() * 100),
                dfc : Math.round(Math.random() * 100),
                dep : Math.round(Math.random() * 100)
            }).then(function(){
                var cpu = log.initCPU({name : "test_instance4", ip : "127.0.0.3"});
                cpu.put({
                    dev : Math.round(Math.random() * 100),
                    dfc : Math.round(Math.random() * 100),
                    dep : Math.round(Math.random() * 100)
                })
            })
        })
    })
})

var req = log.initREQ();


req.put({
    time      :  Math.floor(Date.now() / 1000) + 1,
    instance  : 'test_instance1',
    tenant    : 'test123',
    component : 'dev',
    url       : 'http://dfx.host:3000/studio/test/login'
}).then(function(){
    req.put({
        time      :  Math.floor(Date.now() / 1000) + 5,
        instance  : 'test_instance2',
        tenant    : 'test12',
        component : 'dep',
        url       : 'http://dfx.host:3000/studio/test/login'
    }).then(function(){
        req.put({
            time      :  Math.floor(Date.now() / 1000 + 6),
            instance  : 'test_instance3',
            tenant    : 'Demo',
            component : 'dfc',
            url       : 'http://dfx.host:3000/studio/test/login'
        });
    })
})

//var cpu1 = log.initCPU("/tmp/test/cpulogs/","test_instance1");
//cpu1.putCPU({
//    dev : Math.round(Math.random() * 100),
//    dfc : Math.round(Math.random() * 100),
//    dep : Math.round(Math.random() * 100)
//});
//cpu.putCPU({
//    dev : Math.round(Math.random() * 100),
//    dfc : Math.round(Math.random() * 100),
//    dep : Math.round(Math.random() * 100)
//});


//log.initREQ("/tmp/test/requestlogs/");
//var entities = ['dev','dep','dfc'];

//setInterval(function(){
//    var time = Math.floor(Date.now() / 1000) - 2;
//
//    var obj = {
//        time      : time,
//        instance  : 'test_instance',
//        tenant    : 'test',
//        component : entities[Math.floor(Math.random() * entities.length)],
//        url       : 'http://dfx.host:3000/studio/test/login'
//    }
//    return log.putREQ(obj).then(function(){
//        var obj = {
//            dev : Math.round(Math.random() * 100),
//            dfc : Math.round(Math.random() * 100),
//            dep : Math.round(Math.random() * 100)
//        }
//        return log.putCPU(obj);
//    });
//
//}, 2000);

//
//fs.watch('/tmp/test/cpulogs', function (event, filename) {
//    console.log('event is: ' + event);
//    if (filename) {
//        console.log('filename provided: ' + filename);
//    } else {
//        console.log('filename not provided');
//    }
//});

