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
                <p>
                    To participate in the BEOS reward program, you must deposit
                    BTS via this gateway to your BEOS network account. If you
                    don’t already have a BEOS account, you can create one via
                    this gateway by paying a fee of 100 BTS. The gateway will
                    read the public keys of the BitShares account you send the
                    BTS from, and automatically assign the same keys to your
                    newly created BEOS account. This means you can use the same
                    private keys to control both your BitShares account and your
                    BEOS account. If you don’t want to use the same keys, you
                    can first create a new BitShares account and send the BTS
                    from that account to start with a new set of keys. oYu can
                    also change your keys at any time on either blockchain.
                </p>
                <p>
                    When you deposit BTS via the gateway, your BEOS account will
                    be credited with an equivalent amount of a BTS IOU token
                    (minus 100 BTS if you are simultaneously creating your BEOS
                    account).
                </p>
                <p>
                    During the 89 days of the BEOS reward distribution period,
                    starting on November 12th 2018 (one week after the launch
                    date for the BEOS network), a fixed amount of BEOS will be
                    awarded hourly to BEOS accounts holding BTS IOU tokens,
                    based on their proportionate holding. For example, if there
                    are only 2 BEOS accounts at the end of an hourly reward
                    period, one holding 90 tokens and the other holding 10
                    tokens, the 90 holder will receive 90% of the BEOS awarded
                    for that reward period and the 10 holder will receive the
                    remaining 10%. NEED TO ADD TOTAL AMOUNT TO BE DISTRIBUTED
                    OVER 89 DAYS.
                </p>
                <p>
                    In a similar manner, RAM will also be awarded to BTS IOU
                    holders, but over a longer period of time: PUT DETAILS OF
                    DISTRIBUTION HERE.
                </p>
                <p>
                    IMPORTANT NOTE: Until you make a withdrawal, the “actual
                    BTS” deposited to the gateway will be held in a gateway
                    account called “beos” on the BitShares network. This
                    multi-sig account is managed by the BEOS trustees, and by
                    making deposits to this gateway, you are explicitly granting
                    the trustees the right to vote the BTS you deposit in ways
                    that support the health and growth of the BEOS network. You
                    have the option of withdrawing your BTS IOU tokens via the
                    gateway at any time (*) back to the BTS network, if you
                    disagree with the way they are voting or if you just need
                    your BTS back for some other purpose.
                </p>
                <p>
                    * The trustees will do their best to keep the gateway
                    operational at all times, but a malfunction either on the
                    gateway or the new BEOS chain itself could result in BTS
                    funds being locked up temporarily until the problem is
                    resolved.
                </p>
                <button
                    style={{marginRight: 10, marginBottom: 30}}
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
                            issuer="tanda-radei"
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
