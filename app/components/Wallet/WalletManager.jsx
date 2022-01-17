import React, {Component} from "react";
import {Link} from "react-router-dom";
import {connect} from "alt-react";
import WalletActions from "actions/WalletActions";
import BackupActions from "actions/BackupActions";
import WalletManagerStore from "stores/WalletManagerStore";
import Translate from "react-translate-component";
import cname from "classnames";
import counterpart from "counterpart";
import {Switch, Route} from "react-router-dom";
import {ExistingAccountOptions} from "./ExistingAccount";
import ImportKeys from "./ImportKeys";
import BalanceClaimActive from "./BalanceClaimActive";
import WalletChangePassword from "./WalletChangePassword";
import {WalletCreate} from "./WalletCreate";
import {BackupCreate, BackupRestore} from "./Backup";
import BackupBrainkey from "./BackupBrainkey";
import {Form, Select, Input, Button, Card} from "bitshares-ui-style-guide";

const FormItem = Form.Item;
const Option = Select.Option;

const connectObject = {
    listenTo() {
        return [WalletManagerStore];
    },
    getProps() {
        return WalletManagerStore.getState();
    }
};

class WalletManager extends Component {
    getTitle() {
        switch (this.props.location.pathname) {
            case "/wallet/create":
                return "wallet.create_wallet";
                break;

            case "/wallet/backup/create":
                return "wallet.create_backup";
                break;

            case "/wallet/backup/restore":
                return "wallet.restore_backup";
                break;

            case "/wallet/backup/brainkey":
                return "wallet.backup_brainkey";
                break;

            case "/wallet/delete":
                return "wallet.delete_wallet";
                break;

            case "/wallet/change-password":
                return "wallet.change_password";
                break;

            case "/wallet/import-keys":
                return "wallet.import_keys";
                break;

            default:
                return "wallet.console";
                break;
        }
    }

    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container" style={{maxWidth: "40rem"}}>
                    <div className="content-block">
                        <div className="page-header">
                            <Translate
                                component="h3"
                                content={this.getTitle()}
                            />
                        </div>
                        <div className="content-block">
                            <Switch>
                                <Route
                                    exact
                                    path="/wallet"
                                    component={WalletOptions}
                                />
                                <Route
                                    exact
                                    path="/wallet/change"
                                    component={ChangeActiveWallet}
                                />
                                <Route
                                    exact
                                    path="/wallet/change-password"
                                    component={WalletChangePassword}
                                />
                                <Route
                                    exact
                                    path="/wallet/import-keys"
                                    component={ImportKeys}
                                />
                                <Route
                                    exact
                                    path="/wallet/brainkey"
                                    component={ExistingAccountOptions}
                                />
                                <Route
                                    exact
                                    path="/wallet/create"
                                    component={WalletCreate}
                                />
                                <Route
                                    exact
                                    path="/wallet/delete"
                                    component={WalletDelete}
                                />
                                <Route
                                    exact
                                    path="/wallet/backup/restore"
                                    component={BackupRestore}
                                />
                                <Route
                                    exact
                                    path="/wallet/backup/create"
                                    component={BackupCreate}
                                />
                                <Route
                                    exact
                                    path="/wallet/backup/brainkey"
                                    component={BackupBrainkey}
                                />
                                <Route
                                    exact
                                    path="/wallet/balance-claims"
                                    component={BalanceClaimActive}
                                />
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
WalletManager = connect(WalletManager, connectObject);

class WalletOptions extends Component {
    render() {
        let has_wallet = !!this.props.current_wallet;
        let has_wallets = this.props.wallet_names.size > 1;
        let current_wallet = this.props.current_wallet
            ? this.props.current_wallet.toUpperCase()
            : "";
        return (
            <span>
                <div className="grid-block">
                    <div className="grid-content">
                        <Card>
                            <label>
                                <Translate content="wallet.active_wallet" />:
                            </label>
                            <div>{current_wallet}</div>
                            <br />
                            {has_wallets ? (
                                <Link to="/wallet/change">
                                    <div className="button outline success">
                                        <Translate content="wallet.change_wallet" />
                                    </div>
                                </Link>
                            ) : null}
                        </Card>
                    </div>

                    <div className="grid-content">
                        <Card>
                            <label>
                                <Translate content="wallet.import_keys_tool" />
                            </label>
                            <div style={{visibility: "hidden"}}>Dummy</div>
                            <br />
                            {has_wallet ? (
                                <Link to="/wallet/import-keys">
                                    <div className="button outline success">
                                        <Translate content="wallet.import_keys" />
                                    </div>
                                </Link>
                            ) : null}
                        </Card>
                    </div>

                    {has_wallet ? (
                        <div className="grid-content">
                            <Card>
                                <label>
                                    <Translate content="wallet.balance_claims" />
                                </label>
                                <div style={{visibility: "hidden"}}>Dummy</div>
                                <br />
                                <Link to="/wallet/balance-claims">
                                    <div className="button outline success">
                                        <Translate content="wallet.balance_claim_lookup" />
                                    </div>
                                </Link>
                                {/*<BalanceClaimByAsset>
                            <br/>
                            <div className="button outline success">
                                <Translate content="wallet.balance_claims" /></div>
                        </BalanceClaimByAsset>
                        */}
                            </Card>
                        </div>
                    ) : null}
                </div>

                {has_wallet ? (
                    <Link to="/wallet/backup/create">
                        <div className="button outline success">
                            <Translate content="wallet.create_backup" />
                        </div>
                    </Link>
                ) : null}

                {has_wallet ? (
                    <Link to="/wallet/backup/brainkey">
                        <div className="button outline success">
                            <Translate content="wallet.backup_brainkey" />
                        </div>
                    </Link>
                ) : null}

                <Link to="/wallet/backup/restore">
                    <div className="button outline success">
                        <Translate content="wallet.restore_backup" />
                    </div>
                </Link>

                <br />

                {has_wallet ? <br /> : null}

                <Link to="/wallet/create">
                    <div className="button outline success">
                        <Translate content="wallet.new_wallet" />
                    </div>
                </Link>

                {has_wallet ? (
                    <Link to="/wallet/delete">
                        <div className="button outline success">
                            <Translate content="wallet.delete_wallet" />
                        </div>
                    </Link>
                ) : null}

                {has_wallet ? (
                    <Link to="/wallet/change-password">
                        <div className="button outline success">
                            <Translate content="wallet.change_password" />
                        </div>
                    </Link>
                ) : null}
            </span>
        );
    }
}
WalletOptions = connect(WalletOptions, connectObject);

class ChangeActiveWallet extends Component {
    constructor() {
        super();
        this.state = {};
    }

