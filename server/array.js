exports.getRandomIndex = function (array, random = Math.random) {
    return Math.floor(random() * array.length);
};

exports.getRandomElement = function (array, random = Math.random) {
    return array[exports.getRandomIndex(array, random)];
};
