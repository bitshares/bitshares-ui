import React from "react";
import Translate from "react-translate-component";
import AssetWrapper from "../../components/Utility/AssetWrapper";
import {ChainStore} from "bitsharesjs";
import AccountStore from "stores/AccountStore";
import {connect} from "alt-react";
import {Radio, Modal, Checkbox} from "bitshares-ui-style-guide";

class SetDefaultFeeAssetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            useByDefault: true,
            selectedAssetId: ""
        };
    }

    shouldComponentUpdate(np) {
        return np.selectedAssetId !== this.state.selectedAssetId;
    }

    _onSelectedAsset(event) {
        if (event.target.checked) {
            this.setState({selectedAssetId: event.target.value});
        }
    }

    _getAssetsRows(assets) {
        return assets
            .map(asset => ({
                id: asset.get("id"),
                asset: asset.get("symbol"),
                link: `/asset/${asset.get("symbol")}`,
                balance: 0,
                fee: 0
            }))
            .sort((a, b) => a.balance - b.balance)
            .map(asset => {
                return (
                    <tr>
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

    render() {
        const assets = this.props.asset_types.map(id =>
            ChainStore.getAsset(id)
        );
        let assetRows = this._getAssetsRows(assets);

        return (
            <Modal
                visible={this.props.show}
                overlay={true}
                onCancel={this.props.close}
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
