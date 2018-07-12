import alt from "alt-instance";
import counterpart from "counterpart";
import {Signature, ChainStore, PublicKey} from "bitsharesjs/es";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletDb from "stores/WalletDb";

const MSG_HEAD = "-----BEGIN BITSHARES SIGNED MESSAGE-----";
const MSG_META = "-----BEGIN META-----";
const MSG_SIGNATURE = "-----BEGIN SIGNATURE-----";
const MSG_FOOT = "-----END BITSHARES SIGNED MESSAGE-----";
const MSG_SENDER = "account";
const MSG_PUBLICKEY = "memokey";
const MSG_BLOCK = "block";
const MSG_DATE = "timestamp";

/** This action provides following functionalities:
 *    - Sign a message
 *    - Verify a given message
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
class SignedMessageAction {
    /**
     * Parses the given raw string to a processing friendly dictionary
     *
     * @param message Message as raw string, properly formatted with head/meta/signature/footer
     *
     * @returns {*} parsed message as dictionary with the following fields:
     *              content : User message of the message
     *              meta : Dictionary with the meta data
     *                      account : Account name of the signer
     *                      key : Memo public key of the signer
     *                      block : Current last irreversible block of the bitShares blockchain
     *                      timestamp : Time the message was signed in UTC format
     *              signed : Seperate string that contains all data that will be signed (content + meta)
     *              signature : Signature of the signed data
     */
    parseMessage(message) {
        let messageContent, messageMeta, messageSignature, messageSignedContent;
        try {
            // cut the sections
            messageContent = message.split(MSG_HEAD)[1]; // everything before the head is ignored
            messageMeta = messageContent.split(MSG_META);
            messageContent = messageMeta[0].replace(/^\n|\n$/g, "");
            messageSignature = messageMeta[1].split(MSG_SIGNATURE);
            messageMeta = messageSignature[0].trim();
            messageSignature = messageSignature[1].split(MSG_FOOT)[0].trim(); // everything after footer is ignored

            // how the signed content it built is crucial, consider encapsulating
            messageSignedContent = messageContent + "\n" + messageMeta;
        } catch (err) {
            throw new Error(
                counterpart.translate("account.signedmessages.invalidformat")
            );
        }

        let messageMetaAccount,
            messageMetaKey,
            messageMetaBlock,
            messageMetaTimestamp;
        if (messageMeta) {
            try {
                // process meta
                // ... sender
                messageMetaAccount = messageMeta.split(MSG_SENDER + "=");
                messageMetaAccount = messageMetaAccount[1]
                    .split("\n")[0]
                    .trim();

                // ... and its public key
                messageMetaKey = messageMeta.split(MSG_PUBLICKEY + "=");
                messageMetaKey = messageMetaKey[1].split("\n")[0].trim();

                // ... block number
                messageMetaBlock = messageMeta.split(MSG_BLOCK + "=");
                messageMetaBlock = messageMetaBlock[1].split("\n")[0].trim();

                // ... time stamp
                messageMetaTimestamp = messageMeta.split(MSG_DATE + "=");
                messageMetaTimestamp = messageMetaTimestamp[1]
                    .split("\n")[0]
                    .trim();
            } catch (err) {
                throw new Error(
                    counterpart.translate(
                        "account.signedmessages.invalidformat"
                    )
                );
            }
        }

        return {
            content: messageContent,
            meta: {
                account: messageMetaAccount,
                key: messageMetaKey,
                block: messageMetaBlock,
                timestamp: messageMetaTimestamp
            },
            signed: messageSignedContent,
            signature: messageSignature
        };
    }

    /**
     * The given string message is parsed and then its signature verified. A positive verification return the parsed
     * message, anything else throws an exeption.
     *
     * @param message Message as raw string, properly formatted with head/meta/signature/footer, or already parsed message
     *
     * @returns parsed message, see parseMessage
     */
    verifyMemo(message) {
        let message_signed;
        if (typeof message === "string" || message instanceof String) {
            message_signed = this.parseMessage(message);
        } else {
            // assume its a dictionary
            message_signed = message;
        }

        // validate account and key
        let storedAccount = ChainStore.getAccount(message_signed.meta.account);
        if (storedAccount == null) {
            throw new Error(
                counterpart.translate("account.signedmessages.invaliduser")
            );
        }

        // verify message signed
        let verified = false;
        try {
            verified = Signature.fromHex(message_signed.signature).verifyBuffer(
                message_signed.signed,
                PublicKey.fromPublicKeyString(message_signed.meta.key)
            );
        } catch (err) {
            // wrap message that could be raised from Signature
            throw new Error(
                counterpart.translate("account.signedmessages.errorverifying")
            );
        }
        if (!verified) {
            throw new Error(
                counterpart.translate("account.signedmessages.invalidsignature")
            );
        }
        return message_signed;
    }

    /**
     * Given an account and the message text
     * @param account Account that writes the message
     * @param messageText String text of the message
     * @returns {Promise}
     */
    signMessage(account, messageText) {
        return new Promise((resolve, reject) => {
            // make sure wallet is unlocked (we need private key)
            WalletUnlockActions.unlock()
                .then(() => {
                    try {
                        // obtain all necessary keys
                        let memo_from_public = account
                            .get("options")
                            .get("memo_key");
                        // The 1s are base58 for all zeros (null)
                        if (/111111111111111111111/.test(memo_from_public)) {
                            memo_from_public = null;
                        }
                        let memo_from_privkey;
                        if (messageText && memo_from_public) {
                            memo_from_privkey = WalletDb.getPrivateKey(
                                memo_from_public
                            );
                            if (!memo_from_privkey) {
                                throw new Error(
                                    counterpart.translate(
                                        "account.signedmessages.invalidkey"
                                    )
                                );
                            }
                        }
                        // get other meta data
                        let irr_block = ChainStore.getObject("2.1.0").get(
                            "last_irreversible_block_num"
                        );
                        let now = new Date();

                        let meta =
                            MSG_SENDER +
                            "=" +
                            account.get("name") +
                            "\n" +
                            MSG_PUBLICKEY +
                            "=" +
                            memo_from_public +
                            "\n" +
                            MSG_BLOCK +
                            "=" +
                            irr_block +
                            "\n" +
                            MSG_DATE +
                            "=" +
                            now.toUTCString();

                        let messageContentToBeSigned =
                            messageText + "\n" + meta;

                        setTimeout(() => {
                            // do not block gui
                            try {
                                let memo_signature = Signature.signBuffer(
                                    messageContentToBeSigned,
                                    memo_from_privkey,
                                    memo_from_public
                                );
                                let memo_formatted =
                                    MSG_HEAD +
                                    "\n" +
                                    messageText +
                                    "\n" +
                                    MSG_META +
                                    "\n" +
                                    meta +
                                    "\n" +
                                    MSG_SIGNATURE +
                                    "\n" +
                                    memo_signature.toHex() +
                                    "\n" +
                                    MSG_FOOT;
                                resolve(memo_formatted);
                            } catch (err) {
                                reject(err);
                            }
                        }, 0);
                    } catch (err) {
                        reject(err);
                    }
                })
                .catch(res => {
                    reject(res);
                });
        });
    }
}

export default alt.createActions(SignedMessageAction);
