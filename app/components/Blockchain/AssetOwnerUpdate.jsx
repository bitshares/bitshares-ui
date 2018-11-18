import React from "react";
import AccountSelector from "../Account/AccountSelector";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";

class AssetOwnerUpdate extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        currentOwner: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();

        this.state = {
            new_issuer_account_id: null,
            issuer_account_name: null
        };
    }

    onAccountNameChanged(key, name) {
        this.setState({
            [key]: name
        });
    }

    onAccountChanged(key, account) {
        this.setState({
            [key]: account ? account.get("id") : null
        });
    }

    onSubmit() {
        AssetActions.updateOwner(
            this.props.asset,
            this.state.new_issuer_account_id
        ).then(() => {
            this.onReset();
        });
    }

    onReset() {
        this.setState({
            new_issuer_account_id: null,
            issuer_account_name: null
        });
    }

    render() {
        const {currentOwner} = this.props;

        return (
            <div>
                <div style={{paddingBottom: "1rem"}}>
                    <AccountSelector
                        label="account.user_issued_assets.current_issuer"
                        accountName={currentOwner.get("name")}
                        account={currentOwner.get("name")}
                        error={null}
                        tabIndex={1}
                        disabled={true}
                    />
                </div>
                <AccountSelector
                    label="account.user_issued_assets.new_issuer"
                    accountName={this.state.issuer_account_name}
                    onChange={this.onAccountNameChanged.bind(
                        this,
                        "issuer_account_name"
                    )}
                    onAccountChanged={this.onAccountChanged.bind(
                        this,
                        "new_issuer_account_id"
                    )}
                    account={this.state.issuer_account_name}
                    error={null}
                    tabIndex={1}
                    typeahead={true}
                    excludeAccounts={[currentOwner.get("name")]}
                />
                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled: !this.state.new_issuer_account_id
                        })}
                        onClick={this.onSubmit.bind(this)}
                    >
                        <Translate content="account.user_issued_assets.update_owner" />
                    </button>
                    <button
                        className="button outline"
                        onClick={this.onReset.bind(this)}
                    >
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }
}

AssetOwnerUpdate = BindToChainState(AssetOwnerUpdate);
export default AssetOwnerUpdate;
