var colors = require('colors'),
    glob = require('glob'),
    resemble = require('node-resemble-js'),
    path = require('path'),
    vow = require('vow'),
    args = process.argv;

if (args.length < 4) {
    console.error('Must be 2 arguments');
    process.exit(1);
}

var folder1 = path.resolve(process.argv[2]),
    folder2 = path.resolve(process.argv[3]),
    folder1Images = glob.sync('**/*.png', { cwd: folder1 }),
    folder2Images = glob.sync('**/*.png', { cwd: folder2 });

if (folder1Images.length !== folder2Images.length) {
    console.error('Folders contain different number of images');
    process.exit(1);
}

var tasks = folder1Images.map(function(imagePath) {
    var deferred = vow.defer(),
        diff = resemble(path.resolve(folder1, imagePath))
            .compareTo(path.resolve(folder2, imagePath));

    diff.onComplete(function(data) {
        if (parseFloat(data.misMatchPercentage) > 0 || data.dimensionDifference.width || data.dimensionDifference.height) {
            console.error(('image ' + imagePath + ' is different in folders').red);
        }

        deferred.resolve(1);
    });

    return deferred.promise();
});

vow.all(tasks).then(function() {
    console.log('Done');
});
