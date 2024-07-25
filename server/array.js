exports.getRandomIndex = function(array) {
    return Math.floor(Math.random() * array.length);
}

exports.getRandomElement = function(array) {
    return array[exports.getRandomIndex(array)];
}