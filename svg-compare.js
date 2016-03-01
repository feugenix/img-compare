var colors = require('colors'),
    glob = require('glob'),
    resemble = require('node-resemble-js'),
    Rsvg = require('librsvg').Rsvg,
    path = require('path'),
    fs = require('fs'),
    vow = require('vow'),
    args = process.argv;

if (args.length < 4) {
    console.error('Must be 2 arguments');
    process.exit(1);
}

var mask = '**/*.svg',
    folder1 = path.resolve(process.argv[2]),
    folder2 = path.resolve(process.argv[3]),
    folder1Images = glob.sync(mask, { cwd: folder1 }),
    folder2Images = glob.sync(mask, { cwd: folder2 });

if (folder1Images.length !== folder2Images.length) {
    console.error('Folders contain different number of images');
    process.exit(1);
}

function renderSvg(svg) {
    return svg.render({
        format: 'png',
        width: svg.width,
        height: svg.height
    }).data;
}

function getSvgContent(imagePath) {
    var svg = new Rsvg(),
        deferred = vow.defer();

    fs.createReadStream(imagePath).pipe(svg);

    svg.on('finish', function() {
        deferred.resolve(renderSvg(svg));
    });

    return deferred.promise();
}

var tasks = folder1Images.map(function(imagePath) {
    return vow
        .all([getSvgContent(path.resolve(folder1, imagePath)), getSvgContent(path.resolve(folder2, imagePath))])
        .spread(function(svg1, svg2) {
            var diff = resemble(svg1).compareTo(svg2),
                deffered = vow.defer();

            diff.onComplete(function(data) {
                if (parseFloat(data.misMatchPercentage) > 0.01 || data.dimensionDifference.width || data.dimensionDifference.height) {
                    console.error(('images ' + imagePath + ' are different').red);
                }

                deffered.resolve(1);
            });

            return deffered.promise();
        });
});

vow.all(tasks).then(function() {
    console.log('Done');
});
