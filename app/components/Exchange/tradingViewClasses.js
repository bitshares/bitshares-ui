import MarketsStore from "stores/MarketsStore";
import {FetchChain} from "bitsharesjs/es";
import moment from "moment-timezone";
import MarketsActions from "actions/MarketsActions";
import {getGatewayName} from "common/gatewayUtils";
import utils from "common/utils";

class SymbolInfo {
    constructor(options) {
        this.name = options.ticker;
        this.ticker = options.ticker;

        const quoteGateway = getGatewayName(options.quoteAsset);
        const baseGateway = getGatewayName(options.baseAsset);
        let currentExchange =
            quoteGateway === baseGateway
                ? quoteGateway
                : quoteGateway && !baseGateway
                    ? quoteGateway
                    : !quoteGateway && baseGateway
                        ? baseGateway
                        : `${quoteGateway} / ${baseGateway}`;

        let {name: baseSymbol, prefix: basePrefix} = utils.replaceName(
            options.baseAsset
        );
        let {name: quoteSymbol, prefix: quotePrefix} = utils.replaceName(
            options.quoteAsset
        );

        this.description = `${quotePrefix || ""}${quoteSymbol} / ${basePrefix ||
            ""}${baseSymbol} ${
            !!currentExchange ? `(${currentExchange})` : ""
        }`;
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

        this.has_intraday = this.supported_resolutions.reduce(
            (supported, r) => {
                return supported || !isNaN(parseInt(r, 10));
            },
            false
        );
        this.intraday_multipliers = this.supported_resolutions.filter(r => {
            return !isNaN(parseInt(r, 10));
        });

        this.has_seconds = this.supported_resolutions.reduce((supported, r) => {
            return supported || r.indexOf("S") !== -1;
        }, false);
        this.seconds_multipliers = this.supported_resolutions.filter(r => {
            return r.indexOf("S") !== -1;
        });

        this.has_daily = this.supported_resolutions.reduce((supported, r) => {
            return supported || r.indexOf("D") !== -1;
        }, false);

        this.has_daily = this.supported_resolutions.reduce((supported, r) => {
            return supported || r.indexOf("D") !== -1;
        }, false);
    }
}

function getResolutionsFromBuckets(buckets) {
    let resolutions = buckets
        .map(r => {
            let minute = r / 60;
            let day = minute / 60 / 24;
            let week = day / 7;

            if (minute < 1) {
                // below 1 minute we return Seconds
                return r + "S";
            } else if (day < 1 && parseInt(minute, 10) === minute) {
                // below 1 day we return Minutes
                return minute.toString();
            } else if (week < 1) {
                // below 1 week we return Days
                if (day >= 1) {
                    if (parseInt(day, 10) === day) {
                        if (day === 1) return "D";
                        return day + "D";
                    }
                }
            } else {
                // we return weeks
                if (week >= 1) {
                    if (parseInt(week, 10) === week) {
                        return week + "D";
                    }
                }
            }

            return null;
        })
        .filter(a => !!a);

    return resolutions;
}

function getBucketFromResolution(r) {
    if (r === "D") return 24 * 60 * 60;

    if (r.indexOf("W") !== -1) {
        return parseInt(r.replace("D", ""), 10) * 7 * 24 * 60 * 60;
    } else if (r.indexOf("D") !== -1) {
        return parseInt(r.replace("D", ""), 10) * 24 * 60 * 60;
    } else if (r.indexOf("S") !== -1) {
        return parseInt(r.replace("S", ""), 10);
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
        onResetCacheNeededCallback();
        MarketsStore.subscribe("subscribeBars", () => {
            let bars = this._getHistory();
            let newBars = bars.filter(a => {
                if (!this.latestBar) return true;
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
        /*
        * This is ALWAYS called after subscribeBars for some reason, but
        * sometimes it executes BEFORE the subscribe call in subscribeBars and
        * sometimes AFTER. This causes the callback to be cleared and we stop
        * receiving updates from the MarketStore. Unless we find it causes bugs,
        * it's best to just not use this.
        */
        // MarketsStore.unsubscribe("subscribeBars");
        // this.latestBar = null;
    }

    calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
        return undefined;
    }

    getServerTime(callback) {
        callback(new Date().getTime() / 1000);
    }
}

const supportedTimeZones = [
    "America/Argentina/Buenos_Aires",
    "America/Bogota",
    "America/Caracas",
    "America/Chicago",
    "America/El_Salvador",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/New_York",
    "America/Phoenix",
    "America/Sao_Paulo",
    "America/Toronto",
    "America/Vancouver",
    "Asia/Almaty",
    "Asia/Ashkhabad",
    "Asia/Bangkok",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Kathmandu",
    "Asia/Kolkata",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Taipei",
    "Asia/Tehran",
    "Asia/Tokyo",
    "Australia/ACT",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Sydney",
    "Europe/Athens",
    "Europe/Berlin",
    "Europe/Istanbul",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Moscow",
    "Europe/Paris",
    "Europe/Warsaw",
    "Europe/Zurich",
    "Pacific/Auckland",
    "Pacific/Chatham",
    "Pacific/Fakaofo",
    "Pacific/Honolulu",
    "US/Mountain"
];

function getTVTimezone() {
    const current = moment.tz.guess();
    const defaultZone = "Europe/London";

    let isSupported = supportedTimeZones.indexOf(current) !== -1;
    if (isSupported) return current;
    else {
        /* Try to find a matching timezone from the limited list supported by TradingView */
        const time = moment().toISOString();
        const actual = moment.tz(time, current).format();
        for (var i = 0; i < supportedTimeZones.length; i++) {
            let zoneTime = moment.tz(time, supportedTimeZones[i]);
            if (zoneTime.format() === actual) {
                if (__DEV__)
                    console.log(
                        `Found a match for ${current} timezone, using ${
                            supportedTimeZones[i]
                        }`
                    );
                // Found a match, return that zone
                return supportedTimeZones[i];
            }
        }
    }
    console.log(
        `No matching timezone found for ${current}, setting to default value of Europe/London`
    );
    return defaultZone;
}

export {DataFeed, SymbolInfo, getResolutionsFromBuckets, getTVTimezone};
