import React from "react";
import {connect} from "alt-react";
import MarketsStore from "../stores/MarketsStore";
import SettingsStore from "../stores/SettingsStore";
import {PRICE_ALERT_TYPES} from "../services/Exchange";
import {Notification, Icon} from "bitshares-ui-style-guide";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SettingsActions from "../actions/SettingsActions";
import AssetName from "./Utility/AssetName";

class PriceAlertNotifications extends React.Component {
    _getRulesForCheck(priceAlertRules, markets) {
        return priceAlertRules.map((rule, key) => {
            let pair = `${rule.quoteAssetSymbol}_${rule.baseAssetSymbol}`;

            let price = null;

            try {
                let market = markets.get(pair);

                price = market && market.price && market.price.toReal();
            } catch (e) {
                console.error(
                    `PriceAlertNotifications: Unable to get real price for pair ${pair}: `,
                    e
                );
            }

            return {
                ruleKey: key,
                type: rule.type,
                pair: pair,
                quoteAssetSymbol: rule.quoteAssetSymbol,
                baseAssetSymbol: rule.baseAssetSymbol,
                actualPrice: price,
                expectedPrice: rule.price
            };
        });
    }

    _getFulfilledRules(rules) {
        return rules.filter(rule => {
            if (isNaN(Number(rule.actualPrice))) return false;

            if (
                Number(rule.type) === Number(PRICE_ALERT_TYPES.HIGHER_THAN) &&
                Number(rule.actualPrice) >= Number(rule.expectedPrice)
            ) {
                return true;
            } else if (
                Number(rule.type) === Number(PRICE_ALERT_TYPES.LOWER_THAN) &&
                Number(rule.actualPrice) <= Number(rule.expectedPrice)
            ) {
                return true;
            }

            return false;
        });
    }

    _filterByFulfilledRules(fulfilledRules) {
        return (rule, key) => {
            return !fulfilledRules.some(fulfilledRule => {
                return key === fulfilledRule.ruleKey;
            });
        };
    }

    notifyAboutRules(rules) {
        // Notification.

        rules.forEach(rule => {
            if (Number(rule.type) === Number(PRICE_ALERT_TYPES.LOWER_THAN)) {
                Notification.info({
                    duration: 30,
                    message: counterpart.translate(
                        "exchange.price_alert.title"
                    ),
                    description: (
                        <Translate
                            content="exchange.price_alert.notification.lower_than"
                            component="div"
                            pair={
                                <span className="price-alert--notification--pair-name">
                                    <AssetName name={rule.quoteAssetSymbol} />/
                                    <AssetName name={rule.baseAssetSymbol} />
                                </span>
                            }
                            expectedPrice={
                                <span className="price-alert--notification--expected-price">
                                    {rule.expectedPrice}
                                </span>
                            }
                            actualPrice={
                                <span className="price-alert--notification--actual-price price-alert--notification--actual-price-down">
                                    {rule.actualPrice}
                                </span>
                            }
                        />
                    ),
                    icon: (
                        <Icon
                            type="caret-down"
                            className="price-alert--notification--icon price-alert--notification--icon--down"
                        />
                    )
                });
            }

            if (Number(rule.type) === Number(PRICE_ALERT_TYPES.HIGHER_THAN)) {
                Notification.info({
                    duration: 30,
                    message: counterpart.translate(
                        "exchange.price_alert.title"
                    ),
                    description: (
                        <Translate
                            content="exchange.price_alert.notification.higher_than"
                            component="div"
                            pair={
                                <span className="price-alert--notification--pair-name">
                                    <AssetName name={rule.quoteAssetSymbol} />/
                                    <AssetName name={rule.baseAssetSymbol} />
                                </span>
                            }
                            expectedPrice={
                                <span className="price-alert--notification--expected-price">
                                    {rule.expectedPrice}
                                </span>
                            }
                            actualPrice={
                                <span className="price-alert--notification--actual-price price-alert--notification--actual-price-up">
                                    {rule.actualPrice}
                                </span>
                            }
                        />
                    ),
                    icon: (
                        <Icon
                            type="caret-up"
                            className="price-alert--notification--icon price-alert--notification--icon--up"
                        />
                    )
                });
            }
        });
    }

    render() {
        const {priceAlert, allMarketStats} = this.props;

        if (
            !priceAlert ||
            !priceAlert.length ||
            !allMarketStats ||
            !allMarketStats.size
        ) {
            return null;
        }

        const notificationsRules = this._getRulesForCheck(
            priceAlert,
            allMarketStats
        );

        // do notifications for
        const fulfilledRules = this._getFulfilledRules(notificationsRules);

        this.notifyAboutRules(fulfilledRules);

        // update notifications array
        let updatedPriceAlert = this.props.priceAlert.filter(
            this._filterByFulfilledRules(fulfilledRules)
        );

        if (updatedPriceAlert.length !== this.props.priceAlert.length) {
            SettingsActions.setPriceAlert(updatedPriceAlert);
        }

        return null;
    }
}

export default connect(
    PriceAlertNotifications,
    {
        listenTo() {
            return [MarketsStore, SettingsStore];
        },
        getProps() {
            return {
                allMarketStats: MarketsStore.getState().allMarketStats,
                priceAlert: SettingsStore.getState().priceAlert.toJS()
            };
        }
    }
);
