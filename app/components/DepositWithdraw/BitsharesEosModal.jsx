import React from "react";
import AmountSelector from "components/Utility/AmountSelector";
import Translate from "react-translate-component";
import Trigger from "react-foundation-apps/src/trigger";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import PropTypes from "prop-types";

class BitsharesEosModal extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
        creator: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        owner_key: PropTypes.string.isRequired,
        ram: PropTypes.string.isRequired,
        account_contract: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        from: PropTypes.string.isRequired,
        create_account: PropTypes.number.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            amount_to_send: "",
            creator: this.props.creator,
            owner_key: this.props.owner_key,
            ram: this.props.ram,
            account_contract: this.props.account_contract,
            action: this.props.action,
            from: this.props.from,
            create_account: this.props.create_account,
            empty_amount_to_send_value: false,
            balance_error: false
        };
    }

    onAmountToSendChange({amount}) {
        this.setState({
            amount_to_send: amount,
            empty_amount_to_send_value:
                amount !== undefined && !parseFloat(amount)
        });
    }

    onSubmit() {
        console.log("Send");
    }

    render() {
        const disableSubmit = !this.state.amount_to_send;

        return (
            <form className="grid-block vertical full-width-content">
                <div className="grid-container">
                    <div className="content-block">
                        <h3>
                            <Translate
                                content="gateway.bitshares_beos.title"
                                name={this.props.name}
                            />
                        </h3>
                    </div>
                    {/* Account */}
                    <div className="content-block">
                        <label className="left-label">
                            <Translate
                                component="span"
                                content="gateway.bitshares_beos.account"
                            />
                        </label>
                        <div className="inline-label">
                            <input type="text" value={""} autoComplete="off" />
                        </div>
                    </div>
                    {/* Active key */}
                    <div className="content-block">
                        <label className="left-label">
                            <Translate
                                component="span"
                                content="gateway.bitshares_beos.active_key"
                            />
                        </label>
                        <div className="inline-label">
                            <input type="text" value={""} autoComplete="off" />
                        </div>
                    </div>
                    {/* Amount to send */}
                    <div className="content-block">
                        <AmountSelector
                            label="gateway.bitshares_beos.amount_to_send"
                            amount={this.state.amount_to_send}
                            asset={this.props.asset.get("id")}
                            assets={[this.props.asset.get("id")]}
                            placeholder="0.0"
                            onChange={this.onAmountToSendChange.bind(this)}
                            // display_balance={balance}
                        />
                        {this.state.empty_amount_to_send_value ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingTop: 10}}
                            >
                                <Translate content="transfer.errors.valid" />
                            </p>
                        ) : null}
                        {this.state.balance_error ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingTop: 10}}
                            >
                                <Translate content="transfer.errors.insufficient" />
                            </p>
                        ) : null}
                    </div>
                    {/* Buttons */}
                    <div className="button-group">
                        <div
                            onClick={this.onSubmit.bind(this)}
                            className={
                                "button" + (disableSubmit ? " disabled" : "")
                            }
                        >
                            <Translate
                                content="gateway.bitshares_beos.action"
                                action={this.props.operation}
                            />
                        </div>

                        <Trigger close={this.props.modal_id}>
                            <div className="button">
                                <Translate content="account.perm.cancel" />
                            </div>
                        </Trigger>
                    </div>
                </div>
            </form>
        );
    }
}

export default BindToChainState(BitsharesEosModal);
