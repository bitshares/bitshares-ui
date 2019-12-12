import {FetchChain} from "bitsharesjs";
import {getConfigurationAsset} from "branding";
import asset_utils from "common/asset_utils";

const _fetchOnChainConfig = async function() {
    let config = getConfigurationAsset();
    if (!config.symbol) {
        return {};
    }
    const assets = [await FetchChain("getAsset", config.symbol)];
    let onChainConfig = {};
    assets.forEach(asset => {
        if (!asset) {
            return;
        }
        try {
            asset = asset.toJS();
            let notification = asset_utils.parseDescription(
                asset.options.description
            );
            if (!!notification.main) {
                notification = notification.main.split(config.explanation);
                if (notification.length > 1 && !!notification[1]) {
                    let _onChainConfig = JSON.parse(notification[1]);
                    onChainConfig = Object.assign(
                        onChainConfig,
                        _onChainConfig
                    );
                }
            }
        } catch (err) {
            console.error(
                "JSON payload could not be parsed from asset description " +
                    asset.symbol,
                asset
            );
        }
    });
    return onChainConfig;
};

const getNotifications = async function() {
    const onChainConfig = await _fetchOnChainConfig();
    if (!onChainConfig.notifications) {
        return [];
    }
    let notificationList = [];
    onChainConfig.notifications.forEach(item => {
        notificationList.push(item);
    });
    return notificationList;
};

const getPredictionMarketIssuers = async function() {
    const onChainConfig = await _fetchOnChainConfig();
    return onChainConfig.predictionMarketIssuers || [];
};

const isGatewayTemporarilyDisabled = async function(gatewayKey) {
    // map of all known gateways with additional values
    // e.g. {OPEN: {enabled: true}}
    const onChainConfig = await _fetchOnChainConfig();

    if (!onChainConfig.gateways) return false;

    if (!onChainConfig.gateways[gatewayKey]) return false;

    if (onChainConfig.gateways[gatewayKey].enabled === false) return true;

    return false;
};

const getGatewayComment = async function(gatewayKey) {
    // map of all known gateways with additional values
    // e.g. {OPEN: {enabled: true}}
    const onChainConfig = await _fetchOnChainConfig();

    if (!onChainConfig.gateways) return null;

    if (!onChainConfig.gateways[gatewayKey]) return null;

    if (!onChainConfig.gateways[gatewayKey].comment) return null;

    return onChainConfig.gateways[gatewayKey].comment;
};

const getGatewayConfig = async function(gatewayKey) {
    // map of all known gateways with additional values
    // e.g. {OPEN: {enabled: true}}
    const onChainConfig = await _fetchOnChainConfig();

    if (!onChainConfig.gateways) return null;

    if (!gatewayKey) {
        return onChainConfig.gateways;
    }

    if (!onChainConfig.gateways[gatewayKey]) return null;

    return onChainConfig.gateways[gatewayKey];
};

const getBlacklists = async function() {
    const onChainConfig = await _fetchOnChainConfig();

    if (!onChainConfig.blacklists) return {};

    return onChainConfig.blacklists;
};

const getOnChainConfig = async function() {
    const onChainConfig = await _fetchOnChainConfig();

    if (!onChainConfig) return {};

    return onChainConfig;
};

export {
    getNotifications,
    getPredictionMarketIssuers,
    isGatewayTemporarilyDisabled,
    getGatewayComment,
    getGatewayConfig,
    getBlacklists,
    getOnChainConfig
};
