function CyclicBin ( length ) {
    this._length   = length;
    this._pointer = 0;
    this._bin     = new Array(length);

    Object.defineProperty(this, 'length', {
        enumerable   : false,
        configurable : false,
        writable     : false,
        value        : length
    });
}

CyclicBin.prototype.push = function ( value ) {
    const old = this._bin[this._pointer];
    this._bin[this._pointer] = value;
    if ( ++this._pointer === this._length ) this._pointer = 0;
    return old;
};

CyclicBin.prototype.asArray = function () {
    return [].concat(
        this._bin.slice(this._pointer, this._length),
        this._bin.slice(0, this._pointer)
    );
};

exports.Instance = CyclicBin;