    UNSAFE_componentWillMount() {
        let current_wallet = this.props.current_wallet;
        this.setState({current_wallet});
    }

    UNSAFE_componentWillReceiveProps(np) {
        if (np.current_wallet !== this.state.current_wallet) {
            this.setState({current_wallet: np.current_wallet});
        }
    }

    render() {
        let state = WalletManagerStore.getState();

        let options = [];
        state.wallet_names.forEach(wallet_name => {
            options.push(
                <Option key={wallet_name} value={wallet_name}>
                    {wallet_name.toLowerCase()}
                </Option>
            );
        });

        let is_dirty = this.state.current_wallet !== this.props.current_wallet;

        return (
            <div>
                <section>
                    <FormItem
                        label={counterpart.translate("wallet.active_wallet")}
                        className="no-offset"
                    >
                        <ul className={"unstyled-list"}>
                            <li
                                className="with-dropdown"
                                style={{borderBottom: 0}}
                            >
                                {state.wallet_names.count() <= 1 ? (
                                    <Input
                                        className="settings--input"
                                        defaultValue={this.state.current_wallet}
                                        disabled
                                    />
                                ) : (
                                    <Select
                                        className="settings--select"
                                        value={this.state.current_wallet}
                                        onChange={this.onChange.bind(this)}
                                    >
                                        {options}
                                    </Select>
                                )}
                            </li>
                        </ul>
                    </FormItem>
                </section>
                <Link to="/wallet/create">
                    <Button style={{marginRight: "16px"}}>
                        <Translate content="wallet.new_wallet" />
                    </Button>
                </Link>

                {is_dirty ? (
                    <Button onClick={this.onConfirm.bind(this)}>
                        <Translate
                            content="wallet.change"
                            name={this.state.current_wallet}
                        />
                    </Button>
                ) : null}
            </div>
        );
    }

