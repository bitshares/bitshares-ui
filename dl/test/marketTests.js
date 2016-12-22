import {LimitOrderCreate, realToRatio, Price, Asset, limitByPrecision,
    precisionToRatio, LimitOrder} from "../src/common/MarketClasses";
import assert from "assert";

console.log("**** Starting market tests here ****");

describe("Utility functions", function() {

    describe("limitByPrecision", function() {
        it("Limits to precision without rounding", function() {
            assert.equal(limitByPrecision(1.23236, 4), 1.2323, "Value should be equal to 1.2323");
        });

        it("Does not add extra digits", function() {
            let num = limitByPrecision(1.23236, 8);
            assert.equal(num, 1.23236, "Value should be equal to 1.23236");
            assert.equal(num.toString().length, 7, "Length should be equal to 7");
        });
    });

    describe("precisionToRatio", function() {
        it("Returns the multiplier for an integer precision", function() {
            assert.equal(precisionToRatio(2), 100, "Value should equal 100");
            assert.equal(precisionToRatio(5), 100000, "Value should equal 100000");
            assert.equal(precisionToRatio(8), 100000000, "Value should equal 100000000");
        });
    });
});

describe("Asset", function() {

    it("Instantiates empty", function() {
        let asset = new Asset();
        assert.equal(asset.asset_id, "1.3.0", "Default asset should be 1.3.0");
        assert.equal(asset.amount, 0, "Default amount should be 0");
        assert.equal(asset.satoshi, 100000, "Satoshi should be 100000");
    });

    it("Instantiates with values", function() {
        let asset = new Asset({asset_id: "1.3.121", amount: 242, precision: 4});
        assert.equal(asset.asset_id, "1.3.121", "Asset should be 1.3.121");
        assert.equal(asset.amount, 242, "Amount should be 242");
        assert.equal(asset.satoshi, 10000, "Satoshi should be 10000");
    });

    it("Instantiates from real number", function() {
        let asset = new Asset({asset_id: "1.3.0", real: 1});
        assert.equal(asset.asset_id, "1.3.0", "Asset should be 1.3.0");
        assert.equal(asset.amount, 100000, "Amount should be 242");
        assert.equal(asset.satoshi, 100000, "Satoshi should be 10000");
    });

    it("Can be added", function() {
        let asset = new Asset({asset_id: "1.3.121", amount: 242});
        let asset2 = new Asset({asset_id: "1.3.121", amount: 242});
        asset.plus(asset2);
        assert.equal(asset.asset_id, "1.3.121", "Asset should be 1.3.121");
        assert.equal(asset.amount, 484, "Amount should be 484");
    });

    it("Can be subtracted", function() {
        let asset = new Asset({asset_id: "1.3.121", amount: 242});
        let asset2 = new Asset({asset_id: "1.3.121", amount: 242});
        asset.minus(asset2);
        assert.equal(asset.asset_id, "1.3.121", "Asset should be 1.3.121");
        assert.equal(asset.amount, 0, "Amount should be 0");
    });

    it("Throws when adding or subtracting unequal assets", function() {
        let asset = new Asset({asset_id: "1.3.121", amount: 242});
        let asset2 = new Asset({asset_id: "1.3.0", amount: 242});
        assert.throws(function() {
            asset.plus(asset2);
        }, Error);

        assert.throws(function() {
            asset.minus(asset2);
        }, Error);
    });

    it("Can be updated with real or satoshi amounts", function() {
        let asset = new Asset();
        asset.setAmount({real: 1.2323});
        assert.equal(asset.getAmount({}), 123230, "Amount should equal 123230");
        assert.equal(asset.getAmount({real: true}), 1.2323, "Amount should equal 1.2323");

        asset.setAmount({sats: 232223});
        assert.equal(asset.getAmount(), 232223, "Amount should equal 232223");
        assert.equal(asset.getAmount({real: true}), 2.32223, "Amount should equal 2.32223");

        asset.setAmount({real: 2.3212332223});
        // assert.equal(asset.getAmount(), 232223, "Amount should equal 232223");
        assert.equal(asset.getAmount({real: true}), 2.32123, "Amount should equal 2.32123");
    });

    it("Returns true if amount > 0", function() {
        let asset = new Asset({amount: 232});
        assert.equal(asset.hasAmount(), true, "Price should be valid");
    });

    it("Returns false if amount is 0", function() {
        let asset = new Asset();
        assert.equal(asset.hasAmount(), false, "Price should not be valid");
    });

    it("Throws when setAmount args are not set or incorrect", function() {
        let asset = new Asset();

        assert.throws(function() {
            asset.setAmount();
        }, Error);

        assert.throws(function() {
            asset.setAmount({real: "2.2323"});
        }, Error);

        assert.throws(function() {
            asset.setAmount({sats: "2.2323"});
        }, Error);
    });

    it("Can be multiplied with a price", function() {
        let asset = new Asset({asset_id: "1.3.0", real: 100});
        let asset2 = new Asset({asset_id: "1.3.121", precision: 4, real: 55});

        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 200
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.121", precision: 4}),
            quote: new Asset({asset_id: "1.3.0"}),
            real: 0.001
        });

        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 250
        });

        let result1 = asset.times(price1);
        assert.equal(result1.asset_id, "1.3.121", "Asset id should be 1.3.121");
        // 100 BTS * 200 BTS/USD = 100 BTS * (1/200) USD/BTS = 0.5 USD
        assert.equal(result1.getAmount({real: true}), 0.5, "Asset amount should be 0.5");

        let result2 = asset.times(price2);
        assert.equal(result2.asset_id, "1.3.121", "Asset id should be 1.3.121");
        // 100 BTS * 0.001 USD / BTS = 0.1 USD
        assert.equal(result2.getAmount({real: true}), 0.1, "Asset amount should be 0.1");

        // 55 USD * 250 BTS / USD = 13750 BTS
        assert.equal(asset2.times(price3).getAmount({real: true}), 13750, "Asset amount should equal 13750");
    });

    it("Throws when multiplied with an incorrect price", function() {
        let asset = new Asset({asset_id: "1.3.0", amount: 100});
        let price = new Price({
            base: new Asset({asset_id: "1.3.12", amount: 25}),
            quote: new Asset({asset_id: "1.3.121", amount: 500})
        });

        assert.throws(function() {
            asset.times(price);
        }, Error);
    });

    it("Can be converted to object", function() {
        let asset = new Asset({amount: 2323});
        let obj = asset.toObject();
        assert.equal(Object.keys(obj).length, 2, "Object should have 2 keys");
        assert.equal("asset_id" in obj, true, "Object should have asset_id key");
        assert.equal("amount" in obj, true, "Object should have amount key");
    });

    it("Can be divided by another asset to give a price", function() {
        let asset = new Asset({amount: 2323});
        let asset2 = new Asset({amount: 10, precision: 4, asset_id: "1.3.121"});
        let price = asset.divide(asset2);

        assert.equal(price.toReal(), 23.23, "Price should equal 23.23");
    });
});

