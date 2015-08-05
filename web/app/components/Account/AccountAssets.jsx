import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import AccountActions from "actions/AccountActions";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import FormattedAsset from "../Utility/FormattedAsset";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import utils from "common/utils";
import AutocompleteInput from "../Forms/AutocompleteInput";
import debounce from "lodash.debounce";
import AccountInfo from "../Account/AccountInfo";
import LoadingIndicator from "../LoadingIndicator";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";

class AccountAssets extends React.Component {
    constructor() {
        super();

        this.state = {
            create: {
                symbol: "",
                name: "",
                description: "",
                max_supply: 1000000000000000,
                precision: 4
            },
            issue: {
                amount: 0,
                to: "",
                to_id: "",
                asset_id: "",
                symbol: ""
            },
            searchTerm: ""
        };

        this._searchAccounts = debounce(this._searchAccounts, 150);
    }

    componentDidMount() {
        let query_params = this.context.router.getCurrentQuery();
        if(query_params.create_asset) {
            console.log("zf publish create asset");
            ZfApi.publish("create_asset", "open");
        }
    }

    _onCreateInput(value, e) {
        let {create} = this.state;
        create[value] = e.target.value;
        this.setState({create: create});
    }

    _onIssueInput(value, e) {
        let key = e.target.id;
        let {issue} = this.state;

        if (key === "to") {
            this._searchAccounts(value);
            issue.to = e.target.value;
            let account = this.props.searchAccounts.findEntry((name) => {
                return name === e.target.value;
            });

            issue.to_id = account ? account[0] : null;
        } else {
            issue[value] = e.target.value;
        }

        this.setState({issue: issue});
    }

    _createAsset(account_id, e) {
        e.preventDefault();
        ZfApi.publish("create_asset", "close");
        let {create} = this.state;
        AssetActions.createAsset(account_id, create).then(result => {
            if (result) {
                notify.addNotification({
                    message: `Successfully created the asset ${create.symbol}`,//: ${this.state.wallet_public_name}
                    level: "success",
                    autoDismiss: 10
                });
            } else {
                notify.addNotification({
                    message: `Failed to create the asset`,//: ${this.state.wallet_public_name}
                    level: "error",
                    autoDismiss: 10
                });
            }
        });
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    _issueAsset(account_id, e) {
        e.preventDefault();
        ZfApi.publish("issue_asset", "close");
        let {issue} = this.state;
        let asset = this.props.assets.get(issue.asset_id);
        issue.amount *= utils.get_asset_precision(asset.precision);
        AssetActions.issueAsset(account_id, issue).then(result => {
            if (result) {
                notify.addNotification({
                    message: `Successfully issued ${utils.format_asset(issue.amount, this.props.assets.get(issue.asset_id))}`,//: ${this.state.wallet_public_name}
                    level: "success",
                    autoDismiss: 10
                });

                // Update the data for the asset
                AssetActions.getAsset(issue.asset_id);
            } else {
                notify.addNotification({
                    message: `Failed to issue asset`,//: ${this.state.wallet_public_name}
                    level: "error",
                    autoDismiss: 10
                });
            }
        });
    }

    _issueButtonClick(asset_id, symbol, e) {
        e.preventDefault();
        let {issue} = this.state;
        issue.asset_id = asset_id;
        issue.symbol = symbol;
        this.setState({issue: issue});
        ZfApi.publish("issue_asset", "open");
    }

    _onAccountSelect(account_name) {
        let {issue} = this.state;
        issue.to = account_name;
        issue.to_id = this.props.account_name_to_id[account_name];
        this.setState({issue: issue});
    }

    render() {
        let {account_name, cachedAccounts, assets, searchAccounts} = this.props;
        let account = cachedAccounts.get(account_name);
        let {issue} = this.state;

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        }
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }

        let isMyAccount = account.my_account;

        let myAssets = assets.filter(asset => {
            return asset.issuer === account.id;
        })
        .sort((a, b) => {
            return parseInt(a.id.substring(4, a.id.length), 10) - parseInt(b.id.substring(4, b.id.length), 10);
        })
        .map(asset => {
            return (
                    <tr>
                        <td>{asset.id}</td>
                        <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                        <td>{asset.options.description}</td>
                        <td><FormattedAsset amount={parseInt(asset.dynamic_data.current_supply, 10)} asset={asset} /></td>
                        <td><FormattedAsset amount={parseInt(asset.options.max_supply, 10)} asset={asset} /></td>
                        <td>{asset.precision}</td>
                        {isMyAccount ?
                            (<td>
                                <button onClick={this._issueButtonClick.bind(this, asset.id, asset.symbol)} className="button">Issue Asset</button>
                            </td>) : null}
                    </tr>
                );
        }).toArray();

