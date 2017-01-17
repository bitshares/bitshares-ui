var Benchmark = require("benchmark");
var marketClasses = require("./MarketClasses");

const asset1 = {asset_id: "1.3.0", precision: 5};
const asset2 = {asset_id: "1.3.121", precision: 4}; // bitUSD
const asset3 = {asset_id: "1.3.113", precision: 4}; // bitCNY
const assets = {"1.3.0": asset1, "1.3.121": asset2, "1.3.113": asset3};

/* marketClasses.Asset creation */
let suite = new Benchmark.Suite;

let assetToClone = new marketClasses.Asset({
    asset_id: "1.3.121",
    precision: 4,
    amount: 1223
});
suite.add("Asset#empty", function() {
    new marketClasses.Asset();
})
.add("Asset#from_sats", function() {
    new marketClasses.Asset({
        asset_id: "1.3.121",
        precision: 4,
        amount: 1223
    });
})
.add("Asset#from_real", function() {
    new marketClasses.Asset({
        asset_id: "1.3.121",
        precision: 4,
        real: 0.1223
    });
})
.add("Asset#clone", function() {
    assetToClone.clone();
})
// add listeners
.on("cycle", function(event) {
    console.log(String(event.target));
})
.on("complete", function() {
    console.log("Fastest is " + this.filter("fastest").map("name"));
})
.run({"async": false});

/* Price creation */
let base = new marketClasses.Asset({asset_id: "1.3.121", amount: 36, precision: 4});
let quote = new marketClasses.Asset({asset_id: "1.3.0", amount: 86275});

suite = new Benchmark.Suite;

let priceToClone = new marketClasses.Price({base: base, quote: quote});
suite.add("Price#from_sats", function() {
    new marketClasses.Price({base: base, quote: quote});
})
.add("Price#from_real", function() {
    new marketClasses.Price({base: base, quote: quote, real: 23.233});
})
.add("Price#clone", function() {
    priceToClone.clone();
})
.add("FeedPrice#from_sats", function() {
    new marketClasses.FeedPrice({priceObject: {base: base, quote: quote}, market_base: "1.3.0", sqr: 1100, assets: assets});
})
// add listeners
.on("cycle", function(event) {
    console.log(String(event.target));
})
.on("complete", function() {
    console.log("Fastest is " + this.filter("fastest").map("name"));
})
.run({"async": false});
