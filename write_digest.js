var crypto = require("crypto");
var fs = require("fs");
var os = require("os");
var path = require("path");
var packageJSON = require("./package.json");
var jetpack = require("fs-jetpack");
var releasesDir = jetpack.dir("./build");

console.log(`\nUI version ${packageJSON.version} sha256 sums:\n`);

var platform = os.platform();

var binaryPath = "build/binaries/";
var htmlPath = "build/";

var files = [];
var binaries = fs.readdirSync(binaryPath).filter(function(a) {
    return a.indexOf(packageJSON.version) !== -1;
});
binaries.forEach(function(file) {
    files.push({fullPath: path.resolve(binaryPath, file), fileName: file});
});
var htmlZipFiles = fs.readdirSync(htmlPath).filter(function(a) {
    return a.indexOf(packageJSON.version) !== -1 && a.indexOf("zip") !== -1;
});
htmlZipFiles.forEach(function(file) {
    files.push({fullPath: path.resolve(htmlPath, file), fileName: file});
});

if (!files.length) return;
releasesDir.remove(`release-checksums-${platform}`);
files.forEach(function(file) {
    var sha256 = crypto.createHash("sha256");
    var s = fs.ReadStream(file.fullPath);
    s.on("data", function(d) {
        sha256.update(d);
    });

    s.on("end", function() {
        var d2 = sha256.digest("hex");

        console.log(`__${file.fileName}__`);
        console.log("`" + d2 + "`");

        releasesDir.append(
            `release-checksums-${platform}`,
            `\n__${file.fileName}__` + "\n`" + d2 + "`"
        );
    });
});