describe("Price", function() {

    let base = new Asset({asset_id: "1.3.0", amount: 50});
    let quote = new Asset({asset_id: "1.3.121", amount: 250, precision: 4});

    it("Instantiates", function() {
        let price = new Price({base, quote});

        assert.equal(price.base.asset_id, "1.3.0", "Base asset should be 1.3.0");
        assert.equal(price.base.amount, 50, "Base amount should be 50");
        assert.equal(price.quote.asset_id, "1.3.121", "Quote asset should be 1.3.121");
        assert.equal(price.quote.amount, 250, "Quote amount should be 250");
        assert.equal(price.toReal(), 0.02, "Real price should be 0.02");
    });

    it("Returns true if valid", function() {
        let price = new Price({base, quote});
        assert.equal(price.isValid(), true, "Price should be valid");
    });

    it("Returns false if not valid", function() {
        let price = new Price({base: new Asset({amount: 0}), quote});
        assert.equal(price.isValid(), false, "Price should not be valid");
    });

    it("Instantiates from real number", function() {
        let priceNum = 250;
        let price = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: priceNum
        });

        assert.equal(price.toReal(), priceNum, "Real price should equal " + priceNum);
        assert.equal(price.base.amount, 2500, "Base amount should equal 2500");
        assert.equal(price.quote.amount, 1, "Quote amount should equal 1");

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        assert.equal(price2.toReal().toFixed(5), "212.23323", "Real price should equal 212.23323");
        assert.equal(price2.base.amount, 212233230, "Base amount should equal 212233230");
        assert.equal(price2.quote.amount, 100000, "Quote amount should equal 100000");

        priceNum = 121000.52323231;
        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.103", precision: 8}),
            real: priceNum
        });

        assert.equal(price3.toReal(), priceNum.toFixed(5), "Real price should equal " + priceNum.toFixed(5));

        priceNum = 0.00000321;
        for (var i = 0; i < 100000; i+=100) {
            priceNum += i;
            if (priceNum > 10000) {
                priceNum = limitByPrecision(priceNum, 5);
            }
            priceNum = parseFloat(priceNum.toFixed(8));
            price3 = new Price({
                base: new Asset({asset_id: "1.3.103", precision: 8}),
                quote: new Asset({asset_id: "1.3.121", precision: 4}),
                real: priceNum
            });
            assert.equal(price3.toReal(), priceNum, "Real price should equal " + priceNum);
        }
    });

    it("Can be output as a real number", function() {
        let price = new Price({base, quote});
        let real = price.toReal();
        assert.equal(real, 0.02, "Real price should be 0.02");
    });

    it("Throws if inputs are invalid", function() {
        assert.throws(function() {
            let price = new Price({base: null, quote});
        });
        assert.throws(function() {
            let price = new Price({base, quote: null});
        });
        assert.throws(function() {
            let price = new Price({base: null, quote: null});
        });
    });

    it("Throws if base and quote assets are the same", function() {
        assert.throws(function() {
            let price = new Price({base, quote: base});
        });
    });

    it("Can be compared with equals", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 2312.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 2312.151
        });

        assert.equal(price1.equals(price2), false, "Prices are not equal");
        assert.equal(price1.equals(price3), true, "Prices are equal");
    });

    it("Can be compared with less than", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 2312.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        assert.equal(price1.lt(price2), false, "Price1 is not less than price2");
        assert.equal(price2.lt(price1), true, "Price2 is less than price1");
    });

    it("Can be compared with less than or equal", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.151
        });

        assert.equal(price1.lte(price2), true, "Price1 is less than or equal");
        assert.equal(price2.lte(price1), false, "Price2 is not less than price1");
        assert.equal(price3.lte(price1), true, "Price3 is equal to price1");
    });

    it("Can be compared with not equal", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        assert(price1.ne(price2));
    });

    it("Can be compared with greater than", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        assert.equal(price1.gt(price2), false, "Price1 is not greater than price2");
        assert.equal(price2.gt(price1), true, "Price2 is greater than price1");
        assert.equal(price2.gt(price3), false, "Price2 is equal to price3");
    });

    it("Can be compared with greater than or equal", function() {
        let price1 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.151
        });

        let price2 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        let price3 = new Price({
            base: new Asset({asset_id: "1.3.0"}),
            quote: new Asset({asset_id: "1.3.121", precision: 4}),
            real: 212.23323
        });

        assert.equal(price1.gte(price2), false, "Price1 is not greater than price2");
        assert.equal(price2.gte(price1), true, "Price2 is greater than price1");
        assert.equal(price2.gte(price3), true, "Price2 is equal to price3");
    });
});