        let autoCompleteAccounts = searchAccounts.filter(a => {
            return a.indexOf(this.state.searchTerm) !== -1;
        });

        return (
            <div className="grid-content">
                    <div className="content-block">
                        <h3>Issued Assets</h3>

                        <div>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Symbol</th>
                                    <th>Description</th>
                                    {/* <th>Public Data</th> FIXME: this column is hidden because its purpose overlaps with Description */}
                                    <Translate component="th" content="markets.supply" />
                                    <th>Max Supply</th>
                                    <th>Precision</th>
                                    {isMyAccount ? <th>{/* Issue asset button */}</th> : null}
                                </tr>
                                </thead>
                                <tbody>
                                    {myAssets}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {isMyAccount ?
                        (<div className="content-block">
                            <div className="actions clearfix">
                                <Trigger open="create_asset">
                                    <button className="button">Create New Asset</button>
                                </Trigger>
                            </div>
                        </div>) : null}

                    <Modal id="create_asset" overlay={true}>
                        <Trigger close="create_asset">
                            <a href="#" className="close-button">&times;</a>
                        </Trigger>
                        <br/>
                        <div className="grid-block vertical">
                            <form onSubmit={this._createAsset.bind(this, account.id)} noValidate>
                                <div className="shrink grid-content">
                                    <label><Translate content="account.user_issued_assets.symbol" />
                                        <input type="text" value={this.state.create.symbol} onChange={this._onCreateInput.bind(this, "symbol")}/>
                                    </label>

                                    <label><Translate content="account.user_issued_assets.description" />
                                    <input type="text" value={this.state.create.description} onChange={this._onCreateInput.bind(this, "description")} /></label>

                                    <label><Translate content="account.user_issued_assets.max_supply" />
                                    <input type="number" value={this.state.create.max_supply} onChange={this._onCreateInput.bind(this, "max_supply")} /></label>

                                    <label><Translate content="account.user_issued_assets.precision" />
                                    <input type="number" value={this.state.create.precision} onChange={this._onCreateInput.bind(this, "precision")} /></label>
                                </div>
                                <div className="grid-content button-group">
                                    <input type="submit" className="button" onClick={this._createAsset.bind(this, account.id)} value="Create Asset" />
                                    <Trigger close="create_asset">
                                        <a href className="secondary button">Cancel</a>
                                    </Trigger>
                                </div>
                            </form>
                        </div>
                    </Modal>

                    <Modal id="issue_asset" overlay={true}>
                        <Trigger close="issue_asset">
                            <a href="#" className="close-button">&times;</a>
                        </Trigger>
                        <br/>
                        <div className="grid-block vertical">
                            <form onSubmit={this._issueAsset.bind(this, account.id)} noValidate>
                                <div className="shrink grid-content">
                                    <label><Translate content="explorer.block.asset_issue" /><span>&nbsp;({issue.symbol})</span>
                                    <input type="number" value={issue.amount} onChange={this._onIssueInput.bind(this, "amount")} /></label>
                                    <div>
                                        <label>
                                        <Translate component="span" content="account.user_issued_assets.to" />
                                        </label>
                                        <AutocompleteInput
                                            id="to"
                                            options={autoCompleteAccounts}
                                            initial_value={issue.to}
                                            onChange={this._onIssueInput.bind(this, "amount")}
                                        />
                                    </div>
                                </div>
                                { issue.to_id ?
                                    <AccountInfo account_name={issue.to} account_id={issue.to_id} image_size={{height: 100, width: 100}}/> :
                                    <span>
                                        <div style={{height: 105, width: 100}} width={100 * 2} height={100 * 2}/>
                                        <br/>
                                        <br/>
                                    </span>
                                 }
                                <div className="grid-content button-group">
                                    <input type="submit" className="button" onClick={this._issueAsset.bind(this, account.id)} value="Issue Asset" />
                                    <Trigger close="issue_asset">
                                        <a href className="secondary button">Cancel</a>
                                    </Trigger>
                                </div>
                            </form>
                        </div>
                    </Modal>
            </div>
        );
    }
}

AccountAssets.contextTypes = { router: React.PropTypes.func.isRequired };

AccountAssets.defaultProps = {
    assets: [],
    symbol: "",
    name: "",
    description: "",
    max_supply: 0,
    precision: 0
};

AccountAssets.propTypes = {
    assets: PropTypes.object.isRequired,
    symbol: PropTypes.string.isRequired
};

export default AccountAssets;
