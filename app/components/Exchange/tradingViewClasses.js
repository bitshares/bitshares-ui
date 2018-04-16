class SymbolInfo {
    constructor(options) {
        this.name = options.ticker;
        this.ticker = options.ticker;
        this.description = "Temp";
        this.type = "bitcoin";
        this.session = "24x7";
        this.timezone = "Europe/London";
        this.supported_resolutions = [5, 60];
        this.data_status = "streaming";
    }
}

class DataFeed {
    constructor(props) {
        this.ticker = props.quoteSymbol + "_" + props.baseSymbol;
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
                supported_resolutions: ["5", "60", "D"],
                supports_marks: false,
                supports_search: false,
                supports_time: true
            });
        }, 10);
    }

    searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
        console.log("getBars", userInput, exchange, symbolType);

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
        console.log("resolveSymbol", symbolName);
        onSymbolResolvedCallback(new SymbolInfo({ticker: this.ticker}));
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
        console.log("getBars", symbolInfo, resolution, from, to);

        onHistoryCallback([]);
    }

    subscribeBars(
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback
    ) {}

    unsubscribeBars(subscriberUID) {}

    calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
        return undefined;
    }

    getServerTime(callback) {
        callback(new Date().getTime() / 1000);
    }
}

export {DataFeed};
