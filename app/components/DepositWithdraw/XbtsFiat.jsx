import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";
import cnames from "classnames";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import AccountBalance from "../Account/AccountBalance";
import utils from "common/utils";
//import SettingsStore from "stores/SettingsStore";

const logoPayeer =
    "data:image/png;base64,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";

const cur = {
    "XBTSX.USD": {
        ticker: "usd",
        min: 2,
        max: 3000,
        id: "1.3.5888"
    },
    "XBTSX.RUB": {
        ticker: "rub",
        min: 100,
        max: 100000,
        id: "1.3.5887"
    },
    "XBTSX.EUR": {
        ticker: "eur",
        min: 2,
        max: 3000,
        id: "1.3.5889"
    }
};

const providers = {
    payeer: {
        placeholder: "P000000",
        fee: "2%",
        pattern: "[Pp]{1}[0-9]{7,15}"
    }
    /*
    "qiwi": {
        placeholder: "79112223344",
        fee: "6%",
        pattern: ""
    }
     */
};

class XbtsFiat extends React.Component {
    static propTypes = {
        XbtsFiat: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        XbtsFiat: "1.2.1003283",
        asset: "XBTSX.USD",
        provider: "payeer"
    };

    constructor(props) {
        super();

        this.state = {
            action: props.viewSettings.get("xbtsFiatAction", "deposit"),
            min: 2,
            max: 5000,
            asset: "XBTSX.USD",
            provider: "payeer"
        };
    }

    _renderDeposits() {
        return (
            <div className="">
                <p>
                    <img
                        onClick={() =>
                            window.open(
                                "https://payeer.com/013901230",
                                "_blank"
                            )
                        }
                        src={logoPayeer}
                    />
                </p>
                <p>
                    <a
                        rel="noreferrer"
                        className="button"
                        target={"_blank"}
                        style={{color: "white"}}
                        href={
                            "https://xbts.io/deposit/rub?account=" +
                            this.props.account.get("name")
                        }
                    >
                        ADD RUBLE
                    </a>
                    <a
                        rel="noreferrer"
                        className="button"
                        target={"_blank"}
                        style={{color: "white"}}
                        href={
                            "https://xbts.io/deposit/usd?account=" +
                            this.props.account.get("name")
                        }
                    >
                        ADD USD
                    </a>
                    <a
                        rel="noreferrer"
                        className="button"
                        target={"_blank"}
                        style={{color: "white"}}
                        href={
                            "https://xbts.io/deposit/eur?account=" +
                            this.props.account.get("name")
                        }
                    >
                        ADD EURO
                    </a>
                </p>
            </div>
        );
    }

    onSelectCoin(e) {
        this.setState({
            asset: e.target.value,
            max: cur[e.target.value].max,
            provider: "payeer"
        });
    }

    onSelectProvider(e) {
        this.setState({
            //asset: this.state.asset,
            //max: this.state.max,
            provider: e.currentTarget.value
        });
    }

