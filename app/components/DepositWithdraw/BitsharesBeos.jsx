import React from "react";
import BaseModal from "../Modal/BaseModal";
import BitsharesBeosModal from "./BitsharesBeosModal";
import ChainTypes from "components/Utility/ChainTypes";
import Translate from "react-translate-component";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BindToChainState from "components/Utility/BindToChainState";

class BitsharesBeos extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired
    };

    getTransferBtsId() {
        return "transfer_bts";
    }

    onTransferBts() {
        ZfApi.publish(this.getTransferBtsId(), "open");
    }

    render() {
        let transferBtsId = this.getTransferBtsId();

        return (
            <div>
                <button
                    style={{marginRight: 10}}
                    className="button"
                    onClick={this.onTransferBts.bind(this)}
                    type="submit"
                >
                    <Translate content="gateway.bitshares_beos.transfer_button_label" />
                </button>
                <BaseModal id={transferBtsId} overlay={true}>
                    <br />
                    <div className="grid-block vertical">
                        <BitsharesBeosModal
                            key={"transfer_bts"}
                            account={this.props.account.get("name")}
                            asset={this.props.asset.get("symbol")}
                            balance={
                                this.props.account.get("balances").toJS()[
                                    this.props.asset.get("id")
                                ]
                            }
                            creator={"eosio"}
                            issuer="blocktrades"
                            owner_key={
                                "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
                            }
                            ram={"0.0006 SYS"}
                            account_contract={"beos.token"}
                            action={"lock"}
                            from={"beos.token"}
                            modal_id={transferBtsId}
                        />
                    </div>
                </BaseModal>
            </div>
        );
    }
}

export default BindToChainState(BitsharesBeos);