describe("LimitOrderCreate", function() {
    let USD = new Asset({
        precision: 4,
        asset_id: "1.3.121",
        real: 5.232
    });

    let BTS = new Asset({
        real: 1045.5
    });

    it("Instantiates", function() {
        let order =  new LimitOrderCreate({
            to_receive: USD,
            for_sale: BTS
        });
    });

    it("Can be converted to object", function() {
        let order =  new LimitOrderCreate({
            to_receive: USD,
            for_sale: BTS
        });
        let obj = order.toObject();
        assert.equal(Object.keys(obj).length, 5, "Object should have 5 keys");
        assert.equal("min_to_receive" in obj, true, "Object should have min_to_receive key");
        assert.equal("amount_to_sell" in obj, true, "Object should have amount_to_sell key");
        assert.equal("expiration" in obj, true, "Object should have expiration key");
        assert.equal("fill_or_kill" in obj, true, "Object should have fill_or_kill key");
        assert.equal("seller" in obj, true, "Object should have seller key");
    });

    it("Throws if inputs are invalid", function() {
        assert.throws(function() {
            let order =  new LimitOrderCreate({
                to_receive: null,
                for_sale: BTS
            });
        });

        assert.throws(function() {
            let order =  new LimitOrderCreate({
                to_receive: USD,
                for_sale: null
            });
        });

        assert.throws(function() {
            let order =  new LimitOrderCreate({
                to_receive: null,
                for_sale: null
            });
        });
    });

    it("Throws if assets are the same", function() {
        assert.throws(function() {
            let order =  new LimitOrderCreate({
                to_receive: BTS,
                for_sale: BTS
            });
        });
    });
});


describe("LimitOrder", function() {
    const asset1 = {asset_id: "1.3.0", precision: 5};
    const asset2 = {asset_id: "1.3.121", precision: 4};
    const assets = {"1.3.0": asset1, "1.3.121": asset2};
    const o = {
        "id":"1.7.937674",
        "expiration":"2017-12-13T14:14:09",
        "seller":"1.2.132823",
        "for_sale":600548,
        "sell_price": {
            "base": {
                "amount":40652748,
                "asset_id":"1.3.0"
            },
            "quote":{
                "amount":16186,
                "asset_id":"1.3.121"
            }
        }
        ,"deferred_fee":14676
    };

    it("Instantiates", function() {
        let order = new LimitOrder(o, assets, "1.3.0");
        assert(order.id === o.id);
        assert(order.seller === o.seller);
        assert(order.for_sale === o.for_sale);
        assert(order.fee === o.deferred_fee);
    });

    it("Returns the price of the order", function() {
        let order = new LimitOrder(o, assets, "1.3.121");
        assert.equal(order.getPrice(), 251.15994069, "Price should equal 251.15994069");
        let order2 = new LimitOrder(o, assets, "1.3.0");
        assert.equal(order2.getPrice(), 0.00398153, "Price should equal 0.00398153");
    });

    it("Returns the amount for sale as an asset", function() {
        let order = new LimitOrder(o, assets, "1.3.0");
        let forSale = order.amountForSale();
        assert.equal(forSale.getAmount(), 600548, "Satoshi amount for sale should equal 600548");
        assert.equal(forSale.getAmount({real: true}), 6.00548, "Real amount for sale should equal 6.00548");
    });

    it("Returns the amount to receive as an asset", function() {
        let order = new LimitOrder(o, assets, "1.3.0");
        let toReceive = order.amountToReceive();
        assert.equal(toReceive.getAmount(), 239, "Satoshi amount to receive should equal 239");
        assert.equal(toReceive.getAmount({real: true}), 0.0239, "Real amount for sale should equal 0.0239");
    });
});