    _renderWithdrawals() {
        let {asset, max, provider} = this.state;
        return (
            <div>
                <p>
                    <img
                        onClick={() =>
                            window.open(
                                "https://payeer.com/013901230",
                                "_blank"
                            )
                        }
                        src={logoPayeer}
                    />
                </p>
                <select
                    className="external-coin-types bts-select"
                    onChange={this.onSelectCoin.bind(this)}
                    value={asset}
                >
                    <option value="XBTSX.RUB" key="XBTSX.RUB">
                        RUBLE
                    </option>
                    <option value="XBTSX.USD" key="XBTSX.USD">
                        USD
                    </option>
                    <option value="XBTSX.EUR" key="XBTSX.EUR">
                        EUR
                    </option>
                </select>

                <div>
                    <br />
                    <p>
                        <input
                            type="radio"
                            id="payeer"
                            name="provider"
                            value="payeer"
                            checked={provider === "payeer"}
                            onChange={this.onSelectProvider.bind(this)}
                        />
                        <label htmlFor="payeer">
                            PAYEER {asset.substr(6, 3)}(FEE 2%)
                        </label>
                        <small>max. {max}</small>

                        {/*
                        <br/>
                        <input type="radio" id="qiwi" name="provider" value="qiwi"  checked={provider === "qiwi"} onChange={this.onSelectProvider.bind(this)}/>
                        <label
                            htmlFor="qiwi">QIWI {asset.substr(6,3)}(FEE 5%)
                        </label>
                        <small>max. {max}</small>
                         */}

                        <br />
                        <input
                            type="radio"
                            id="card"
                            name="provider"
                            value="card"
                            checked={false}
                            disabled={true}
                            onChange={this.onSelectProvider.bind(this)}
                        />
                        <label htmlFor="card">
                            Visa/Master {asset.substr(6, 3)}(5$ + 5%)
                        </label>
                        <small>max. {max}</small>
                    </p>
                    <p>
                        <small style={{color: "pink"}}>
                            Attention! Please check the number and number format
                            before sending! In case of an error, money will not
                            be returned!
                        </small>
                    </p>
                </div>

                <form onSubmit={this._onSubmit.bind(this)}>
                    <div style={{padding: "20px 0"}}>
                        <Translate content="gateway.balance" />: &nbsp;
                        <span
                            style={{
                                fontWeight: "bold",
                                color: "#4A90E2",
                                textAlign: "right"
                            }}
                        >
                            <AccountBalance
                                account={this.props.account.get("name")}
                                asset={asset}
                            />
                        </span>
                    </div>

                    <label>
                        WALLET ADDRESS
                        <input
                            required
                            id="iban"
                            type="text"
                            placeholder={providers[provider].placeholder}
                        />
                    </label>

                    <label>
                        <Translate content="exchange.quantity" />
                        <input
                            required
                            id="amount"
                            type="number"
                            min={this.state.min}
                            max={this.state.max}
                        />
                    </label>

                    <button className="button" type="submit">
                        <Translate content="gateway.withdraw_now" />
                    </button>
                </form>
            </div>
        );
    }

    changeAction(action) {
        this.setState({
            action
        });

        SettingsActions.changeViewSetting({
            xbtsFiatAction: action
        });
    }

    _onSubmit(e) {
        e.preventDefault();
        let {min, max, provider} = this.state;
        let {asset, account, XbtsFiat} = this.props;

        let amount = parseInt(this.refs.amount.value, 10);
        let iban = this.refs.iban.value;

        const re = new RegExp("[Pp]{1}[0-9]{7,15}");
        const isValid = re.test(iban);

        if (!isValid) {
            //return;
        }

        //console.log("amount:", amount, "iban:", iban);

        let assetId = cur[this.state.asset].id;

        let precision = utils.get_asset_precision(asset.get("precision"));

        if (amount < min || amount > max) {
            return;
        }

        AccountActions.transfer(
            account.get("id"), // from user
            XbtsFiat.get("id"), // to XbtsFiat account
            parseInt(amount * precision, 10), // amount in full precision
            assetId, //asset.get("id"), // XBTS Fiat asset id
            //new Buffer(cur[this.state.asset].ticker + ":" + iban.toUpperCase(), "utf-8"), // memo
            new Buffer(
                provider +
                    ":" +
                    cur[this.state.asset].ticker +
                    ":" +
                    iban.toUpperCase().trim(),
                "utf-8"
            ), // memo
            null, // propose set to false
            assetId //asset.get("id") // Pay fee with XBTS FIAT or 1.3.0 BTS
        ).then(() => {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        });
    }

    onTrxIncluded(confirm_store_state) {
        if (
            confirm_store_state.included &&
            confirm_store_state.broadcasted_transaction
        ) {
            // this.setState(Transfer.getInitialState());
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    openUrl(link) {
        window.open(link);
    }

    render() {
        //let {account, asset} = this.props;
        let {action} = this.state;

        return (
            <div className="XbtsFiat">
                <div className="content-block">
                    <div style={{paddingBottom: 15}}>
                        <div
                            style={{marginRight: 10}}
                            onClick={this.changeAction.bind(this, "deposit")}
                            className={cnames(
                                "button",
                                action === "deposit" ? "active" : "outline"
                            )}
                        >
                            <Translate content="gateway.deposit" />
                        </div>
                        <div
                            onClick={this.changeAction.bind(this, "withdraw")}
                            className={cnames(
                                "button",
                                action === "withdraw" ? "active" : "outline"
                            )}
                        >
                            <Translate content="gateway.withdraw" />
                        </div>
                    </div>

                    {action === "deposit"
                        ? this._renderDeposits()
                        : this._renderWithdrawals()}
                </div>
            </div>
        );
    }
}

export default BindToChainState(XbtsFiat);
