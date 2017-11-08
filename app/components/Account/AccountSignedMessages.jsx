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

// constants for message format
const MSG_HEAD = "-----BEGIN BITSHARES SIGNED MESSAGE-----";
const MSG_META = "-----BEGIN META-----";
const MSG_SIGNATURE = "-----BEGIN SIGNATURE-----";
const MSG_FOOT = "-----END BITSHARES SIGNED MESSAGE-----";
const MSG_SENDER =  "account";
const MSG_PUBLICKEY = "memokey";
const MSG_BLOCK = "block";

/*This component gives a user interface for signing and verifying messages with the bitShares memo key.
    It consists of two tabs:
 - Sign message tab (code prefix: signmessage)
 - Verify message tab (code prefix: verifymessage) */
class AccountSignedMessages extends React.Component {

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

    parseMessage(message) {
        let messageContent, messageMeta, messageSignature, messageSignedContent;
        try {
            // cut the sections
            messageContent = message.split(MSG_HEAD)[1]; // everything before the head is ignored
            messageMeta = messageContent.split(MSG_META);
            messageContent = messageMeta[0].trim();
            messageSignature = messageMeta[1].split(MSG_SIGNATURE);
            messageMeta = messageSignature[0].trim();
            messageSignature = messageSignature[1].split(MSG_FOOT)[0].trim(); // everything after footer is ignored
            messageSignedContent = messageContent + "\n" + messageMeta;
        } catch (err) {
            this.verifyMessagePopMessage(counterpart.translate("account.signedmessages.invalidformat"));
            return null;
        }

        let messageMetaAccount, messageMetaKey, messageMetaBlock;
        if (messageMeta) {
            try {
                // process meta
                // ... sender
                messageMetaAccount = messageMeta.split(MSG_SENDER + "=");
                messageMetaAccount = messageMetaAccount[1].split("\n")[0].trim();

                // ... and its public key
                messageMetaKey = messageMeta.split(MSG_PUBLICKEY + "=");
                messageMetaKey = messageMetaKey[1].split("\n")[0].trim();

                // ... block number
                messageMetaBlock = messageMeta.split(MSG_BLOCK + "=");
                messageMetaBlock = messageMetaBlock[1].split("\n")[0].trim();
            } catch (err) {
                this.verifyMessagePopMessage(counterpart.translate("account.signedmessages.invalidformat"));
                return null;
            }
        }

        // validate account and key
        let storedAccount = ChainStore.getAccount(messageMetaAccount);
        let storedKey = storedAccount.get("options").get("memo_key");

        // validate keys are still the same
        if (messageMetaKey !== storedKey) {
            this.verifyMessagePopMessage(counterpart.translate("account.signedmessages.keymismatch"));
            return null;
        }

        return { content : messageContent,
                 meta : { account : messageMetaAccount, key : storedKey, block : messageMetaBlock },
                 signed : messageSignedContent,
                 signature : messageSignature,
                 };
    }

    verifyMessageAction(event) {
        event.preventDefault();
        this.setState({
            verifymessage_verified: false,
        });

        if(this.state.verifymessage_memo) {
            this.verifyMessagePopMessage(counterpart.translate("account.signedmessages.verifying"), 0);

            setTimeout(() => {
                let message = this.parseMessage(this.state.verifymessage_memo);

                if (message !== null) {

                    // verify message
                    let verified = Signature.fromHex(message.signature).verifyBuffer(message.signed, PublicKey.fromPublicKeyString(message.meta.key));

                    this.setState({
                        verifymessage_verified: verified,
                        verifymessage_message: "" // remove verifying text
                    });

                }
            }, 0);
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

                let memo_from_privkey;
                if(memo && memo_from_public) {
                    memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                    if(!memo_from_privkey) {
                        this.popMessage(counterpart.translate("account.signedmessages.invalidkey"));
                        throw new Error("Missing private memo key for sender: " + memo_from_public);
                    }
                }

                let irr_block = ChainStore.getObject("2.1.0").get("last_irreversible_block_num" );

                let meta = MSG_SENDER + "=" + this.props.account.get("name") + "\n"
                    + MSG_PUBLICKEY + "=" + this.state.signmessage_memo_key + "\n"
                    + MSG_BLOCK + "=" + irr_block;

                let memoToBeSigned = memo + "\n" + meta;

                this.popMessage(counterpart.translate("account.signedmessages.signing"), 0);

                setTimeout(() => {
                    let memo_signature = Signature.signBuffer(memoToBeSigned, memo_from_privkey, memo_from_public);
                    let memo_formatted = MSG_HEAD + "\n"
                                        + memo + "\n"
                                        + MSG_META + "\n"
                                        + meta + "\n"
                                        + MSG_SIGNATURE + "\n"
                                        + memo_signature.toHex() + "\n"
                                        + MSG_FOOT;
                    this.setState({
                        signmessage_memo_signed: memo_formatted,
                        signmessage_message: "" // removes calculating message
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
                                    <button className="button" onClick={this.verifyMessageAction.bind(this)}>
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
AccountSignedMessages = BindToChainState(AccountSignedMessages);

export default AccountSignedMessages;


