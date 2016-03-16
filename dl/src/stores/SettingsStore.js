var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
var _ =require("lodash");

const STORAGE_KEY = "__graphene__";
const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

var ls = typeof localStorage === "undefined" ? null : localStorage;

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.settings = Immutable.Map({
            locale: "en",
            //connection: "wss://bitshares.openledger.info/ws",
            connection: "ws://testnet.bitshares.eu/ws",
            faucet_address: "http://testnet.bitshares.eu",
            backup_server: "ws://cnx.rocks:9080",
            unit: CORE_ASSET,
            showSettles: false,
            walletLockTimeout: 60 * 10,
            multiAccountMode: false
            themes: "darkTheme"
        });

        this.viewSettings =  Immutable.Map({
            cardView: true
        });

        this.marketDirections = Immutable.Map({

        });

        this.hiddenAssets = Immutable.List([]);

        this.preferredBases = Immutable.List([CORE_ASSET, "BTC", "USD", "CNY"]);
        this.baseOptions = [CORE_ASSET, "BTC", "USD", "CNY", "OPEN.BTC", "OPEN.USD"];

        this.starredMarkets = Immutable.Map([

            // BTS BASE
            ["OPEN.MUSE_"+ CORE_ASSET, {"quote": "OPEN.MUSE","base": CORE_ASSET}],
            ["OPEN.EMC_"+ CORE_ASSET, {"quote": "OPEN.EMC","base": CORE_ASSET}],
            ["TRADE.MUSE_"+ CORE_ASSET, {"quote": "TRADE.MUSE","base": CORE_ASSET}],
            ["OPEN.BTC_"+ CORE_ASSET, {"quote": "OPEN.BTC","base": CORE_ASSET}],
            ["USD_"+ CORE_ASSET, {"quote": "USD","base": CORE_ASSET}],
            ["BTC_"+ CORE_ASSET, {"quote": "BTC","base": CORE_ASSET}],
            ["CNY_"+ CORE_ASSET, {"quote": "CNY","base": CORE_ASSET}],
            ["EUR_"+ CORE_ASSET, {"quote": "EUR","base": CORE_ASSET}],
            ["GOLD_"+ CORE_ASSET, {"quote": "GOLD","base": CORE_ASSET}],
            ["SILVER_"+ CORE_ASSET, {"quote": "SILVER","base": CORE_ASSET}],
            ["METAEX.BTC_"+ CORE_ASSET, {"quote": "METAEX.BTC","base": CORE_ASSET}],
            ["METAEX.ETH_"+ CORE_ASSET, {"quote": "METAEX.ETH","base": CORE_ASSET}],
            ["METAFEES_"+ CORE_ASSET, {"quote": "METAFEES","base": CORE_ASSET}],
            ["OBITS_"+ CORE_ASSET, {"quote": "OBITS","base": CORE_ASSET}],
            ["OPEN.ETH_"+ CORE_ASSET, {"quote": "OPEN.ETH","base": CORE_ASSET}],

            // BTC BASE
            ["TRADE.BTC_BTC", {"quote":"TRADE.BTC","base": "BTC"} ],
            ["METAEX.BTC_BTC", {"quote":"METAEX.BTC","base": "BTC"} ],
            ["OPEN.BTC_BTC", {"quote":"OPEN.BTC","base": "BTC"} ],
            ["OPEN.ETH_BTC", {"quote":"OPEN.ETH","base": "BTC"} ],
            ["USD_BTC", {"quote":"USD","base": "BTC"} ],
            [CORE_ASSET + "_BTC", {"quote": CORE_ASSET,"base": "BTC"}],

            // USD BASE
            ["OPEN.USD_USD", {"quote": "OPEN.USD","base": "USD"}],
            [CORE_ASSET + "_USD", {"quote": CORE_ASSET,"base": "USD"}],

            // CNY BASE
            ["TCNY_CNY", {"quote": "TCNY","base": "CNY"}],
            ["BOTSCNY_CNY", {"quote": "BOTSCNY","base": "CNY"}],
            ["OPEN.CNY_CNY", {"quote": "OPEN.CNY","base": "CNY"}],
            [CORE_ASSET + "_CNY", {"quote": CORE_ASSET,"base": "CNY"}],

            // OTHERS
            ["OPEN.EUR_EUR", {"quote": "OPEN.EUR","base": "EUR"}],
            ["METAEX.ETH_OPEN.ETH", {"quote": "METAEX.ETH","base": "OPEN.ETH"}]

        ]);

        this.starredAccounts = Immutable.Map();

        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        this.defaults = {
            locale: [
                "en",
                "cn",
                "fr",
                "ko",
                "de",
                "es",
                "tr"
            ],
            connection: [
                "ws://testnet.bitshares.eu/ws",
                "wss://bitshares.openledger.info/ws",
                "wss://bitshares.dacplay.org:8089/ws",
                "wss://dele-puppy.com/ws"
            ],
            unit: [
                CORE_ASSET,
                "USD",
                "CNY",
                "BTC",
                "EUR",
                "GBP"
            ],
            showSettles: [
                {translate: "no"},
                {translate: "yes"}
            ],
            multiAccountMode: [
                {translate: "no"},
                {translate: "yes"}
            ],
            themes: [
                "darkTheme",
                "lightTheme",
                "olDarkTheme"
            ]
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onChangeMarketDirection: SettingsActions.changeMarketDirection,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onAddStarAccount: SettingsActions.addStarAccount,
            onRemoveStarAccount: SettingsActions.removeStarAccount,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS,
            onHideAsset: SettingsActions.hideAsset,
            // onChangeBase: SettingsActions.changeBase
        });

        if (this._lsGet("settings_v4")) {
            this.settings = Immutable.Map(_.merge(this.settings.toJS(), JSON.parse(this._lsGet("settings_v4"))));
        }

        if (this._lsGet("starredMarkets")) {
            this.starredMarkets = Immutable.Map(JSON.parse(this._lsGet("starredMarkets")));
        }

        if (this._lsGet("starredAccounts")) {
            this.starredAccounts = Immutable.Map(JSON.parse(this._lsGet("starredAccounts")));
        }

        if (this._lsGet("defaults_v1")) {
            this.defaults = _.merge(this.defaults, JSON.parse(this._lsGet("defaults_v1")));
        }

        if (this._lsGet("viewSettings_v1")) {
            this.viewSettings = Immutable.Map(JSON.parse(this._lsGet("viewSettings_v1")));
        }

        if (this._lsGet("marketDirections")) {
            this.marketDirections = Immutable.Map(JSON.parse(this._lsGet("marketDirections")));
        }

        if (this._lsGet("hiddenAssets")) {
            this.hiddenAssets = Immutable.List(JSON.parse(this._lsGet("hiddenAssets")));
        }

        if (this._lsGet("preferredBases")) {
            this.preferredBases = Immutable.List(JSON.parse(this._lsGet("preferredBases")));
        }


    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        this._lsSet("settings_v4", this.settings.toJS());
        if (payload.setting === "walletLockTimeout") {
            this._lsSet("lockTimeout", payload.value);
        }
    }

    onChangeViewSetting(payload) {
        for (key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        this._lsSet("viewSettings_v1", this.viewSettings.toJS());
    }

    onChangeMarketDirection(payload) {
        for (key in payload) {
            this.marketDirections = this.marketDirections.set(key, payload[key]);
        }

        this._lsSet("marketDirections", this.marketDirections.toJS());
    }

    onHideAsset(payload) {
        if (payload.id) {
            if (!payload.status) {
                this.hiddenAssets = this.hiddenAssets.delete(this.hiddenAssets.indexOf(payload.id));
            } else {
                this.hiddenAssets = this.hiddenAssets.push(payload.id);
            }
        }

        this._lsSet("hiddenAssets", this.hiddenAssets.toJS());
    }

    _lsGet(key) {
        if (ls) {
            return ls.getItem(STORAGE_KEY + key);
        }
    }

    _lsSet(key, object) {
        if (ls) {
            ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
        }
    }

    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        if (!this.starredMarkets.has(marketID)) {
            this.starredMarkets = this.starredMarkets.set(marketID, {quote: market.quote, base: market.base});

            this._lsSet("starredMarkets", this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        this._lsSet("starredMarkets", this.starredMarkets.toJS());
    }

    onAddStarAccount(account) {
        if (!this.starredAccounts.has(account)) {
            this.starredAccounts = this.starredAccounts.set(account, {name: account});

            this._lsSet("starredAccounts", this.starredAccounts.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarAccount(account) {

        this.starredAccounts = this.starredAccounts.delete(account);

        this._lsSet("starredAccounts", this.starredAccounts.toJS());
    }

    onAddWS(ws) {
        this.defaults.connection.push(ws);
        this._lsSet("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) { // Prevent removing the default connection
            this.defaults.connection.splice(index, 1);
            this._lsSet("defaults_v1", this.defaults);
        }
    }

    // onChangeBase(payload) {
    //     if (payload.index && payload.value) {
    //         this.preferredBases = this.preferredBases.set(payload.index, payload.value);
    //         this._lsSet("preferredBases", this.preferredBases.toArray);                    
    //     }
    // }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
