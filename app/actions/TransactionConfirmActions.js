import alt from "alt-instance";
import {ChainConfig} from "bitsharesjs-ws";
import counterpart from "counterpart";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

class TransactionConfirmActions {
    confirm(transaction, resolve, reject) {
        return {transaction, resolve, reject};
    }

    broadcast(transaction, resolve, reject) {
        return dispatch => {
            dispatch({broadcasting: true, closed: true});

            let broadcast_timeout = setTimeout(() => {
                dispatch({
                    broadcast: false,
                    broadcasting: false,
                    error: counterpart.translate("trx_error.expire"),
                    closed: false
                });
                if (reject) reject();
            }, ChainConfig.expire_in_secs * 2000);

            transaction
                .broadcast(() => {
                    dispatch({broadcasting: false, broadcast: true});
                })
                .then(res => {
                    clearTimeout(broadcast_timeout);
                    dispatch({
                        error: null,
                        broadcasting: false,
                        broadcast: true,
                        included: true,
                        trx_id: res[0].id,
                        trx_block_num: res[0].block_num,
                        broadcasted_transaction: true
                    });
                    if (resolve) resolve();
                })
                .catch(error => {
                    console.error(error);
                    clearTimeout(broadcast_timeout);
                    // messages of length 1 are local exceptions (use the 1st line)
                    // longer messages are remote API exceptions (use the 1st line)
                    let message = "An error occured while broadcasting";
                    let jsonError = {};

                    // try to break down the error in human readable pieces
                    let splitError = error.message.split("\n");
                    let data, code;
                    if (splitError.length == 1) {
                        message = splitError[0];
                    } else if (splitError.length > 1) {
                        try {
                            jsonError = JSON.parse(splitError[1]);
                            data = jsonError.data;
                            code = jsonError.code;
                            message = jsonError.message;
                        } catch (err) {
                            // try to convert to JSON what's possible
                            splitError = splitError.map(text => {
                                try {
                                    let json_part = JSON.stringify(
                                        JSON.parse(
                                            text.substring(
                                                text.indexOf("{"),
                                                text.lastIndexOf("}") + 1
                                            )
                                        ),
                                        null,
                                        4
                                    );
                                    return (
                                        text.substring(0, text.indexOf("{")) +
                                        "\n" +
                                        json_part +
                                        "\n" +
                                        text.substring(
                                            text.lastIndexOf("}") + 1,
                                            text.length
                                        )
                                    );
                                } catch (err) {
                                    // nuthin
                                    return text;
                                }
                            });
                            code = splitError[0];
                            data = splitError
                                .slice(1, splitError.length)
                                .join("\n");
                        }
                    }
                    dispatch({
                        broadcast: false,
                        broadcasting: false,
                        error: message,
                        closed: false,
                        error_code: code,
                        error_data: data
                    });
                    if (reject) reject();
                });
        };
    }

    wasBroadcast(res) {
        return res;
    }

    wasIncluded(res) {
        return res;
    }

    close(reject) {
        reject();
        ZfApi.publish("transaction_confirm_actions", "close");
        return true;
    }

    error(msg) {
        return {error: msg};
    }

    togglePropose() {
        return true;
    }

    proposeFeePayingAccount(fee_paying_account) {
        return fee_paying_account;
    }
}

export default alt.createActions(TransactionConfirmActions);
