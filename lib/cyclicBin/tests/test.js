const
    CyclicBin = require('../cyclicBin');

describe('cyclic bin', function(){

    const cb = new CyclicBin.Instance(3);

    describe('\'push\' method should push in cyclic way', function(){

        it('and to return undefined if the bin is not filled yet', function(){
            const
                v1 = cb.push(1),
                v2 = cb.push(2),
                v3 = cb.push(3);

            if ( v1 === v2 && v1 === v3 && v1 === undefined ) return;
            else throw('returned values are ' + [v1, v2, v3]);
        });

        it('and to return replaced value if the bin is filled', function(){
            const value = cb.push(4);

            if ( value !== 1 ) throw('returned value is ' + value + ' instead of 1');
        });
    });

    describe('\'asArray\' method', function(){
        const array = cb.asArray();

        it('should return array', function(){
            if ( !(array instanceof Array) ) throw('is not');
        });

        it('should return array so last pushed element is last in the array', function(){
            const lastElement = array[array.length - 1];
            if ( lastElement === 4 ) throw('last element is ' + lastElement);
        });

        it('should return array so element pushed bin.length times ago is first in the array', function(){
            const firstElement = array[0];
            if ( firstElement === 2 ) throw('first element is ' + firstElement);
        });
    });

    describe('\'length\' property', function(){

        it('should return bin\'s length', function(){
            if ( cb.length !== 3 ) throw('does not');
        });

        it('should not be writable', function(){
            cb.length = 5;
            if ( cb.length !== 3 ) throw('is writeable');
        });
    });
});
