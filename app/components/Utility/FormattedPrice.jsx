import React from "react";
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import AssetWrapper from "./AssetWrapper";
import AltContainer from "alt-container";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import Popover from "react-popover";
import Translate from "react-translate-component";
import AssetName from "./AssetName";
import Pulsate from "./Pulsate";
import marketUtils from "common/market_utils";
import {Asset, Price} from "common/MarketClasses";
import PropTypes from "prop-types";
import {withRouter} from "react-router-dom";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     base_asset:  asset id, which will be fetched from the
 *     base_amount: the ammount of asset
 *     quote_asset:
 *     quote_amount: the ammount of asset
 *
 */

class FormattedPrice extends React.Component {
    static propTypes = {
        base_amount: PropTypes.any,
        quote_amount: PropTypes.any,
        decimals: PropTypes.number
    };

    constructor(props) {
        super(props);
        const {marketName, first, second} = marketUtils.getMarketName(
            this.props.base_asset,
            this.props.quote_asset
        );

        this.state = {isPopoverOpen: false, marketName, first, second};
        this.togglePopover = this.togglePopover.bind(this);
        this.closePopover = this.closePopover.bind(this);
    }

    componentWillReceiveProps(np) {
        if (
            np.base_asset !== this.props.base_asset ||
            np.quote_asset !== this.props.quote_asset
        ) {
            const {marketName, first, second} = marketUtils.getMarketName(
                np.base_asset,
                np.quote_asset
            );
            this.setState({marketName, first, second});
        }
    }

    togglePopover(e) {
        e.preventDefault();
        this.setState({isPopoverOpen: !this.state.isPopoverOpen});
    }

    closePopover() {
        this.setState({isPopoverOpen: false});
    }

    onFlip() {
        let setting = {};

        setting[this.state.marketName] = !this.props.marketDirections.get(
            this.state.marketName
        );
        SettingsActions.changeMarketDirection(setting);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.marketDirections !== this.props.marketDirections ||
            nextProps.base_amount !== this.props.base_amount ||
            nextProps.quote_amount !== this.props.quote_amount ||
            nextProps.decimals !== this.props.decimals ||
            !utils.are_equal_shallow(nextProps.pulsate, this.props.pulsate) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    goToMarket(e) {
        e.preventDefault();
        const {marketName, first, second} = this.state;
        const inverted = this.props.marketDirections.get(marketName);
        this.props.history.push(
            `/market/${
                !inverted ? first.get("symbol") : second.get("symbol")
            }_${!inverted ? second.get("symbol") : first.get("symbol")}`
        );
    }

    render() {
        let {
            base_asset,
            base_amount,
            quote_amount,
            marketDirections,
            hide_symbols,
            noPopOver,
            pulsate
        } = this.props;
        const {marketName, first, second} = this.state;
        let inverted = marketDirections.get(marketName) || this.props.invert;
        if (
            this.props.force_direction &&
            second.get("symbol") === this.props.force_direction &&
            inverted
        ) {
            inverted = false;
        } else if (
            this.props.force_direction &&
            first.get("symbol") === this.props.force_direction &&
            !inverted
        ) {
            inverted = true;
        }
        let base, quote;
        if (inverted) {
            base = second;
            quote = first;
        } else {
            base = first;
            quote = second;
        }
        if (base.get("id") !== base_asset.get("id")) {
            let tempAmount = base_amount;
            base_amount = quote_amount;
            quote_amount = tempAmount;
        }

        let price;
        try {
            price = new Price({
                quote: new Asset({
                    asset_id: base.get("id"),
                    precision: base.get("precision"),
                    amount: base_amount
                }),
                base: new Asset({
                    asset_id: quote.get("id"),
                    precision: quote.get("precision"),
                    amount: quote_amount
                })
            });
        } catch (err) {
            return null;
        }

        let formatted_value = "";
        if (!this.props.hide_value) {
            let value = price.toReal();
            if (isNaN(value) || !isFinite(value)) {
                return <span>--</span>;
            }
            let decimals = this.props.decimals
                ? this.props.decimals
                : price.base.precision;
            decimals = Math.min(8, decimals);
            formatted_value = (
                <FormattedNumber
                    value={value}
                    minimumFractionDigits={Math.max(2, decimals)}
                    maximumFractionDigits={Math.max(2, decimals)}
                />
            );

            if (pulsate) {
                if (typeof pulsate !== "object") pulsate = {};
                formatted_value = (
                    <Pulsate value={value} {...pulsate}>
                        {formatted_value}
                    </Pulsate>
                );
            }
        }
        let symbols = hide_symbols ? (
            ""
        ) : (
            <span
                data-place="bottom"
                data-tip={noPopOver ? "Click to invert the price" : null}
                className={noPopOver ? "clickable inline-block" : ""}
                onClick={noPopOver ? this.onFlip.bind(this) : null}
            >
                <AssetName name={quote.get("symbol")} />
                /
                <AssetName name={base.get("symbol")} />
            </span>
        );

        const currency_popover_body =
            !noPopOver && !hide_symbols ? (
                <div>
                    <div className="button" onClick={this.onFlip.bind(this)}>
                        <Translate content="exchange.invert" />
                    </div>
                    <div
                        className="button"
                        onClick={this.goToMarket.bind(this)}
                    >
                        <Translate content="exchange.to_market" />
                    </div>
                </div>
            ) : null;

        let popOver = currency_popover_body ? (
            <Popover
                isOpen={this.state.isPopoverOpen}
                onOuterAction={this.closePopover}
                body={currency_popover_body}
            >
                <span
                    className="currency click-for-help"
                    onClick={this.togglePopover}
                >
                    {symbols}
                </span>
            </Popover>
        ) : null;

        return (
            <span className="formatted-price">
                {formatted_value} {popOver ? popOver : symbols}
            </span>
        );
    }
}

FormattedPrice = AssetWrapper(FormattedPrice, {
    propNames: ["base_asset", "quote_asset"]
});
FormattedPrice = withRouter(FormattedPrice);

export default class FormattedPriceWrapper extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[SettingsStore]}
                inject={{
                    marketDirections: () => {
                        return SettingsStore.getState().marketDirections;
                    }
                }}
            >
                <FormattedPrice {...this.props} />
            </AltContainer>
        );
    }
}
