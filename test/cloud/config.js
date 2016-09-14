module.exports = {

    events : null, // reserved
    tenantsMapPath : '/var/lib/dreamface/data/tenants.map',
    instanceImageName : 'dfx',
    statServer : {
        url : 'http://127.0.0.1:40009/stat/',
    },
    dfm : {
        port      : 3049,
        prototcol : 'http',
        camtime   : 5,
    },
    my : {
        port : 3050,
        protocol : 'http', // TODO use it while creating server
    },
    WAIT_FOR_DFMUP : 10000,
    WAIT_FOR_CUP   : 10000,
    loadLevels : {
        regular : {
            idle : 1,
            high : 9
        },
        master : {
            idle : -1,
            high : 6
        }
    },
    docker_daemon : {},
    cConfigs : {
        "dev" : {
            "config" : {
                "server_host" : "0.0.0.0",
                "server_port" : 3000,
                "edition": "development",
                "storage": "mongod",
                "external_server_host": "192.168.99.100",
                "external_server_port": 3000,
                "docker_daemon" : {
                    "useDefaultSettings" : true
                },
                "studio_version": 3,
                "resources_development_path": "/var/lib/dreamface/data/resources",
                "tempDirForTemplates" : "/var/lib/dreamface/data/temptemplates",
                "tempDir" : "/var/lib/dreamface/data/tmp",
                "app_build_path": "/var/lib/dreamface/data/app_builds",
                "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf",
                "mdbw_options" : {
                    "host" : "192.168.1.119",
                    "port" : 27017
                },
                //"X-DREAMFACE-SERVER" : cloud.servers[0].name,
                "redis_config" : {
                    "host" : "192.168.1.119"
                },
                compiler : {
                    host: '192.168.99.100',
                    port: 3002
                }
            }
        },
        "dep" : {
            "config" : {
                "server_host" : "0.0.0.0",
                "edition"     : "deployment",
                "storage"     : "file",
                "server_port" : 3001,
                "deploy_path" : "/var/lib/dreamface/data/deploy",
                "fsdb_path"   : "/var/lib/dreamface/data/app_fsdb",
                "tempDir"     : "/var/lib/dreamface/data/tmp",
                "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf",
                "redis_config" : {
                    "host" : "192.168.1.119"
                }
            }
        },
        "dfc" : {
            "config" : {
                "server_port" : 3002,
                "dfx_path" : "/Users/surr/d/p/dfx",
                "dfx_servers" : [
                    {
                        "name" : "dfx",
                        "cfg"  : {
                            "address"        : "http://192.168.99.100:3000/",
                            "auth_conf_path" : "/var/lib/dreamface/data/.auth.conf"
                        }
                    }
                ],
                "target_dir" : "/var/lib/dreamface/data/comptasks",
                "tmp_dir"    : "/var/lib/dreamface/data/comptmp"
            }
        }
    }
}
