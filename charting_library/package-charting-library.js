var fs = require("fs");
var path = require("path");
var archiver = require("archiver");
const md5File = require("md5-file");


var outputFile = path.join(__dirname, "charting_library.zip");
const outFilename = path.basename(outputFile);
var ignoreFiles = [path.basename(__filename), outFilename, outFilename + ".md5", "install-charting-library.js"];

/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
function zipDirectory(source, out) {
    const archive = archiver("zip", { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .glob("**", {
                cwd: source,
                ignore: ignoreFiles,
            })
            .on("error", err => reject(err))
            .pipe(stream);
        stream.on("close", () => resolve());
        archive.finalize();
    });
}

function getMD5Digest(file) {
    const hash = md5File.sync(file);
    return hash.toUpperCase();
}

zipDirectory(__dirname, outputFile)
    .then(() => {
        console.log("Input folder compressed to " + outputFile);
        var digest = getMD5Digest(outputFile);
        console.log("MD5: " + digest);
        fs.writeFileSync(outputFile + ".md5", digest);
        process.exit(0);
    });