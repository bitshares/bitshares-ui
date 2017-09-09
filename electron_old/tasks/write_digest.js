var crypto = require('crypto');
var fs = require('fs');
var path = require("path");
var utils = require('./utils');
var jetpack = require('fs-jetpack');
var releasesDir = jetpack.dir('./releases');

var currentRelease = releasesDir.read("current-release.json", "json");

// change the algo to sha1, sha256 etc according to your requirements
var sha1 = crypto.createHash('sha1');
var sha256 = crypto.createHash('sha256');

var file = path.resolve('releases/', currentRelease[utils.os()]);
var s = fs.ReadStream(file);
s.on('data', function(d) {
    sha1.update(d);
    sha256.update(d);
});

s.on('end', function() {
    var d = sha1.digest('hex');
    var d2 = sha256.digest('hex');

    console.log(currentRelease[utils.os()]);
    console.log("sha1:", d);
    console.log("sha256:", d2);

    releasesDir.write("current-hash.json", {
        file: currentRelease[utils.os()],
        os: utils.os(),
        sha1: d,
        sha256: d2
    })
});
