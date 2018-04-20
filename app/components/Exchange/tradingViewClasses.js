import MarketsStore from "stores/MarketsStore";
import {FetchChain} from "bitsharesjs/es";
import moment from "moment-timezone";
import MarketsActions from "actions/MarketsActions";

class SymbolInfo {
    constructor(options) {
        this.name = options.ticker;
        this.ticker = options.ticker;
        this.description = "Temp";
        this.type = "bitcoin";
        this.session = "24x7";
        this.timezone = moment.tz.guess();
        this.data_status = "streaming";
        this.supported_resolutions = options.resolutions;
        this.has_empty_bars = true;
        this.pricescale = Math.pow(10, options.baseAsset.get("precision"));
        this.quoteAsset = options.quoteAsset;
        this.baseAsset = options.baseAsset;
        this.minmov = 1;
        this.has_intraday = true;
        this.intraday_multipliers = this.supported_resolutions.filter(r => {
            return r.indexOf("D") === -1 && r.indexOf("S") === -1;
        });
    }
}

function getResolutionsFromBuckets(buckets) {
    let resolutions = buckets
        .map(r => {
            let minute = r / 60;
            if (minute < 1) {
                return r + "S";
            } else if (minute < 60 * 24) return minute.toString();
            else {
                // below 1 day we return minutes
                let day = minute / 60 / 24;
                if (day >= 1) {
                    if (parseInt(day, 10) === day) {
                        if (day === 1) return "D";
                        return day + "D";
                    }
                }
            }
        })
        .filter(a => !!a);

    return resolutions;
}

function getBucketFromResolution(r) {
    if (r === "D") return 24 * 60 * 60;
    if (r.indexOf("D") !== -1) {
        return parseInt(r.replace("D"), 10) * 24 * 60 * 60;
    } else {
        return parseInt(r, 10) * 60;
    }
}

class DataFeed {
    update(options) {
        for (let key in options) {
            switch (key) {
                case "resolutions":
                    this.supported_resolutions = getResolutionsFromBuckets(
                        options.resolutions
                    );
                    break;

                case "onMarketChange":
                    MarketsStore.unsubscribe("market_change");
                    MarketsStore.subscribe("market_change", options[key]);
                    break;

                default:
                    this[key] = options[key];
            }
        }
    }

    clearSubs() {
        MarketsStore.clearSubs();
    }

    onReady(callback) {
        setTimeout(() => {
            callback({
                exchanges: [
                    {
                        value: "OPEN.",
                        name: "Openledger",
                        desc: "Openledger Gateway"
                    }
                ],
                symbols_types: [],
                supported_resolutions: this.supported_resolutions,
                supports_marks: false,
                supports_search: false,
                supports_time: true
            });
        }, 10);
    }

    searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
        console.log("searchSymbols", userInput, exchange, symbolType);

        onResultReadyCallback([]);

        /*
        [
            {
                "symbol": "<short symbol name>",
                "full_name": "<full symbol name>", // e.g. BTCE:BTCUSD
                "description": "<symbol description>",
                "exchange": "<symbol exchange name>",
                "ticker": "<symbol ticker name, optional>",
                "type": "stock" // or "futures" or "bitcoin" or "forex" or "index"
            },
            {
                //    .....
            }
        ]
        */
    }

    resolveSymbol(
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback
    ) {
        let [quote, base] = symbolName.split("_");
        Promise.all([
            FetchChain("getAsset", quote),
            FetchChain("getAsset", base)
        ])
            .then(assets => {
                let [quoteAsset, baseAsset] = assets;
                onSymbolResolvedCallback(
                    new SymbolInfo({
                        ticker: symbolName,
                        quoteAsset,
                        baseAsset,
                        resolutions: this.supported_resolutions
                    })
                );
            })
            .catch(onResolveErrorCallback);
    }

    getBars(
        symbolInfo,
        resolution,
        from,
        to,
        onHistoryCallback,
        onErrorCallback,
        firstDataRequest
    ) {
        from *= 1000;
        to *= 1000;
        let bars = this._getHistory();
        this.latestBar = bars[bars.length - 1];
        bars = bars.filter(a => {
            return a.time >= from && a.time <= to;
        });

        if (this.interval !== resolution) {
            if (!firstDataRequest) return;

            let newBucketSize = getBucketFromResolution(resolution);
            MarketsActions.changeBucketSize(newBucketSize);

            return MarketsActions.unSubscribeMarket(
                symbolInfo.quoteAsset.get("id"),
                symbolInfo.baseAsset.get("id")
            ).then(() => {
                MarketsActions.subscribeMarket(
                    symbolInfo.baseAsset,
                    symbolInfo.quoteAsset,
                    newBucketSize
                ).then(() => {
                    let bars = this._getHistory();
                    this.latestBar = bars[bars.length - 1];
                    bars = bars.filter(a => {
                        return a.time >= from && a.time <= to;
                    });
                    this.interval = resolution;
                    if (!bars.length)
                        return onHistoryCallback(bars, {noData: true});
                    onHistoryCallback(bars);
                });
            });
        }

        // console.log(
        //     "getBars",
        //     symbolInfo.ticker,
        //     resolution,
        //     "firstDataRequest",
        //     firstDataRequest,
        //     "bars",
        //     bars
        // );
        this.interval = resolution;
        if (!bars.length) return onHistoryCallback(bars, {noData: true});

        onHistoryCallback(bars);
    }

    _getHistory() {
        return MarketsStore.getState().priceData;
    }

    subscribeBars(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback
    ) {
        MarketsStore.unsubscribe("subscribeBars");
        MarketsStore.subscribe("subscribeBars", () => {
            let bars = this._getHistory();
            let newBars = bars.filter(a => {
                return a.time > this.latestBar.time;
            });
            // console.log("subscribeBars", MarketsStore.getState().activeMarket, "found new bars:", newBars);
            if (newBars.length) {
                newBars.forEach(bar => {
                    onRealtimeCallback(bar);
                });
                this.latestBar = newBars[newBars.length - 1];
            } else {
                // Check if latest bar is different
                let didChange = false;
                for (let key in this.latestBar) {
                    if (this.latestBar[key] !== bars[bars.length - 1][key]) {
                        didChange = true;
                    }
                }
                if (didChange) {
                    onRealtimeCallback(bars[bars.length - 1]);
                }
            }
        });
    }

    unsubscribeBars() {
        MarketsStore.unsubscribe("subscribeBars");
    }

    calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
        return undefined;
    }

    getServerTime(callback) {
        callback(new Date().getTime() / 1000);
    }
}

export {DataFeed, SymbolInfo, getResolutionsFromBuckets};
