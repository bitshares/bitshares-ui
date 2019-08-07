import React, {Component} from "react";
import AmountSelector from "../Utility/AmountSelector";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";
import {Row, Col} from "bitshares-ui-style-guide";

class SellReceive extends Component {
    static propTypes = {
        sellAmount: PropTypes.string,
        receiveAmount: PropTypes.string,
        assetToSell: PropTypes.string,
        assetToReceive: PropTypes.string,
        assetsToSell: PropTypes.array,
        assetsToReceive: PropTypes.array,
        sellAssetPlaceholder: PropTypes.string,
        receiveAssetPlaceholder: PropTypes.string,
        onSellChange: PropTypes.func.isRequired,
        onReceiveChange: PropTypes.func.isRequired,
        onSwap: PropTypes.func.isRequired
    };

    render() {
        const smallScreen = window.innerWidth < 850 ? true : false;
        const {
            sellAmount,
            receiveAmount,
            assetToSell,
            assetToReceive,
            assetsToSell,
            assetsToReceive,
            sellAssetPlaceholder,
            receiveAssetPlaceholder,
            onSellChange,
            onReceiveChange,
            onSwap
        } = this.props;

        const sellSelector = (
            <AmountSelector
                label={"exchange.sell"}
                amount={sellAmount}
                asset={assetToSell}
                assetPlaceholder={sellAssetPlaceholder}
                assets={assetsToSell}
                onChange={onSellChange}
            />
        );

        const receiveSelector = (
            <AmountSelector
                label={"exchange.receive"}
                amount={receiveAmount}
                asset={assetToReceive}
                assetPlaceholder={receiveAssetPlaceholder}
                assets={assetsToReceive}
                onChange={onReceiveChange}
                disabled={true}
            />
        );
        const swapButton = (
            <div
                style={{
                    align: "center",
                    display: "flex",
                    justifyContent: "center"
                }}
            >
                <Icon
                    name="swap"
                    size="2x"
                    style={{
                        marginTop: "2rem"
                    }}
                    onClick={onSwap}
                />
            </div>
        );

        return (
            <div>
                {smallScreen ? (
                    <div>
                        <Row>{sellSelector}</Row>
                        <Row>{swapButton}</Row>
                        <Row>{receiveSelector}</Row>
                    </div>
                ) : (
                    <Row>
                        <Col span={10}>{sellSelector}</Col>
                        <Col span={4}>{swapButton}</Col>
                        <Col span={10}>{receiveSelector}</Col>
                    </Row>
                )}
            </div>
        );
    }
}

export default SellReceive;
