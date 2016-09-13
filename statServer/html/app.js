var app = angular.module('stats',['ngMaterial','nvd3'])

    // 'ngMaterial', 'ngMessages', 'material.svgAssetsCache',

    .controller('MainCtrl', ['$scope','$timeout',function($scope, $timeout) {
        var counters = [];
        function push_template(instance_name) {
            $scope.tabs.push({
                title: instance_name,
                options: {
                    chart: {
                        type: 'lineChart',
                        height: 180,
                        margin : {
                            top: 20,
                            right: 100,
                            bottom: 40,
                            left: 100
                        },
                        x: function(d){ if (d) return d.x; },
                        y: function(d){ if (d) return d.y; },
                        useInteractiveGuideline: true,
                        duration: 1000,
                        yAxis: {
                            tickFormat: function(d){
                                return d3.format('%')(d/100);
                            }
                        },
                        xAxis: {
                            tickFormat: function(d){
                                return d3.time.format('%m/%d/%Y %H:%M:%S')(new Date(d * 1000));
                            }
                        }

                    }
                },
                options1: {
                    chart: {
                        type: 'lineChart',
                        height: 180,
                        margin : {
                            top: 20,
                            right: 100,
                            bottom: 40,
                            left: 100
                        },
                        x: function(d){ if (d) return d.x; },
                        y: function(d){ if (d) return d.y; },
                        useInteractiveGuideline: true,
                        duration: 1000,
                        yAxis: {
                            tickFormat: function(d){
                                return d3.format('d')(d);
                            }
                        },
                        xAxis: {
                            tickFormat: function(d){
                                return d3.time.format('%m/%d/%Y %H:%M:%S')(new Date(d * 1000));
                            }
                        }

                    }
                },
                data: [
                    {values: [], key: 'Total'},
                    {values:[], key:"dev"},
                    {values: [], key: 'dep'},
                    {values:[], key:"dfc"},
                ],
                data1: [
                    {values:[], key:"dev"},
                    {values: [], key: 'dep'},
                    {values:[], key:"dfc"},
                    {values: [], key: 'Total'},
                ]
            });
            $scope.emptyTabs = false;
            counters.push({
                cpu : 0,
                req : 0
            });
        }
        $scope.tabs = [];
        console.log("Init");
        $scope.emptyTabs = true;


        GLOBAL_SOCKET.on("statistics", function(data){
            // Add tabs engine
            if (!$scope.tabs.length) {
                push_template(data.instance);
            } else {
                var tab = $scope.tabs.filter(function(tab){
                    return tab.title == data.instance;
                });
                if (tab.length == 0) {
                    push_template(data.instance);
                }
            }

            $scope.$apply();

            //Get index of current tab
            var tab_index = -1;
            $scope.tabs.forEach(function(value, index){
                if (value.title == data.instance) {
                    tab_index = index;
                }
            });

            $timeout(function(){

                if (tab_index > -1) {
                    if (data.type == 'cpu'){
                        var total = 0;
                        if (data.dep) total += parseFloat(data.dep);
                        if (data.dev) total += parseFloat(data.dev);
                        if (data.dfc) total += parseFloat(data.dfc);

                        if (data.dev)  $scope.tabs[tab_index].data[1].values.push({ x: data.time,	y: parseFloat(data.dev)});
                        if (data.dep)  $scope.tabs[tab_index].data[2].values.push({ x: data.time,	y: parseFloat(data.dep)});
                        if (data.dfc)  $scope.tabs[tab_index].data[3].values.push({ x: data.time,	y: parseFloat(data.dfc)});
                        $scope.tabs[tab_index].data[0].values.push({ x: data.time,	y: total});


                        if (counters[tab_index].cpu > 10) {
                            $scope.tabs[tab_index].data[0].values.shift();
                            $scope.tabs[tab_index].data[1].values.shift();
                            $scope.tabs[tab_index].data[2].values.shift();
                            $scope.tabs[tab_index].data[3].values.shift();
                        }
                        counters[tab_index].cpu++;
                    } else if (data.type == 'req') {

                        //////
                        var added = false;
                        $scope.tabs[tab_index].data1.forEach(function(val, index1){
                            val.values.forEach(function(val_datas, index2){
                                if (val_datas.x === data.time) {
                                    console.log("HERE");
                                    console.log(val);
                                    console.log(data);
                                    if (val.key == data.component) {
                                        console.log("HERE1");
                                        if (data.component == 'dev')  $scope.tabs[tab_index].data1[0].values[index2].y++;
                                        if (data.component == 'dep')  $scope.tabs[tab_index].data1[1].values[index2].y++;
                                        if (data.component == 'dfc')  $scope.tabs[tab_index].data1[2].values[index2].y++;
                                        $scope.tabs[tab_index].data1[3].values[index2].y++;
                                        added = true;
                                    }
                                }
                            })
                        });
                        if (!added){
                            if (data.component == 'dev') {
                                $scope.tabs[tab_index].data1[0].values.push({x: data.time, y: 1});
                                $scope.tabs[tab_index].data1[1].values.push({x: data.time, y: 0});
                                $scope.tabs[tab_index].data1[2].values.push({x: data.time, y: 0});
                            }
                            if (data.component == 'dep') {
                                $scope.tabs[tab_index].data1[1].values.push({x: data.time, y: 1});
                                $scope.tabs[tab_index].data1[0].values.push({x: data.time, y: 0});
                                $scope.tabs[tab_index].data1[2].values.push({x: data.time, y: 0});
                            }
                            if (data.component == 'dfc') {
                                $scope.tabs[tab_index].data1[2].values.push({x: data.time, y: 1});
                                $scope.tabs[tab_index].data1[1].values.push({x: data.time, y: 0});
                                $scope.tabs[tab_index].data1[0].values.push({x: data.time, y: 0});
                            }
                            $scope.tabs[tab_index].data1[3].values.push({x: data.time, y: 1})
                            counters[tab_index].req++;
                        }

                        if (counters[tab_index].req > 10) {
                            $scope.tabs[tab_index].data1[0].values.shift();
                            $scope.tabs[tab_index].data1[1].values.shift();
                            $scope.tabs[tab_index].data1[2].values.shift();
                            $scope.tabs[tab_index].data1[3].values.shift();
                        }
                    }
                } else {
                    console.log("Wrong index:", tab_index);
                }

            },1000);
        });
    }]);
