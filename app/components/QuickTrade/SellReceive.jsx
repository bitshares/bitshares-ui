import React, {Component} from "react";
import AmountSelector from "../Utility/AmountSelector";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";

class SellReceive extends Component {
    static propTypes = {
        sellAmount: PropTypes.number,
        receiveAmount: PropTypes.number,
        assetToSell: PropTypes.string,
        assetToReceive: PropTypes.string,
        assetsToSell: PropTypes.array,
        assetsToReceive: PropTypes.array,
        onSellChange: PropTypes.func.isRequired,
        onReceiveChange: PropTypes.func.isRequired
    };

    render() {
        let {
            sellAmount,
            receiveAmount,
            assetToSell,
            assetToReceive,
            assetsToSell,
            assetsToReceive,
            onSellChange,
            onReceiveChange
        } = this.props;
        return (
            <div>
                <AmountSelector
                    label={"exchange.sell"}
                    amount={sellAmount}
                    asset={assetToSell}
                    assets={assetsToSell}
                    onChange={onSellChange}
                />
                <Icon name="swap" size="2x" />
                <AmountSelector
                    style={{marginTop: "1rem"}}
                    label={"exchange.receive"}
                    amount={receiveAmount}
                    asset={assetToReceive}
                    assets={assetsToReceive}
                    onChange={onReceiveChange}
                    disabled={true}
                />
            </div>
        );
    }
}

export default SellReceive;
