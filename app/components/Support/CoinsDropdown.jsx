/**
 * CoinsDropdown component
 *
 * Renders a coins dropdown list.
 */
import React from "react";
import DepositWithdrawAssetSelector from "components/DepositWithdraw/DepositWithdrawAssetSelector";

class CoinsDropdown extends React.Component {
    state = {};

    _onAssetSelected = asset => {
        const selectedAsset = this.props.coins.find(
            coin => coin.backingCoinType.toUpperCase() === asset
        );

        if (selectedAsset && this.props.onChange) {
            this.props.onChange(selectedAsset);
        }
    };

    render() {
        const symbolsToInclude = this.props.coins.map(coin => {
            return coin.backingCoinType.toUpperCase();
        });

        return (
            <div>
                <label htmlFor="coin-list">
                    <DepositWithdrawAssetSelector
                        onSelect={this._onAssetSelected.bind(this)}
                        include={symbolsToInclude}
                        selectOnBlur
                        includeBTS={false}
                        placeholder={
                            "cryptobridge.support.coin_list_placeholder"
                        }
                    />
                </label>
            </div>
        );
    }
}

export default CoinsDropdown;
