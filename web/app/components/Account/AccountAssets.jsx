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
import connectToStores from "alt/utils/connectToStores";

@connectToStores
class AccountAssets extends React.Component {
    static getStores() {
        return [AssetStore]
    }

    static getPropsFromStores() {
        return {assets: AssetStore.getState().assets}
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    };

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
            searchTerm: ""
        };

        this._searchAccounts = debounce(this._searchAccounts, 150);
    }

    _checkAssets(assets, force) {

        let lastAsset = assets.sort((a, b) => {
            if (a.symbol > b.symbol) {
                return 1;
            } else if (a.symbol < b.symbol) {
                return -1;
            } else {
                return 0;
            }
        }).last();
       
        if (assets.size === 0 || force) {
            AssetActions.getAssetList("A", 100);
            this.setState({assetsFetched: 100});  
        } else if (assets.size >= this.state.assetsFetched) {
            AssetActions.getAssetList(lastAsset.symbol, 100);           
            this.setState({assetsFetched: this.state.assetsFetched + 99}); 
        }
    }

    componentWillReceiveProps(nextProps) {
        this._checkAssets(nextProps.assets);
    }

    componentWillMount() {
        this._checkAssets(this.props.assets, true);
    }

    componentDidMount() {
        let query_params = this.context.router.getCurrentQuery();
        if(query_params.create_asset) {
            console.log("zf publish create asset");
            ZfApi.publish("create_asset", "open");
        }
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

    _editButtonClick(symbol, account_name, e) {
        e.preventDefault();
        this.context.router.transitionTo("account-update-asset", {account_name: account_name, asset: symbol});
    }

    _onAccountSelect(account_name) {
        let {issue} = this.state;
        issue.to = account_name;
        issue.to_id = this.props.account_name_to_id[account_name];
        this.setState({issue: issue});
    }

    render() {
        let {account, account_name, searchAccounts, assets} = this.props;
        let {issue, errors, isValid, create} = this.state;

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
                       <td style={{maxWidth: "200px"}}>{asset.options.description}</td>
                       <td><FormattedAsset amount={parseInt(asset.dynamic_data.current_supply, 10)} asset={asset.id} /></td>
                       <td><FormattedAsset amount={parseInt(asset.options.max_supply, 10)} asset={asset.id} /></td>
                       <td>
                          <button onClick={this._issueButtonClick.bind(this, asset.id, asset.symbol)} className="button outline">
                                <Translate content="transaction.trxTypes.asset_issue" />
                          </button>
                      </td>
                       <td>
                          <button onClick={this._editButtonClick.bind(this, asset.symbol, account_name)} className="button outline">
                                <Translate content="transaction.trxTypes.asset_update" />
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
                                    <th style={{maxWidth: "200px"}}>Description</th>
                                    <Translate component="th" content="markets.supply" />
                                    <th>Max Supply</th>
                                    <th>Issue</th>
                                    <th>Update</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {myAssets}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="content-block">
                        <Link to="account-create-asset" params={{account_name}}><button className="button outline">Create New Asset</button></Link>
                    </div>

                    <Modal id="create_asset" overlay={true}>
                        <Trigger close="create_asset">
                            <a href="#" className="close-button">&times;</a>
                        </Trigger>
                        <br/>
                        <div className="grid-block vertical">

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
