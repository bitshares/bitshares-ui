import React from "react";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import Icon from "../Icon/Icon";
import AccountSelector from "../Account/AccountSelector";
import AssetSelector from "../Utility/AssetSelector";
import cnames from "classnames";
import Translate from "react-translate-component";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";

class AssetWhitelist extends React.Component {

    constructor(props) {
        super();

        this.state = {
            listType: props.assetWhiteListType,
            accountTable: props.assetWhiteListType.indexOf("market") === -1,
            listTypes: [
                "whitelist_authorities",
                "blacklist_authorities",
                "whitelist_markets",
                "blacklist_markets"
            ],
            assetInput: null,
            asset_id: null
        };
    }

    renderAccountTables() {
        const {listType} = this.state;

        if (!this.props.whiteListEnabled)
            return <div><Translate className="txtlabel cancel" component="p" content="explorer.asset.whitelist.enable_flag" /></div>;

        return (
            <div>
                <table className="table dashboard-table">
                    <thead>
                        <tr>
                            <th><Translate content="explorer.account.title" /></th>
                            <th><Translate content="account.perm.remove_text" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props[listType].map(a => {
                            return (
                                <tr key={a}>
                                    <td><LinkToAccountById account={a} /></td>
                                    <td className="clickable" onClick={this.props.onChangeList.bind(this, listType, "remove", a)}>
                                        <Icon name="cross-circle" className="icon-14px" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{paddingTop: "2rem"}}>
                    <AccountSelector
                        label={`account.whitelist.${listType}`}
                        accountName={this.props.authority_name}
                        account={this.props.authority_name}
                        onChange={this.props.onAccountNameChanged.bind(this, "authority_name")}
                        onAccountChanged={this.props.onAccountChanged.bind(this, "new_authority_id")}
                        error={null}
                        tabIndex={1}
                        action_label="account.perm.confirm_add"
                        onAction={this.props.onChangeList.bind(this, listType, "add", this.props.new_authority_id)}
                     />
                 </div>
             </div>
        );
    }

    _onAssetChange(asset) {
        this.setState({
            assetInput: asset
        });
    }

    _onAssetFound(asset) {
        this.setState({
            asset_id: asset ? asset.get("id") : null
        });
    }

    renderMarketTable() {
        const {listType} = this.state;

        return (
            <div>
                <table className="table dashboard-table">
                    <thead>
                        <tr>
                            <th><Translate content="explorer.asset.title" /></th>
                            <th><Translate content="account.perm.remove_text" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props[listType].map(a => {
                            return (
                                <tr key={a}>
                                    <td><LinkToAssetById asset={a} /></td>
                                    <td className="clickable" onClick={this.props.onChangeList.bind(this, listType, "remove", a)}>
                                        <Icon name="cross-circle" className="icon-14px" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{paddingTop: "2rem"}}>
                    <AssetSelector
                        label={`explorer.asset.whitelist.${listType}`}
                        onChange={this._onAssetChange.bind(this)}
                        asset={this.state.assetInput}
                        assetInput={this.state.assetInput}
                        tabIndex={1}
                        style={{width: "100%"}}
                        onFound={this._onAssetFound.bind(this)}
                        action_label="account.perm.confirm_add"
                        onAction={this.props.onChangeList.bind(this, listType, "add", this.state.asset_id)}
                    />
                </div>
            </div>
        );
    }

    _onSwitchType(type) {
        this.setState({
            listType: type,
            accountTable: type.indexOf("market") === -1
        });
        SettingsActions.changeViewSetting({
            assetWhiteListType: type
        });
    }

    render() {
        const {accountTable} = this.state;
        const activeIndex = this.state.listTypes.indexOf(this.state.listType);

        return (
            <div className="small-12 large-8 grid-content">
                <div>
                    <div className="hide-selector" style={{paddingBottom: "2rem"}}>
                        {this.state.listTypes.map((type, index) => {
                            return (
                                <div key={type} className={cnames("inline-block", {inactive: activeIndex !== index})} onClick={this._onSwitchType.bind(this, type)}>
                                    <Translate content={`explorer.asset.whitelist.${type}`} />
                                </div>
                            );
                        })}
                    </div>
                    {accountTable ? this.renderAccountTables() : this.renderMarketTable()}
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default connect(AssetWhitelist, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            assetWhiteListType: SettingsStore.getState().viewSettings.get(
                "assetWhiteListType",
                "whitelist_authorities"
            )
        };
    }
});
