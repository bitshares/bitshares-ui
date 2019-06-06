import React from "react";
import Translate from "react-translate-component";
import AssetWrapper from "../../components/Utility/AssetWrapper";
import {ChainStore} from "bitsharesjs";
import AccountStore from "stores/AccountStore";
import {connect} from "alt-react";
import {Button, Radio, Modal, Checkbox} from "bitshares-ui-style-guide";

class SetDefaultFeeAssetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            useByDefault: true,
            selectedAssetId: null,
            balances: {}
        };
    }

    componentWillReceiveProps(np) {
        if (np.account && np.asset_types) {
            const balances = np.account.get("balances").toJS();
            this.setState({
                selectedAssetId: np.current_asset
                    ? np.current_asset
                    : this.state.selectedAssetId,
                balances: np.asset_types
                    .map(assetInfo => assetInfo.asset)
                    .reduce((result, asset_id) => {
                        const balanceObject = ChainStore.getObject(
                            balances[asset_id]
                        );
                        result[asset_id] = balanceObject.get("balance");
                        return result;
                    }, {})
            });
        }
    }

    _onSelectedAsset(event) {
        if (event.target.checked) {
            this.setState({selectedAssetId: event.target.value});
        }
    }

    _getAssetsRows(assets) {
        return assets
            .map(assetInfo => ({
                id: assetInfo.asset.get("id"),
                asset: assetInfo.asset.get("symbol"),
                link: `/asset/${assetInfo.asset.get("symbol")}`,
                balance:
                    assetInfo.balance /
                    Math.pow(10, assetInfo.asset.get("precision")),
                fee: assetInfo.fee
            }))
            .sort((a, b) => b.balance - a.balance)
            .map(asset => {
                return (
                    <tr key={asset.id}>
                        <td style={{textAlign: "center"}}>
                            <Radio
                                onChange={this._onSelectedAsset.bind(this)}
                                checked={
                                    this.state.selectedAssetId === asset.id
                                }
                                value={asset.id}
                            />
                        </td>
                        <td style={{textAlign: "left"}}>
                            <a href={asset.link}>{asset.asset}</a>
                        </td>
                        <td style={{textAlign: "right"}}>{asset.balance}</td>
                        <td style={{textAlign: "right"}}>{asset.fee}</td>
                    </tr>
                );
            });
    }

    onSubmit() {
        this.props.onChange(this.state.selectedAssetId);
        this.props.close();
    }

    render() {
        const assets = this.state.balances
            ? this.props.asset_types.map(assetInfo => ({
                  ...assetInfo,
                  asset: ChainStore.getAsset(assetInfo.asset),
                  balance: this.state.balances[assetInfo.asset]
              }))
            : [];
        let assetRows = this._getAssetsRows(assets);

        return (
            <Modal
                visible={this.props.show}
                overlay={true}
                onCancel={this.props.close}
                footer={[
                    <Button
                        key="submit"
                        disabled={!this.state.selectedAssetId}
                        onClick={this.onSubmit.bind(this)}
                    >
                        <Translate component="span" content="modal.ok" />
                    </Button>,
                    <Button key="cancel" onClick={this.props.close}>
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                <p>Select asset to pay fee</p>

                <table className="table dashboard-table">
                    <thead>
                        <tr>
                            <th style={{width: "10px"}} />
                            <th style={{textAlign: "left"}}>
                                <Translate content="account.asset" />
                            </th>
                            <th style={{textAlign: "right"}}>
                                <Translate content="exchange.balance" />
                            </th>
                            <Translate
                                component="th"
                                content="account.transactions.fee"
                                style={{textAlign: "right"}}
                            />
                        </tr>
                    </thead>
                    <tbody>{assetRows}</tbody>
                </table>
                <Checkbox
                    onClick={this._setSelectedAssetAsDefault.bind(this)}
                    checked={this.state.useByDefault}
                    style={{paddingTop: "30px"}}
                >
                    Make selected asset default for paying fees
                </Checkbox>
            </Modal>
        );
    }

    _setSelectedAssetAsDefault() {
        this.setState({useByDefault: !this.state.useByDefault});
        // TODO reference settings
    }
}

SetDefaultFeeAssetModal = AssetWrapper(SetDefaultFeeAssetModal);

class SetDefaultFeeAssetModalConnectWrapper extends React.Component {
    render() {
        return (
            <SetDefaultFeeAssetModal
                {...this.props}
                ref={this.props.refCallback}
            />
        );
    }
}

SetDefaultFeeAssetModalConnectWrapper = connect(
    SetDefaultFeeAssetModalConnectWrapper,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount
            };
        }
    }
);
export default SetDefaultFeeAssetModalConnectWrapper;
