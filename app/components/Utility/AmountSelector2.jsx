import React from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import AmountSelector from "../Utility/AmountSelector";
import AssetSelector from "../Utility/AssetSelector";
import {Row, Col} from "bitshares-ui-style-guide";

class AmountSelector2 extends React.Component {
    static propTypes = {
        label: PropTypes.string,
        assetInput: PropTypes.string,
        asset: PropTypes.string,
        assets: PropTypes.array,
        amount: PropTypes.string,
        disabled: PropTypes.bool,
        onAssetInputChange: PropTypes.func,
        onFound: PropTypes.func,
        onAmountChange: PropTypes.func,
        onImageError: PropTypes.func,
        imgName: PropTypes.string,
        placeholder: PropTypes.string
    };

    static defaultProps = {
        disabled: false,
        imgName: "BTS"
    };

    render() {
        const {
            label,
            assetInput,
            asset,
            assets,
            amount,
            disabled,
            onAssetInputChange,
            onFound,
            onAmountChange,
            onImageError,
            imgName,
            placeholder
        } = this.props;

        const labelText = (
            <Translate
                className="left-label"
                component="label"
                content={label}
                style={{
                    fontSize: "1.2rem",
                    margin: "0",
                    padding: "0"
                }}
            />
        );

        const assetSelector = (
            <AssetSelector
                onChange={onAssetInputChange}
                asset={"1.3.0"} //do not change
                assets={assets}
                assetInput={assetInput}
                style={{width: "100%"}}
                onFound={onFound}
                error={" "} //do not change
                noLabel
            />
        );

        const image = (
            <img
                style={{
                    width: "5rem",
                    height: "5rem",
                    marginTop: "0.5rem"
                }}
                onError={onImageError}
                src={`${__BASE_URL__}asset-symbols/${imgName.toLowerCase()}.png`}
            />
        );

        const amountSelector = (
            <AmountSelector
                onChange={onAmountChange}
                amount={amount}
                asset={asset}
                assets={[asset]}
                style={{
                    marginTop: "-0.5rem",
                    padding: "0"
                }}
                placeholder={placeholder}
                disabled={disabled}
            />
        );

        return (
            <div className="amount-selector-2">
                {labelText}
                <Row>
                    <Col span={9}>{image}</Col>
                    <Col span={15}>
                        {assetSelector}
                        {amountSelector}
                    </Col>
                </Row>
            </div>
        );
    }
}

export default AmountSelector2;
