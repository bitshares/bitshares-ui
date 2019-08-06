import {ChainStore, FetchChainObjects} from "bitsharesjs";
import {getConfigurationAsset} from "branding";
import asset_utils from "common/asset_utils";
import {availableApis} from "common/gateways";

const getNotifications = () => {
    let config = getConfigurationAsset();
    if (typeof config.symbol == "string") {
        config.symbol = [config.symbol];
    }

    return new Promise((res, rej) => {
        FetchChainObjects(ChainStore.getAsset, config.symbol)
            .then(assets => {
                let notificationList = [];
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
                            notification = notification.main.split(
                                config.explanation
                            );
                            if (notification.length > 1 && !!notification[1]) {
                                let onChainConfig = JSON.parse(notification[1]);
                                onChainConfig.notifications.forEach(item => {
                                    notificationList.push(item);
                                });
                            }
                        }
                    } catch (err) {
                        console.error(
                            "Head feed could not be parsed from asset",
                            asset
                        );
                    }
                });
                res(notificationList);
            })
            .catch(rej);
    });
};

const getGateways = () => {
    const _gateways = Object.values(availableApis).map(item => {
        return fetch(item.BASE + item.COINS_LIST)
            .then(resp => {
                return resp.ok;
            })
            .catch(err => {
                console.warn(err);
                return false;
            });
    });
    return Promise.all(_gateways).then(results => {
        const gateways = Object.keys(availableApis).reduce(
            (sum, item, index) => {
                return {...sum, [item]: {enabled: results[index]}};
            },
            {}
        );

        return gateways;
    });
};

export {getNotifications, getGateways};
