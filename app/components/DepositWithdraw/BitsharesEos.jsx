import React from "react";
import BaseModal from "../Modal/BaseModal";
import BitsharesEosModal from "./BitsharesEosModal";
import Translate from "react-translate-component";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

class BitsharesEos extends React.Component {
    getCreateAccountId() {
        return "create_acoount";
    }

    getSendBtsId() {
        return "send_bts";
    }

    onCreateAccount() {
        ZfApi.publish(this.getCreateAccountId(), "open");
    }

    sendBts() {
        ZfApi.publish(this.getSendBtsId(), "open");
    }

    render() {
        let createAccountId = this.getCreateAccountId();
        let sendBtsId = this.getSendBtsId();

        return (
            <div>
                <button
                    style={{marginRight: 10}}
                    className="button"
                    onClick={this.onCreateAccount.bind(this)}
                    type="submit"
                >
                    <Translate content="gateway.bitshares_beos.create_account" />
                </button>
                <button
                    className="button"
                    onClick={this.sendBts.bind(this)}
                    type="submit"
                >
                    <Translate content="gateway.bitshares_beos.transfer" />
                </button>
                <BaseModal id={createAccountId} overlay={true}>
                    <br />
                    <div className="grid-block vertical">
                        <BitsharesEosModal
                            key={"create_account"}
                            operation={"Create account"}
                            asset={"BTS"}
                            name={"Create BEOS account"}
                            creator={"eosio"}
                            owner_key={
                                "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
                            }
                            ram={"0.0006 SYS"}
                            account_contract={"beos.token"}
                            action={"lock"}
                            from={"beos.token"}
                            modal_id={createAccountId}
                            create_account={1}
                        />
                    </div>
                </BaseModal>
                <BaseModal id={sendBtsId} overlay={true}>
                    <br />
                    <div className="grid-block vertical">
                        <BitsharesEosModal
                            key={"send_bts"}
                            operation={"Send"}
                            asset={"BTS"}
                            name={"Send BTS"}
                            creator={"eosio"}
                            owner_key={
                                "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
                            }
                            ram={"0.0006 SYS"}
                            account_contract={"beos.token"}
                            action={"lock"}
                            from={"beos.token"}
                            modal_id={sendBtsId}
                            create_account={0}
                        />
                    </div>
                </BaseModal>
            </div>
        );
    }
}

export default BitsharesEos;
