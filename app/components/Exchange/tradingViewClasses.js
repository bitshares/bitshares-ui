import MarketsStore from "stores/MarketsStore";
import {FetchChain} from "bitsharesjs/es";
import moment from "moment-timezone";

class SymbolInfo {
    constructor(options) {
        this.name = options.ticker;
        this.ticker = options.ticker;
        this.description = "Temp";
        this.type = "bitcoin";
        this.session = "24x7";
        this.timezone = moment.tz.guess();
        this.data_status = "streaming";
        this.resolutions = options.resolutions;
        this.has_empty_bars = true;
        this.pricescale = Math.pow(10, options.baseAsset.get("precision"));
        this.minmov = 1;
    }
}

class DataFeed {
    update(options) {
        for (let key in options) {
            switch (key) {
                case "resolutions":
                    this.supported_resolutions = options.resolutions
                        .map(r => {
                            let minute = r / 60;
                            if (minute < 60 * 24) return minute;
                            else {
                                let hour = minute / 60;
                                if (hour >= 24) {
                                } else {
                                    return hour / 24 + "D";
                                }
                            }
                        })
                        .filter(a => !!a);
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
        if (bars.length > 1) {
            for (var i = 1; i < bars.length; i++) {
                if (bars[i].time === bars[i - 1].time) {
                    console.error(
                        "Indentical time in bars " + i + " and ",
                        i - 1
                    );
                }
            }
        }

        this.latestBar = bars[bars.length - 1];
        bars = bars.filter(a => {
            return a.time >= from && a.time <= to;
        });

        // console.log(
        //     "getBars",
        //     symbolInfo.ticker,
        //     resolution,
        //     "firstDataRequest",
        //     firstDataRequest,
        //     "bars",
        //     bars
        // );
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
                for (let key in this.latestBar) {
                    let didChange = false;
                    if (this.latestBar[key] !== bars[bars.length - 1][key]) {
                        didChange = true;
                    }
                    if (didChange) {
                        onRealtimeCallback(bars[bars.length - 1]);
                    }
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

export {DataFeed};
