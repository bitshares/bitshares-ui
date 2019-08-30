import React from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import {Row, Col, Tooltip} from "bitshares-ui-style-guide";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import AssetSelect from "../Utility/AssetSelect";

class AmountSelector2 extends React.Component {
    static propTypes = {
        label: PropTypes.string,
        assetInput: PropTypes.string,
        asset: PropTypes.string,
        assets: PropTypes.array,
        amount: PropTypes.string,
        disabled: PropTypes.bool,
        onAssetInputChange: PropTypes.func,
        onAmountChange: PropTypes.func,
        onImageError: PropTypes.func,
        onSearch: PropTypes.func,
        imgName: PropTypes.string,
        placeholder: PropTypes.string
    };

    static defaultProps = {
        disabled: false,
        imgName: "unknown"
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
            onSearch,
            onAmountChange,
            onImageError,
            imgName,
            placeholder,
            tooltipText
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
            <AssetSelect
                showSearch={true}
                value={assetInput}
                onChange={onAssetInputChange}
                assets={assets}
                onSearch={onSearch}
            />
        );

        const image = (
            <img
                style={{
                    width: "3.5rem",
                    height: "3.5rem",
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
                placeholder={placeholder}
                disabled={disabled}
            />
        );

        return (
            <div
                className="amount-selector-2"
                style={{
                    minWidth: "3.5rem",
                    width: "100%"
                }}
            >
                {labelText}
                <Row
                    style={{
                        minWidth: "18rem"
                    }}
                >
                    <Col
                        style={{
                            minWidth: "3.5rem"
                        }}
                        span={5}
                    >
                        {image}
                    </Col>
                    <Col span={19}>
                        <Tooltip placement="top" title={tooltipText}>
                            {assetSelector}
                        </Tooltip>
                        {amountSelector}
                    </Col>
                </Row>
            </div>
        );
    }
}

export default AmountSelector2;