    onConfirm() {
        WalletActions.setWallet(this.state.current_wallet);
        BackupActions.reset();
        // if (window.electron) {
        //     window.location.hash = "";
        //     window.remote.getCurrentWindow().reload();
        // }
        // else window.location.href = "/";
    }

    onChange(value) {
        let current_wallet = value;
        this.setState({current_wallet});
    }
}
ChangeActiveWallet = connect(ChangeActiveWallet, connectObject);

class WalletDelete extends Component {
    constructor() {
        super();
        this.state = {
            selected_wallet: null,
            confirm: 0
        };
    }

    _onCancel() {
        this.setState({
            confirm: 0,
            selected_wallet: null
        });
    }

    render() {
        if (this.state.confirm === 1) {
            return (
                <div style={{paddingTop: 20}}>
                    <h4>
                        <Translate content="wallet.delete_confirm_line1" />
                    </h4>
                    <Translate
                        component="p"
                        content="wallet.delete_confirm_line3"
                    />
                    <br />
                    <Button
                        onClick={this.onConfirm2.bind(this)}
                        style={{marginRight: "16px"}}
                    >
                        <Translate
                            content="wallet.delete_confirm_line4"
                            name={this.state.selected_wallet}
                        />
                    </Button>
                    <Button onClick={this._onCancel.bind(this)}>
                        <Translate content="wallet.cancel" />
                    </Button>
                </div>
            );
        }

        // this.props.current_wallet
        let placeholder = (
            <Option
                key="placeholder"
                value=" "
                disabled={this.props.wallet_names.size > 1}
            >
                &nbsp;
            </Option>
        );
        // if (this.props.wallet_names.size > 1) {
        //     placeholder = <option value="" disabled>{placeholder}</option>;
        // }
        // else {
        //     //When disabled and list_size was 1, chrome was skipping the
        //     //placeholder and selecting the 1st item automatically (not shown)
        //     placeholder = <option value="">{placeholder}</option>;
        // }
        let options = [placeholder];
        options.push(
            <Option key="select_option" value="">
                {counterpart.translate("settings.delete_select")}
                &hellip;
            </Option>
        );
        this.props.wallet_names.forEach(wallet_name => {
            options.push(
                <Option key={wallet_name} value={wallet_name}>
                    {wallet_name.toLowerCase()}
                </Option>
            );
        });
        let is_dirty = !!this.state.selected_wallet;

        return (
            <div style={{paddingTop: 20}}>
                <section>
                    <FormItem
                        label={counterpart.translate("wallet.delete_wallet")}
                        className="no-offset"
                    >
                        <ul className={"unstyled-list"}>
                            <li
                                className="with-dropdown"
                                style={{borderBottom: 0}}
                            >
                                <Select
                                    className="settings--select"
                                    value={this.state.selected_wallet || ""}
                                    style={{margin: "0 auto"}}
                                    onChange={this.onChange.bind(this)}
                                >
                                    {options}
                                </Select>
                            </li>
                        </ul>
                    </FormItem>
                </section>
                <Button
                    disabled={!is_dirty}
                    onClick={this.onConfirm.bind(this)}
                >
                    <Translate
                        content={
                            this.state.selected_wallet
                                ? "wallet.delete_wallet_name"
                                : "wallet.delete_wallet"
                        }
                        name={this.state.selected_wallet}
                    />
                </Button>
            </div>
        );
    }

    onConfirm() {
        this.setState({confirm: 1});
    }

    onConfirm2() {
        WalletActions.deleteWallet(this.state.selected_wallet);
        this._onCancel();
        // window.history.back()
    }

    onChange(selected_wallet) {
        this.setState({selected_wallet});
    }
}
WalletDelete = connect(WalletDelete, connectObject);

export default WalletManager;
export {WalletOptions, ChangeActiveWallet, WalletDelete};
