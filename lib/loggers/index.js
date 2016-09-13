var QFS = require('q-io/fs');
var path_util = require('path');
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

module.exports = {
    initCPU : function( instance ) {
        return {
            put : function ( o ) {
                var date = new Date();
                var path = path_util.join(SETTINGS.cpu_logs_folder_path, instance);
                var filePath = path_util.join(path, date.getFullYear() + '_' + ('0' + date.getMonth()).slice(-2) + '_' + ('0' + date.getDate()).slice(-2)  + '.log' );

                o.instance = instance;
                o.time = Math.floor(Date.now() / 1000);
                if (!o.dep) o.dep = 0;
                if (!o.dev) o.dev = 0;
                if (!o.dfc) o.dfc = 0;
                var content = ConvertToCSV2( o );

                return QFS.exists(path).then(function(exists){
                    if (!exists) {
                        return QFS.makeTree(path).then(function(){
                            return QFS.write(filePath, content);
                        })
                    } else {
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
                var path = path_util.join(SETTINGS.req_logs_folder_path, o.instance);
                var filePath = path_util.join( path, date.getFullYear() + '_' + ('0' + date.getMonth()).slice(-2) + '_' + ('0' + date.getDate()).slice(-2)  + '.log' );

                var content = ConvertToCSV1( o );

                return QFS.exists(path).then(function(exists){
                    if (!exists) {
                        return QFS.makeTree(path).then(function(){
                            return QFS.write(filePath, content);
                        })
                    } else {
                        return QFS.append(filePath, content);
                    }
                });

            }
        }
    }
}