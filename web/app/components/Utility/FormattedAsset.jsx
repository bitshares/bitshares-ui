import React from "react";
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import {PropTypes} from "react";
import {Link} from "react-router";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import Popover from "react-popover";
import MarketLink from "./MarketLink";
import HelpContent from "./HelpContent";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     asset:  asset id, which will be fetched from the 
 *     amount: the ammount of asset
 *
 */

@BindToChainState()
class FormattedAsset extends React.Component {

    static propTypes = {
        amount: PropTypes.any.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        exact_amount: PropTypes.bool,
        decimalOffset: PropTypes.number,
        color: PropTypes.string,
        hide_asset: PropTypes.bool,
        hide_amount: PropTypes.bool,
        asPercentage: PropTypes.bool,
        assetInfoLinks: PropTypes.node
    };

    static defaultProps = {
        amount: 0,
        decimalOffset: 0,
        hide_asset: false,
        hide_amount: false,
        asPercentage: false,
        assetInfoLinks: null
    };

    static contextTypes = {
        history: React.PropTypes.object
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
        let {amount, decimalOffset, color, asset, hide_asset, hide_amount, asPercentage} = this.props;

        if( asset && asset.toJS ) asset = asset.toJS();

        let colorClass = color ? "facolor-" + color : "";

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset);

        if (hide_amount) {
            colorClass += " no-amount";
        }

        if (asPercentage) {
            let supply = parseInt(asset.dynamic.current_supply, 10);
            let percent = utils.format_number((amount / supply) * 100, 4);
            return (
                <span className={colorClass}>
                    {percent}%
                </span>
            )

        }

        var issuer = ChainStore.getObject(asset.issuer);
        var issuerName = issuer ? issuer.get('name') : '';

        const currency_popover_body = !hide_asset && <div>
            <HelpContent
                path={"assets/" + asset.symbol}
                alt_path="assets/Asset"
                section="summary"
                symbol={asset.symbol}
                description={asset.options.description}
                issuer={issuerName}/>
            {this.props.assetInfoLinks}
        </div>;

        return (
                <span className={colorClass}  >
                {!hide_amount ?
                  <FormattedNumber
                    value={this.props.exact_amount ? amount : amount / precision}
                    minimumFractionDigits={0}
                    maximumFractionDigits={decimals}
                    />
                : null}
                {!hide_asset && <Popover isOpen={this.state.isPopoverOpen} onOuterAction={this.closePopover} body={currency_popover_body}>
                    <span className="currency click-for-help" onClick={this.togglePopover}>{asset.symbol}</span>
                </Popover>}
                </span>
        );
    }
}

export default FormattedAsset;

