import React from "react";
import Translate from "react-translate-component";
import PubKeyInput from "../Forms/PubKeyInput";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Signature, Aes, TransactionHelper, ChainStore, PublicKey} from "bitsharesjs/es";
import {Tabs, Tab} from "../Utility/Tabs";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import counterpart from "counterpart";

const MSG_SEPARATOR = "-- signed message -------------";
const MSG_SENDER =  "sender";
const MSG_PUBLICKEY = "public key";
const MSG_LIB = "last irreversible block when sent";

class Accountsignedmessages extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            signmessage_memo_key: this.props.account.get("options").get("memo_key"),
            signmessage_memo: "",
            signmessage_memo_signed: "",
            verifymessage_memo: "",
            verifymessage_verified: null
        };
    }

    onVerifyMemoAction(event) {
        event.preventDefault();

        if(this.state.verifymessage_memo) {
            // memo needs to have specific format
            let memoSplit = this.state.verifymessage_memo.split(MSG_SEPARATOR);
            if (memoSplit.length !== 2) {
                this.verifyMessagePopMessage("Invalid message");
                return;
            }
            let userMessage = memoSplit[0];

            // get target user
            let senderName = userMessage.split(MSG_SENDER + "=");
            senderName = senderName[1].split("\n");
            senderName = senderName[0];

            // get supposed target public keys
            let senderKey = userMessage.split(MSG_PUBLICKEY + "=");
            senderKey = senderKey[1].split("\n");
            senderKey = senderKey[0];

            let senderAccount = ChainStore.getAccount(senderName);
            let senderMemoPublicKey = senderAccount.get("options").get("memo_key");

            // validate keys are still the same
            if (senderKey !== senderMemoPublicKey) {
                this.verifyMessagePopMessage("Given public key of the sender doesn't to the one stored in the senders account");
                return;
            }

            // verify message
            let signature   = memoSplit[1].split("\n")[1];
            this.verifyMessagePopMessage(signature);

            let verified = Signature.fromHex(signature).verifyBuffer(userMessage, PublicKey.fromPublicKeyString(senderMemoPublicKey));
            window.console.log(verified)
            this.setState({
                verifymessage_verified: verified
            });
        }

    }

    onSignMemoAction(event) {
        event.preventDefault();
        // make sure wallet is unlocked (we need private key)
        Promise.resolve( WalletUnlockActions.unlock() ).then( () => {
            // there should be a message entered
            if(this.state.signmessage_memo) {
                let memo = this.state.signmessage_memo;

                let memo_from_public = this.state.signmessage_memo_key;
                // The 1s are base58 for all zeros (null)
                if( /111111111111111111111/.test(memo_from_public)) {
                    memo_from_public = null;
                }

                // user could specify a nonce ... but probably never will
                let optional_nonce = null;

                let memo_from_privkey;
                if(memo && memo_from_public) {
                    memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                    if(!memo_from_privkey) {
                        this.popMessage(counterpart.translate("account.signedmessages.invalidkey"));
                        throw new Error("Missing private memo key for sender: " + memo_from_public);
                    }
                }

                let irr_block = ChainStore.getObject("2.1.0").get("last_irreversible_block_num" );

                let extended_memo = memo + "\n\n"
                    + MSG_SENDER + "=" + this.props.account.get("name") + "\n"
                    + MSG_PUBLICKEY + "=" + this.state.signmessage_memo_key + "\n"
                    + MSG_LIB + "=" + irr_block + "\n";

                this.popMessage(counterpart.translate("account.signedmessages.signing"), 0)

                setTimeout(() => {
                    let memo_signature = Signature.signBuffer(extended_memo, memo_from_privkey, memo_from_public);

                    this.setState({
                        signmessage_memo_signed: extended_memo
                        + MSG_SEPARATOR  + "\n"
                        + memo_signature.toHex(),
                        signmessage_message: ""
                    });
                }, 0);

            }

        });
    }

    verifyMessageHandleChange(event) {
        this.setState({
            verifymessage_memo: event.target.value,
            verifymessage_verified: false
        });
    }

    signMessageHandleChange(event) {
        this.setState({signmessage_memo: event.target.value});
    }

    signMessageHandleChangeKey(value) {
        this.setState({signmessage_memo_key: value});
    }

    copySignedMemo(event) {
        if (event.target.value !== "") {
            event.target.focus();
            event.target.select();

            try {
                var successful = document.execCommand("copy");
                this.popMessage(successful ? counterpart.translate("account.signedmessages.copysuccessful") :
                                                counterpart.translate("account.signedmessages.copyunsuccessful"));
            } catch (err) {
                this.popMessage(counterpart.translate("account.signedmessages.copyunsuccessful"));
            }
        }
    }

    popMessage(message, timeout=2000) {
        this.setState({
            signmessage_message: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        signmessage_message: ""
                    });
                }, timeout);
        }
    }

    verifyMessagePopMessage(message, timeout=2000) {
        this.setState({
            verifymessage_message: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        verifymessage_message: ""
                    });
                }, timeout);
        }
    }

    // componentDidUpdate(prevProps, prevState) {
    //     // overridden
    //     if (this.state.message !== "") {
    //         setTimeout(
    //             () => {
    //                 this.setState({
    //                     message: ""
    //                 });
    //             }, 2000);
    //     }
    // }

    render() {

        return (
            <div className="grid-content">
                <div className="generic-bordered-box">
                    <Tabs
                        tabsClass="bordered-header no-padding"
                        setting="accountSignedMessagesTab"
                        contentClass="grid-content shrink small-vertical medium-horizontal no-padding"
                    >

                        <Tab title="account.signedmessages.signmessage">
                            <div className="grid-content" style={{overflowX: "hidden"}}>
                                <div className="content-block no-margin">
                                    <h3><Translate content="account.signedmessages.signmessage"/></h3>
                                </div>
                                <PubKeyInput
                                    ref="memo_key"
                                    value={this.state.signmessage_memo_key}
                                    label="account.perm.memo_public_key"
                                    placeholder="Public Key"
                                    tabIndex={7}
                                    onChange={this.signMessageHandleChangeKey.bind(this)}
                                    disableActionButton={true}
                                />
                                <br/>
                                <textarea rows="10" value={this.state.signmessage_memo} onChange={this.signMessageHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                <span>
                                    <button className="button" onClick={this.onSignMemoAction.bind(this)}>
                                        <Translate content="account.signedmessages.sign"/>
                                    </button>
                                    <text style={{color: "gray"}}>{this.state.signmessage_message}</text>
                                </span>
                                <br/>
                                <br/>
                                <textarea rows="14"
                                          value={this.state.signmessage_memo_signed}
                                          style={{editable: false}}
                                          placeholder={counterpart.translate("account.signedmessages.automaticcreation")}
                                          onClick={this.copySignedMemo.bind(this)}  />
                            </div>
                        </Tab>

                        <Tab title="account.signedmessages.verifymessage">
                            <div className="grid-content" style={{overflowX: "hidden"}}>
                                <div className="content-block no-margin">
                                    <h3><Translate content="account.signedmessages.verifymessage"/></h3>
                                </div>
                                <textarea rows="10" value={this.state.verifymessage_memo} onChange={this.verifyMessageHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                <span>
                                    <button className="button" onClick={this.onVerifyMemoAction.bind(this)}>
                                        <Translate content="account.signedmessages.verify"/>
                                    </button>
                                    <text style={{color: "gray"}}>{this.state.verifymessage_message}</text>
                                    {this.state.verifymessage_verified !== null &&
                                    <div style={{float: "right"}}>Message is:
                                        <div
                                            style={{backgroundColor: this.state.verifymessage_verified ? "green" : "red"}}>
                                            {this.state.verifymessage_verified ? "verified" : "not verified"}
                                        </div>
                                    </div>
                                    }
                                </span>
                            </div>
                        </Tab>

                    </Tabs>
                </div>
            </div>
        );
    }
}
Accountsignedmessages = BindToChainState(Accountsignedmessages);

export default Accountsignedmessages;


