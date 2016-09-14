const Q = require('q');

exports.convertToEventName = function ( type, ip ) {
    return type + '_' + ip;
};


/**
 * very primitive finding `subset` which `sum` is not bigger than `value` 
 *
 * @param {Array} set sorted one
 * @param {Array} subset predefined subset ( can be empty array as well )
 * @param {Number} max
 * @param {Function} function ( element ) should return value for the element
 *                      of the set;
 *                      if `set` is Array of Numbers then it can be
 *                      function(d){return d}
 */
exports.findSubsetForSum = function ( set, subset, max, getValue ) {

    var left = max;

    set.sort(function(a, b){ return getValue(a) - getValue(b) });

    for ( var i = set.length - 1; i >= 0; i-- ) {
        var value = getValue(set[i]);
        if ( value > left ) continue;
        subset.push(set.splice(i, 1)[0]);
        left -= value;
    }
}

exports.serverNames = (function(){
    const 
        free = [
            'Alfred_Binet',
            'Gottlieb_Daimler',
            'Max_Delbruck',
            'Otto_Hahn',
            'John_Dalton',
            'Carl_Sagan',
            'Steven_Chu'
        ],
        assigned = {};

    var counter = 0;

    return {
        get : function(){
            var name = '';
            while ( free.length && !name ) {
                name = free.splice( random(free.length - 1), 1 )[0];
                if ( assigned.hasOwnProperty(name) ) name = '';
            }
            if ( !name ) while ( !name ) {
                name = ++counter;
                if ( assigned.hasOwnProperty(name) ) name = '';
            }
            assigned[name] = true;
            return name;
        },

        markAsAssigned : function ( name ) {
            return name
                ? (assigned[name] = true) && name
                : ''
        },

        release : function ( name ) {
            delete assigned[name];
            free.push(name);
        }
    }

    function random ( min, max ) {
        if ( !max ) { max = min; min = 0; }
        return min + Math.round(Math.random() * (max - min) );
    }

})();

exports.getMyLocalIP = function () {
    const D = Q.defer();
    require('child_process').exec('hostname -I', {timeout:5000}, function (error, stdout, stderr){
        error || stderr
            ? D.reject(error || stderr)
            : D.resolve(stdout.replace(/[\s\r\n]+$/, ''));
    });
    return D.promise;
}
