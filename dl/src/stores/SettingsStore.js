var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
var _ =require("lodash");

import WalletDb from "stores/WalletDb"

const STORAGE_KEY = "__graphene__";
const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

var ls = typeof localStorage === "undefined" ? null : localStorage;

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.settings = Immutable.Map({
            locale: "en",
            connection: "wss://bitshares.openledger.info/ws",
            backup_server: "ws://localhost:9080",
            faucet_address: "https://bitshares.openledger.info",
            unit: CORE_ASSET,
            showSettles: false,
            walletLockTimeout: 60 * 10,
            multiAccountMode: false
        });

        this.viewSettings =  Immutable.Map({
            cardView: true
        });

        this.marketDirections = Immutable.Map({

        });

        this.hiddenAssets = Immutable.List([]);

        this.starredMarkets = Immutable.Map([
            [CORE_ASSET + "_BTC", {"quote": CORE_ASSET,"base": "BTC"}],
            [CORE_ASSET + "_CNY", {"quote": CORE_ASSET,"base": "CNY"}],
            [CORE_ASSET + "_EUR", {"quote": CORE_ASSET,"base": "EUR"}],
            [CORE_ASSET + "_GOLD", {"quote": CORE_ASSET,"base": "GOLD"}],
            [CORE_ASSET + "_SILVER", {"quote": CORE_ASSET,"base": "SILVER"}],
            [CORE_ASSET + "_USD", {"quote": CORE_ASSET,"base": "USD"}],
            ["BTC_USD", {"quote":"BTC","base":"USD"}],
            ["BTC_CNY", {"quote":"BTC","base":"CNY"}],
            [CORE_ASSET + "_OPENBTC", {"quote": CORE_ASSET,"base": "OPENBTC"} ],
            [CORE_ASSET + "_OPENMUSE", {"quote": CORE_ASSET,"base": "OPENMUSE"} ],
            [CORE_ASSET + "_TRADE.BTC", {"quote": CORE_ASSET,"base": "TRADE.BTC"} ],
            ["TRADE.BTC_BTC", {"quote":"TRADE.BTC","base": "BTC"} ],
            [CORE_ASSET + "_METAFEES", {"quote": CORE_ASSET,"base": "METAFEES"} ],
            [CORE_ASSET + "_OBITS", {"quote": CORE_ASSET,"base": "OBITS"} ],
            [CORE_ASSET + "_TRADE.MUSE", {"quote": CORE_ASSET,"base": "TRADE.MUSE"} ],
            ["METAEX.BTC_BTC", {"quote":"METAEX.BTC","base": "BTC"} ],
            [CORE_ASSET + "_METAEX.BTC", {"quote": CORE_ASSET,"base": "METAEX.BTC" } ]
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
                "wss://bitshares.openledger.info/ws",
                "wss://bitshares.dacplay.org:8089/ws"
            ],
            unit: [
                CORE_ASSET,
                "USD",
                "CNY",
                "BTC",
                "EUR"
            ],
            showSettles: [
                {translate: "yes"},
                {translate: "no"}
            ],
            multiAccountMode: [
                {translate: "no"},
                {translate: "yes"}
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
            onHideAsset: SettingsActions.hideAsset
        });

        if (this._lsGet("settings_v3")) {
            this.settings = Immutable.Map(_.merge(this.settings.toJS(), JSON.parse(this._lsGet("settings_v3"))));
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


    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        this._lsSet("settings_v3", this.settings.toJS());
        if (payload.setting === "walletLockTimeout") {
            this._lsSet("lockTimeout", payload.value);
        }
        if (payload.setting === "backup_server") {
            let url = payload.value === "" ? null : payload.value
            WalletDb.getState().wallet.useBackupServer(url)
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
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
