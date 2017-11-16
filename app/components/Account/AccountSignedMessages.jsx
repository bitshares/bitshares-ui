import React from "react";
import Translate from "react-translate-component";
import PubKeyInput from "../Forms/PubKeyInput";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {Signature, ChainStore, PublicKey} from "bitsharesjs/es";
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
const MSG_DATE = "timestamp";

/** This component gives a user interface for signing and verifying messages with the bitShares memo key.
 *  It consists of two tabs:
 *    - Sign message tab (code prefix: tabSM)
 *    - Verify message tab (code prefix: tabVM)
 *
 *  The message format that is underlying is as follows:
 *  -----BEGIN BITSHARES SIGNED MESSAGE-----
 *  <message from the account>
 *  -----BEGIN META-----
 *  account=<account name>
 *  memokey=<account memo public key>
 *  block=<last irreversible block>
 *  timestamp=<current time>
 *  -----BEGIN SIGNATURE-----
 *  <signature>
 *  -----END BITSHARES SIGNED MESSAGE-----
 *
 *    @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */
class AccountSignedMessages extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
    };

    constructor(props) {
        super(props);
        // initialize state (do not use setState method!)
        this.state = {
            tabsm_memo_key: this.props.account.get("options").get("memo_key"),
            tabsm_memo: "",
            tabsm_memo_signed: "",
            tabvm_memo: "",
            tabvm_verified: null,
            tabvm_memo_verified: null,
            tabvm_flag_verifyonchange: false
        };
    }

    /**
     * Parses the given raw string to a processing friendly dictionary
     *
     * @param message Memo as raw string, properly formatted with head/meta/signature/footer
     *
     * @returns {*} parsed memo as dictionary with the following fields:
     *              content : User message of the memo
     *              meta : Dictionary with the meta data
     *                      account : Account name of the signer
     *                      key : Memo public key of the signer
     *                      block : Current last irreversible block of the bitShares blockchain
     *                      timestamp : Time the memo was signed in UTC format
     *              signed : Seperate string that contains all data that will be signed (content + meta)
     *              signature : Signature of the signed data
     */
    parseMemo(message) {
        let messageContent, messageMeta, messageSignature, messageSignedContent;
        try {
            // cut the sections
            messageContent = message.split(MSG_HEAD)[1]; // everything before the head is ignored
            messageMeta = messageContent.split(MSG_META);
            messageContent = messageMeta[0].trim();
            messageSignature = messageMeta[1].split(MSG_SIGNATURE);
            messageMeta = messageSignature[0].trim();
            messageSignature = messageSignature[1].split(MSG_FOOT)[0].trim(); // everything after footer is ignored

            // how the signed content it built is crucial, consider encapsulating
            messageSignedContent = messageContent + "\n" + messageMeta;
        } catch (err) {
            throw new Error(counterpart.translate("account.signedmessages.invalidformat"));
        }

        let messageMetaAccount, messageMetaKey, messageMetaBlock, messageMetaTimestamp;
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

                // ... time stamp
                messageMetaTimestamp = messageMeta.split(MSG_DATE + "=");
                messageMetaTimestamp = messageMetaTimestamp[1].split("\n")[0].trim();
            } catch (err) {
                throw new Error(counterpart.translate("account.signedmessages.invalidformat"));
            }
        }

        // validate account and key
        let storedAccount = ChainStore.getAccount(messageMetaAccount);
        if (storedAccount == null) {
            throw new Error(counterpart.translate("account.signedmessages.invaliduser"));
        }
        let storedKey = storedAccount.get("options").get("memo_key");

        // validate keys are still the same
        if (messageMetaKey !== storedKey) {
            throw new Error(counterpart.translate("account.signedmessages.keymismatch"));
        }

        return { content : messageContent,
                 meta : { account : messageMetaAccount, key : storedKey, block : messageMetaBlock, timestamp : messageMetaTimestamp },
                 signed : messageSignedContent,
                 signature : messageSignature,
                 };
    }

    /**
     * Event when user pushes sign button. Memo message and meta will be signed and displayed
     * in the bottom textarea
     *
     * @param event
     */
    _tabSMSignAction(event) {
        event.preventDefault();
        // make sure wallet is unlocked (we need private key)
        Promise.resolve( WalletUnlockActions.unlock() ).then( () => {
            // there should be a message entered
            if(this.state.tabsm_memo) {
                try {
                    let memo = this.state.tabsm_memo;

                    // obtain all necessary keys
                    let memo_from_public = this.state.tabsm_memo_key;
                    // The 1s are base58 for all zeros (null)
                    if (/111111111111111111111/.test(memo_from_public)) {
                        memo_from_public = null;
                    }
                    let memo_from_privkey;
                    if (memo && memo_from_public) {
                        memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);
                        if (!memo_from_privkey) {
                            throw new Error(counterpart.translate("account.signedmessages.invalidkey"));
                        }
                    }
                    // get other meta data
                    let irr_block = ChainStore.getObject("2.1.0").get("last_irreversible_block_num");
                    let now = new Date();
                    // build meta data
                    let meta = MSG_SENDER + "=" + this.props.account.get("name") + "\n"
                                + MSG_PUBLICKEY + "=" + this.state.tabsm_memo_key + "\n"
                                + MSG_BLOCK + "=" + irr_block + "\n"
                                + MSG_DATE + "=" + now.toUTCString();

                    // sign memo
                    let memoToBeSigned = memo + "\n" + meta;
                    this._tabSMPopMessage(counterpart.translate("account.signedmessages.signing"), 0);

                    setTimeout(() => { // do not block gui
                        try {
                            let memo_signature = Signature.signBuffer(memoToBeSigned, memo_from_privkey, memo_from_public);
                            let memo_formatted = MSG_HEAD + "\n"
                                            + memo + "\n"
                                            + MSG_META + "\n"
                                            + meta + "\n"
                                            + MSG_SIGNATURE + "\n"
                                            + memo_signature.toHex() + "\n"
                                            + MSG_FOOT;
                            this.setState({
                                tabsm_memo_signed: memo_formatted,
                                tabsm_message: "" // clear loading message
                            });
                        } catch (err) {
                            this._tabSMPopMessage(err.message);
                            this.setState({
                                tabsm_memo_signed: null
                            });
                        }
                    }, 0);
                } catch (err) {
                    this._tabSMPopMessage(err.message);
                }

            }

        });
    }

    _tabSMHandleChange(event) { // event for textarea
        this.setState({tabsm_memo: event.target.value});
    }

    _tabSMHandleChangeKey(value) { // event for textfield of public key
        this.setState({tabsm_memo_key: value});
    }

    _tabSMCopyToClipBoard(event) { // event when user clicks into the signed message textarea
        if (event.target.value !== "") {
            event.target.focus();
            event.target.select();

            try {
                var successful = document.execCommand("copy");
                this._tabSMPopMessage(successful ? counterpart.translate("account.signedmessages.copysuccessful") :
                                                counterpart.translate("account.signedmessages.copyunsuccessful"));
            } catch (err) {
                this._tabSMPopMessage(counterpart.translate("account.signedmessages.copyunsuccessful"));
            }
        }
    }

    /**
     * Displays an information to the user that disappears over time
     *
     * @param message
     * @param timeout
     */
    _tabSMPopMessage(message, timeout=3000) {
        this.setState({
            tabsm_message: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        tabsm_message: ""
                    });
                }, timeout);
        }
    }

    /**
     * Event when the user tries to verify a memo, either manual through the button or onChange of the textarea.
     * The message is parsed and verified, the user gets the message restated in the bottom part of the site
     *
     * @param event
     */
    _tabVMAction(event) {
        event.preventDefault();

        // reset to unverified state
        this.setState({
            tabvm_memo_verified: null,
            tabvm_verified: false,
        });

        // attempt verifying
        if(this.state.tabvm_memo) {
            this._tabVMPopMessage(counterpart.translate("account.signedmessages.verifying"), 0);

            setTimeout(() => { // do not block gui
                try {
                    let memo = this.parseMemo(this.state.tabvm_memo);

                    // verify memo
                    let verified = false;
                    try {
                        verified = Signature.fromHex(memo.signature).verifyBuffer(memo.signed, PublicKey.fromPublicKeyString(memo.meta.key));
                    } catch (err) {
                        // wrap message that could be raised from Signature
                        throw new Error(counterpart.translate("account.signedmessages.errorverifying"));
                    }
                    if (!verified) {
                        throw new Error(counterpart.translate("account.signedmessages.invalidsignature"));
                    }
                    this.setState({
                        tabvm_memo_verified: memo,
                        tabvm_verified: verified,
                        tabvm_message: "" // clear verifying message
                    });
                } catch (err) {
                    this._tabVMPopMessage(err.message);
                    this.setState({
                        tabvm_memo_verified: null,
                        tabvm_verified: false
                    });
                }
            }, 0);
        }

    }

    _tabVMHandleChange(event) { // onchange event of the input textarea
        this.setState({
            tabvm_memo: event.target.value,
            tabvm_verified: false,
            tabvm_memo_verified: null,
        });
        if (this.state.tabvm_flag_verifyonchange) {
            this._tabVMAction(event);
        }
    }

    /**
     * Displays an information to the user that disappears over time
     *
     * @param message
     * @param timeout
     */
    _tabVMPopMessage(message, timeout=3000) {
        this.setState({
            tabvm_message: message
        });

        if (message !== "" && timeout > 0) {
            setTimeout(
                () => {
                    this.setState({
                        tabvm_message: ""
                    });
                }, timeout);
        }
    }

    _tabVMToggleVerifyOnChange() { // event when the user enables / disables verifying while typing
        this.setState({
            tabvm_flag_verifyonchange: !this.state.tabvm_flag_verifyonchange
        });
    }

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
                                    value={this.state.tabsm_memo_key}
                                    label="account.perm.memo_public_key"
                                    placeholder="Public Key"
                                    tabIndex={7}
                                    onChange={this._tabSMHandleChangeKey.bind(this)}
                                    disableActionButton={true}
                                />
                                <br/>
                                <textarea rows="10" value={this.state.tabsm_memo} onChange={this._tabSMHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                <span>
                                    <button className="button" onClick={this._tabSMSignAction.bind(this)}>
                                        <Translate content="account.signedmessages.sign"/>
                                    </button>
                                    <text style={{color: "gray"}}>{this.state.tabsm_message}</text>
                                </span>
                                <br/>
                                <br/>
                                <textarea rows="14"
                                          value={this.state.tabsm_memo_signed}
                                          style={{editable: false}}
                                          placeholder={counterpart.translate("account.signedmessages.automaticcreation")}
                                          onClick={this._tabSMCopyToClipBoard.bind(this)}  />
                            </div>
                        </Tab>

                        <Tab title="account.signedmessages.verifymessage">
                            <div className="grid-content" style={{overflowX: "hidden"}}>
                                <div className="content-block no-margin">
                                    <h3><Translate content="account.signedmessages.verifymessage"/></h3>
                                    <div style={{float: "right", marginTop: "0.1em", marginBottom: "0.5em"}}>
                                        <table><tr><td><label><Translate content="account.signedmessages.verifyonchange"/></label></td><td>
                                        <div className="switch" onClick={this._tabVMToggleVerifyOnChange.bind(this)}>
                                            <input type="checkbox" checked={this.state.tabvm_flag_verifyonchange} value={counterpart.translate("account.signedmessages.verifyonchange")} />
                                            <label />
                                        </div></td></tr></table>
                                    </div>
                                </div>
                                <textarea rows="10" value={this.state.tabvm_memo} onChange={this._tabVMHandleChange.bind(this)} placeholder={counterpart.translate("account.signedmessages.entermessage")} />
                                <span>
                                    <button className="button" onClick={this._tabVMAction.bind(this)}>
                                        <Translate content="account.signedmessages.verify"/>
                                    </button>
                                    <text style={{color: "gray"}}>{this.state.tabvm_message}</text>
                                    {this.state.tabvm_verified !== null &&
                                    <div style={{float: "right"}}>
                                        Message is:
                                        <div
                                            style={{backgroundColor: this.state.tabvm_verified ? "green" : "red"}}>
                                            <label>{this.state.tabvm_verified ? "verified" : "not verified"}</label>
                                        </div>
                                    </div>
                                    }
                                    {this.state.tabvm_verified && this.state.tabvm_memo_verified !== null &&
                                        <div>
                                            <br />
                                            <div style={{color: "gray"}}>
                                                Verified message from {this.state.tabvm_memo_verified.meta.account}, signed on {this.state.tabvm_memo_verified.meta.timestamp}:<br />
                                                <pre>{this.state.tabvm_memo_verified.content}</pre>
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




