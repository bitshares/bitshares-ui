import React from "react";
import Translate from "react-translate-component";
import AssetWrapper from "../../components/Utility/AssetWrapper";
import SettingsActions from "actions/SettingsActions";
import {ChainStore, FetchChain} from "bitsharesjs";
import {connect} from "alt-react";
import {Button, Radio, Modal, Checkbox} from "bitshares-ui-style-guide";
import SettingsStore from "../../stores/SettingsStore";
import AccountStore from "../../stores/AccountStore";

class SetDefaultFeeAssetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            useByDefault: props.forceDefault ? true : false,
            selectedAssetId: null,
            balances: {}
        };
    }

    _updateStateForAccount(account, current_asset) {
        const balances = account.get("balances").toJS();
        this.setState({
            selectedAssetId: current_asset
                ? current_asset
                : this.state.selectedAssetId,
            balances: Object.keys(balances).reduce((result, asset_id) => {
                const balanceObject = ChainStore.getObject(balances[asset_id]);
                result[asset_id] = balanceObject.get("balance");
                return result;
            }, {})
        });
    }

    componentWillReceiveProps(np) {
        let account = np.account;
        if (!np.account) {
            account = ChainStore.getAccount(np.currentAccount);
        }
        if (account) {
            if (
                np.asset_types ||
                !this.state.balances ||
                account.get("accountName") !== this.props.currentAccount ||
                selectedAssetId !== np.current_asset
            ) {
                this._updateStateForAccount(account, np.current_asset);
            }
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
                        {this.props.displayFees ? (
                            <td style={{textAlign: "right"}}>{asset.fee}</td>
                        ) : null}
                    </tr>
                );
            });
    }

    onSubmit() {
        const {selectedAssetId, useByDefault} = this.state;
        this.props.onChange(selectedAssetId);
        if (useByDefault) {
            SettingsActions.changeSetting({
                setting: "fee_asset",
                value: ChainStore.getAsset(selectedAssetId).get("symbol")
            });
        }
        this.props.close();
    }

    render() {
        const assets = this.state.balances
            ? this.props.asset_types
                ? this.props.asset_types.map(assetInfo => ({
                      ...assetInfo,
                      asset: ChainStore.getAsset(assetInfo.asset),
                      balance: this.state.balances[assetInfo.asset]
                  }))
                : Object.keys(this.state.balances).map(asset_id => ({
                      asset: ChainStore.getAsset(asset_id),
                      balance: this.state.balances[asset_id]
                  }))
            : [];
        let assetRows = this._getAssetsRows(assets);

        return (
            <Modal
                visible={this.props.show}
                overlay={true}
                onCancel={this.props.close}
                footer={[
                    <div style={{position: "relative", left: "0px"}}>
                        <Button key="cancel" onClick={this.props.close}>
                            <Translate
                                component="span"
                                content="transfer.cancel"
                            />
                        </Button>
                        <Button
                            key="submit"
                            type="primary"
                            disabled={!this.state.selectedAssetId}
                            onClick={this.onSubmit.bind(this)}
                        >
                            <Translate
                                component="span"
                                content="explorer.asset.fee_pool.use_selected_asset"
                            />
                        </Button>
                    </div>
                ]}
                key="wrtfsadfs"
            >
                <p>
                    <Translate
                        component="span"
                        content="explorer.asset.fee_pool.select_fee_asset"
                    />
                </p>

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
                            {this.props.displayFees ? (
                                <Translate
                                    component="th"
                                    content="account.transactions.fee"
                                    style={{textAlign: "right"}}
                                />
                            ) : null}
                        </tr>
                    </thead>
                    <tbody>{assetRows}</tbody>
                </table>
                <Checkbox
                    onClick={this._setSelectedAssetAsDefault.bind(this)}
                    disabled={this.props.forceDefault}
                    checked={this.state.useByDefault}
                    style={{paddingTop: "30px"}}
                >
                    <Translate
                        component="span"
                        content="explorer.asset.fee_pool.use_asset_as_default_fee"
                    />
                </Checkbox>
            </Modal>
        );
    }

    _setSelectedAssetAsDefault() {
        this.setState({useByDefault: !this.state.useByDefault});
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
            return [SettingsStore, AccountStore];
        },
        getProps(props) {
            return {
                settings: SettingsStore.getState().settings,
                currentAccount: AccountStore.getState().currentAccount
            };
        }
    }
);
export default SetDefaultFeeAssetModalConnectWrapper;
