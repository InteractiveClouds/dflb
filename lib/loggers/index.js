var QFS = require('q-io/fs');
var Q = require('q');
var path_util = require('path');
//var log4js = require('log4js');
//    log4js.loadAppender('file');
var SETTINGS = require('../../settings');

function ConvertToCSV1( obj ) {
    var arr = []
    for (var key in obj){
        arr.push(obj[key]);
    }
    return arr.join(",") + '\n';
}

function ConvertToCSV2 ( obj ) {
    // Sorting keys ('dep', 'dev', 'dfc')
    var keys = Object.keys(obj).sort();
    var arr = [];
    for (var i = 0 ; i < keys.length; i++){
        arr.push(obj[keys[i]]);
    }
    return arr.join(",") + '\n';
}

//function writeLog (path, content) {
//    log4js.addAppender(log4js.appenders.file(path), path);
//    log4js.getLogger(path).info(content);
//    return Q.resolve();
//}

//var instance = {
//    name : "instance name",
//    ip : "instance ip"
//}

module.exports = {
    initCPU : function( instance ) {
        return {
            put : function ( o ) {
                var date = new Date();
                var path = path_util.join(SETTINGS.logsPath, instance.name, SETTINGS.cpuLogsFolderName);
                var filePath = path_util.join(path, date.getFullYear() + '_' + ('0' + date.getMonth()).slice(-2) + '_' + ('0' + date.getDate()).slice(-2)  + '.log' );

                o.instance = instance.name;
                o.time = Math.floor(Date.now() / 1000);
                if (!o.dep) o.dep = 0;
                if (!o.dev) o.dev = 0;
                if (!o.dfc) o.dfc = 0;
                var content = ConvertToCSV2( o );

                return QFS.exists(path).then(function(exists){
                    if (!exists) {
                        return QFS.makeTree(path).then(function(){
                            var instanceConfigFilePath = path_util.join(path, "..", SETTINGS.instanceConfigFileName);
                            var instanceConfigFileContent = {
                                name : instance.name,
                                dev : {
                                    ip : instance.ip,
                                    port : 3001
                                },
                                dep : {
                                    ip : instance.ip,
                                    port : 3002
                                },
                                cmp : {
                                    ip : instance.ip,
                                    port : 3003
                                }
                            }
                            return QFS.write(instanceConfigFilePath, JSON.stringify(instanceConfigFileContent)).then(function(){
                                //return writeLog(filePath, content);
                                return QFS.append(filePath, content);
                            });
                        })
                    } else {
                        //return writeLog(filePath, content);
                        return QFS.append(filePath, content);
                    }
                });

            }
        }
    },

    initREQ : function() {
        return {
            put : function ( o ) {
                var date = new Date();
                var path = path_util.join(SETTINGS.logsPath, o.instance, SETTINGS.requestLogsFolderName);
                var filePath = path_util.join( path, date.getFullYear() + '_' + ('0' + date.getMonth()).slice(-2) + '_' + ('0' + date.getDate()).slice(-2)  + '.log' );

                var content = ConvertToCSV1( o );

                return QFS.exists(path).then(function(exists){
                    if (!exists) {
                        return QFS.makeTree(path).then(function(){
                            //return writeLog(filePath, content);
                            return QFS.append(filePath, content);
                        });
                    } else {
                        //return writeLog(filePath, content);
                        return QFS.append(filePath, content);
                    }
                });

            }
        }
    }
}