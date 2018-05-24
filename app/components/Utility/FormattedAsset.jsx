import React from "react";
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import assetUtils from "common/asset_utils";
import PropTypes from "prop-types";
import Popover from "react-popover";
import HelpContent from "./HelpContent";
import AssetName from "./AssetName";
import Pulsate from "./Pulsate";
import {ChainStore} from "bitsharesjs/es";
import AssetWrapper from "./AssetWrapper";
import BindToChainState from "./BindToChainState";
import ChainTypes from "./ChainTypes";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     asset:  asset id, which will be fetched from the
 *     amount: the ammount of asset
 *
 */

class SupplyPercentage extends React.Component {
    static propTypes = {
        do: ChainTypes.ChainObject.isRequired
    };

    render() {
        let supply = parseInt(this.props.do.get("current_supply"), 10);
        let percent = utils.format_number(this.props.amount / supply * 100, 4);
        return <span className={this.props.colorClass}>{percent}%</span>;
    }
}
SupplyPercentage = BindToChainState(SupplyPercentage);

class FormattedAsset extends React.Component {
    static propTypes = {
        amount: PropTypes.any.isRequired,
        exact_amount: PropTypes.bool,
        decimalOffset: PropTypes.number,
        color: PropTypes.string,
        hide_asset: PropTypes.bool,
        hide_amount: PropTypes.bool,
        asPercentage: PropTypes.bool,
        assetInfo: PropTypes.node
    };

    static defaultProps = {
        amount: 0,
        decimalOffset: 0,
        hide_asset: false,
        hide_amount: false,
        asPercentage: false,
        assetInfo: null,
        replace: true
    };

    constructor(props) {
        super(props);
        this.state = {isPopoverOpen: false};
        this.togglePopover = this.togglePopover.bind(this);
        this.closePopover = this.closePopover.bind(this);
    }

    togglePopover(e) {
        e.preventDefault();
        this.setState({isPopoverOpen: !this.state.isPopoverOpen});
    }

    closePopover() {
        this.setState({isPopoverOpen: false});
    }

    render() {
        let {
            amount,
            decimalOffset,
            color,
            asset,
            hide_asset,
            hide_amount,
            asPercentage,
            pulsate
        } = this.props;

        if (asset && asset.toJS) asset = asset.toJS();

        let colorClass = color ? "facolor-" + color : "";

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset);
        if (hide_amount) {
            colorClass += " no-amount";
        }

        if (asPercentage) {
            return (
                <SupplyPercentage
                    amount={amount}
                    colorClass={colorClass}
                    do={asset.dynamic_asset_data_id}
                />
            );
        }

        let issuer = ChainStore.getObject(asset.issuer, false, false);
        let issuerName = issuer ? issuer.get("name") : "";

        let description = assetUtils.parseDescription(
            asset.options.description
        );

        const currency_popover_body = !hide_asset &&
            this.props.assetInfo && (
                <div>
                    <HelpContent
                        path={"assets/Asset"}
                        section="summary"
                        symbol={asset.symbol}
                        description={
                            description.short_name
                                ? description.short_name
                                : description.main
                        }
                        issuer={issuerName}
                    />
                    {this.props.assetInfo}
                </div>
            );

        let formattedValue = null;
        if (!hide_amount) {
            let value = this.props.exact_amount ? amount : amount / precision;
            formattedValue = (
                <FormattedNumber
                    value={value}
                    minimumFractionDigits={Math.max(decimals, 0)}
                    maximumFractionDigits={Math.max(decimals, 0)}
                />
            );

            if (pulsate) {
                if (typeof pulsate !== "object") pulsate = {};
                formattedValue = (
                    <Pulsate value={value} {...pulsate}>
                        {formattedValue}
                    </Pulsate>
                );
            }
        }
        return (
            <span className={colorClass}>
                {formattedValue}
                {!hide_asset &&
                    (this.props.assetInfo ? (
                        <span>
                            &nbsp;
                            <Popover
                                isOpen={this.state.isPopoverOpen}
                                onOuterAction={this.closePopover}
                                body={currency_popover_body}
                            >
                                <span
                                    className="currency click-for-help"
                                    onClick={this.togglePopover}
                                >
                                    <AssetName name={asset.symbol} />
                                </span>
                            </Popover>
                        </span>
                    ) : (
                        <span className="currency" onClick={this.togglePopover}>
                            {" "}
                            <AssetName
                                noTip={this.props.noTip}
                                noPrefix={this.props.noPrefix}
                                name={asset.symbol}
                                replace={this.props.replace}
                            />
                        </span>
                    ))}
            </span>
        );
    }
}
FormattedAsset = AssetWrapper(FormattedAsset);

export default FormattedAsset;
