import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
import AccountActions from "actions/AccountActions";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import FormattedAsset from "../Utility/FormattedAsset";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import utils from "common/utils";
import AutocompleteInput from "../Forms/AutocompleteInput";
import {debounce} from "lodash";
import AccountInfo from "../Account/AccountInfo";
import LoadingIndicator from "../LoadingIndicator";
// import WalletDb from "stores/WalletDb";
// import WalletUnlockActions from "actions/WalletUnlockActions";
import BlockchainStore from "stores/BlockchainStore";
import validation from "common/validation";
import classnames from "classnames";
import counterpart from "counterpart";
import PrivateKeyStore from "stores/PrivateKeyStore";
import IssueModal from "../Modal/IssueModal"

class AccountAssets extends React.Component {

    static contextTypes = { router: React.PropTypes.func.isRequired }

    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    }

    static propTypes = {
        symbol: PropTypes.string.isRequired
    }

    constructor(props) {
        super(props);

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
            errors: {
                symbol: null
            },
            isValid: false,
            searchTerm: "",
            assets: AssetStore.getState().assets
        };

        this._searchAccounts = debounce(this._searchAccounts, 150);
    }

    onAssetsChange(state) {
        this.setState({assets: state.assets});
    }

    componentDidMount() {
        AssetStore.listen(this.onAssetsChange);
        let query_params = this.context.router.getCurrentQuery();
        if(query_params.create_asset) {
            console.log("zf publish create asset");
            ZfApi.publish("create_asset", "open");
        }
    }

    componentWillUnmount() {
        AssetStore.unlisten(this.onAssetsChange);
    }

    _onCreateInput(value, e) {
        let {create} = this.state;
        if (value === "symbol") {
            e.target.value = e.target.value.toUpperCase();
            // console.log(e.target.value, "is valid symbol", validation.is_valid_symbol(e.target.value));
        }
        create[value] = e.target.value;
        this.setState({create: create});
        this._validateCreateFields(create);
    }

    _validateCreateFields( new_state ) {

        let errors = {
            create: null
        };

        errors.create = validation.is_valid_symbol(new_state.symbol) ? null : "Invalid asset symbol";

        let isValid = errors.create === null;

        this.setState({isValid: isValid, errors: errors});
    }

    _onIssueInput(value, e) {
        let key = e.target.id;
        let {issue} = this.state;

        if (key === "to") {
            this._searchAccounts(e.target.value);
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
        console.log("account_id:", account_id);
        e.preventDefault();
        ZfApi.publish("create_asset", "close");
        let {create} = this.state;
        AssetActions.createAsset(account_id, create).then(result => {
            console.log("... AssetActions.createAsset(account_id, create)", account_id, create)
            // Notify 'Successfully created the asset' was running before transaction dialog confirm
            // if (result) {
            //     notify.addNotification({
            //         message: `Successfully created the asset ${create.symbol}`,//: ${this.state.wallet_public_name}
            //         level: "success",
            //         autoDismiss: 10
            //     });
            // } else {
            //     notify.addNotification({
            //         message: `Failed to create the asset`,//: ${this.state.wallet_public_name}
            //         level: "error",
            //         autoDismiss: 10
            //     });
            // }
        });
    }

    _searchAccounts(searchTerm) {
        AccountActions.accountSearch(searchTerm);
    }

    _issueAsset(account_id, e) {
        e.preventDefault();
        ZfApi.publish("issue_asset", "close");
        let {issue} = this.state;
        let asset = this.state.assets.get(issue.asset_id);
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
        let {account, account_name, searchAccounts} = this.props;
        let {issue, errors, isValid, create, assets} = this.state;


        // Calculate the CreateAsset fee by measuring the length of the symbol.
        // let symbolLength = create.symbol.length, createFee = "N/A";
        // if(symbolLength === 3) {
        //     createFee = <FormattedAsset amount={BlockchainStore.getFee("asset_create", ["symbol3"])} asset={"1.3.0"} />;
        // }
        // else if(symbolLength === 4) {
        //     createFee = <FormattedAsset amount={BlockchainStore.getFee("asset_create", ["symbol4"])} asset={"1.3.0"} />;
        // }
        // else if(symbolLength > 4) {
        //     createFee = <FormattedAsset amount={BlockchainStore.getFee("asset_create", ["long_symbol"])} asset={"1.3.0"} />;
        // }

        let accountExists = true;
        if (!account) {
            return <LoadingIndicator type="circle"/>;
        } else if (account.notFound) {
            accountExists = false;
        }
        if (!accountExists) {
            return <div className="grid-block"><h5><Translate component="h5" content="account.errors.not_found" name={account_name} /></h5></div>;
        }


       
        let isMyAccount = PrivateKeyStore.hasKey(account.getIn(["owner", "key_auths", "0", "0"]));
        // console.log("account:", account, "id:", account.get("id"));
        let myAssets = assets.filter(asset => {
            return asset.issuer === account.get("id");
        })
        .sort((a, b) => {
            return parseInt(a.id.substring(4, a.id.length), 10) - parseInt(b.id.substring(4, b.id.length), 10);
        })
        .map(asset => {
            return (
                    <tr>
                       <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                       <td>{asset.options.description}</td>
                       <td><FormattedAsset amount={parseInt(asset.dynamic_data.current_supply, 10)} asset={asset.id} /></td>
                       <td><FormattedAsset amount={parseInt(asset.options.max_supply, 10)} asset={asset.id} /></td>
                       <td>
                          <button onClick={this._issueButtonClick.bind(this, asset.id, asset.symbol)} className="button">
                                <Translate content="transaction.trxTypes.asset_issue" />
                          </button>
                      </td>
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
                                    <th>Symbol</th>
                                    <th>Description</th>
                                    {/* <th>Public Data</th> FIXME: this column is hidden because its purpose overlaps with Description */}
                                    <Translate component="th" content="markets.supply" />
                                    <th>Max Supply</th>
                                    <th>Issue</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {myAssets}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="content-block">
                        <div className="actions clearfix">
                            <Trigger open="create_asset">
                                <button className="button">Create New Asset</button>
                            </Trigger>
                        </div>
                    </div>

                    <Modal id="create_asset" overlay={true}>
                        <Trigger close="create_asset">
                            <a href="#" className="close-button">&times;</a>
                        </Trigger>
                        <br/>
                        <div className="grid-block vertical">
                            <form onSubmit={this._createAsset.bind(this, account.get("id"))} noValidate>
                                <div className="shrink grid-content">
                                    <label><Translate content="account.user_issued_assets.symbol" />
                                        <input type="text" value={create.symbol} onChange={this._onCreateInput.bind(this, "symbol")}/>
                                    </label>
                                    { errors.create ? <p className="grid-content has-error">{errors.create}</p> : null}

                                    <label><Translate content="account.user_issued_assets.description" />
                                    <input type="text" value={create.description} onChange={this._onCreateInput.bind(this, "description")} /></label>

                                    <label><Translate content="account.user_issued_assets.max_supply" />
                                    <input type="number" value={create.max_supply} onChange={this._onCreateInput.bind(this, "max_supply")} /></label>

                                    <label><Translate content="account.user_issued_assets.precision" />
                                    <input type="number" value={create.precision} onChange={this._onCreateInput.bind(this, "precision")} /></label>

                                </div>
                                <div className="grid-content button-group">
                                    <input type="submit" className={classnames("button", {disabled: !isValid || create.symbol.length < 3})} onClick={this._createAsset.bind(this, account.get("id"))} value="Create Asset" />
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
                            <IssueModal asset_to_issue={this.state.issue.asset_id} />
                        </div>
                    </Modal>
            </div>
        );
    }
}

export default AccountAssets;
