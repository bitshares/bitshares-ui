import React from "react";
import BitsharesBeosModal from "./BitsharesBeosModal";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import BindToChainState from "components/Utility/BindToChainState";
import QueryString from "query-string";
import {Modal} from "bitshares-ui-style-guide";
import {beosAPIs} from "api/apiConfig";
import {ChainStore} from "bitsharesjs";

class BitsharesBeos extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            asset: ChainStore.getAsset("BTS"), // default asset
            assets: [],
            coinsList: [],
            isModalVisible: false
        };

        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    async getAvailableCoins() {
        try {
            const coinsResponse = await fetch(
                beosAPIs.BASE + beosAPIs.COINS_LIST
            );
            const tradingPairsResponse = await fetch(
                beosAPIs.BASE + beosAPIs.TRADING_PAIRS
            );

            const coins = await coinsResponse.json();
            const tradingPairs = await tradingPairsResponse.json();

            const mappedCoins = coins
                .filter(({walletType}) => walletType === "bitshares2")
                .map(({coinType, symbol}) => {
                    return tradingPairs.filter(({inputCoinType}) => {
                        return inputCoinType === coinType;
                    })[0];
                });

            return mappedCoins;
        } catch (error) {
            throw error;
        }
    }

    getAssets(coinsList) {
        return coinsList
            .map(({inputCoinType}) =>
                ChainStore.getAsset(inputCoinType.toUpperCase())
            )
            .filter(a => !!a);
    }

    componentDidMount() {
        this.getAvailableCoins()
            .then(coinsList => {
                this.setState({assets: this.getAssets(coinsList), coinsList});
            })
            .catch(err => {
                throw err;
            });
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    getTransferBtsId() {
        return "transfer_bts";
    }

    onTransferBts() {
        this.showModal();
    }

    getParams() {
        const {params} = this.props;
        return {
            beosFee: "500",
            beosApiUrl: beosAPIs.BASE,
            beosIssuer: "beos.gateway",
            ...QueryString.parse(params.search)
        };
    }

    getBalances = () => {
        const {account} = this.props;
        const {assets} = this.state;
        return assets.filter(a => !!a).map(a => {
            return account.get("balances").toJS()[a.get("id")];
        });
    };

    getBalanceById = id => {
        return this.getBalances()[id] || null;
    };

    render() {
        let transferBtsId = this.getTransferBtsId();
        const {beosFee, beosIssuer, beosApiUrl} = this.getParams();
        const {asset, assets, coinsList} = this.state;

        return (
            <div>
                <p>
                    To qualify for the initial BEOS token distribution, a member
                    must join BEOS LCA (BLCA is Utah Limited Cooperative
                    Association, operating on a non-profit basis for the benefit
                    of its members), create an account on the BEOS network (the
                    “BEOS Account”) and fund that BEOS account with any amount
                    of BTS via the BEOS network gateway.
                </p>
                <p>
                    Any member may create one or more BEOS accounts for a
                    one-time fee of {beosFee} BTS each. The BEOS network gateway
                    will read the public keys of the Bitshares account from
                    which the account creation fee is paid and automatically
                    assign the same keys to the Member’s newly created BEOS
                    account, so that the member can use the same private keys to
                    control both accounts. Thereafter the member may change
                    their keys at any time on either account.
                </p>
                <p>
                    When a member deposits BTS via the BEOS network gateway, the
                    member’s BEOS account is credited with an equivalent amount
                    of a BTS IOU token. BLCA will retain 2/7 of the
                    3,674,470,000 authorized BEOS tokens in order to promote
                    Association purposes. The remainder will be distributed to
                    Members.
                </p>
                <p>
                    BEOS tokens will be distributed to account holders on an
                    hourly basis over a period of 89 days and 64GB of RAM will
                    be distributed over an 80-week. Both periods begin on April
                    9, 2019.
                </p>
                <p>
                    During the applicable distribution periods, BEOS and RAM
                    tokens will be apportioned between member account holders
                    based upon their proportionate holdings of BTS IOU tokens.
                    For example, if there are only 2 BEOS accounts at the end of
                    an hourly reward period, one holding 90 tokens and the other
                    holding 10 tokens, the 90 holder will receive 90% of the
                    BEOS awarded for that reward period and the 10 holder will
                    receive the remaining 10%.
                </p>
                <p>
                    BEOS tokens are backed by BLCA Quint holdings, such that 1
                    million BEOS tokens equals 1 Quint. For more information,
                    see{" "}
                    <a href="http://www.quintric.com" target="_blank">
                        www.quintric.com
                    </a>
                    .
                </p>
                <p>
                    IMPORTANT NOTE : Until a withdrawal is made, the “actual
                    BTS” deposited to the BEOS network gateway will be held in
                    an account called “beos.gateway” on the Bitshares network.
                    This account is managed by the Board, and by making deposits
                    to this account, a Member explicitly grants the Board the
                    right to vote the BTS so deposited in ways that support the
                    health and growth of the BEOS network.
                </p>
                <p>
                    Members have the option of withdrawing their BTS IOU tokens
                    via the BEOS network gateway at any time (*) back to their
                    own control.
                </p>
                <p>
                    * The BLCA directors will do their best to keep the gateway
                    operational at all times, but a malfunction either on the
                    gateway or the new BEOS chain itself could result in BTS
                    funds being locked up temporarily until the problem is
                    resolved. If you lose the keys to your BEOS account, the
                    directors cannot refund BTS locked up as BTS IOU tokens in
                    your BEOS account, because the directors cannot reclaim the
                    IOU tokens and have no way to determine if the account is
                    permanently lost.
                </p>
                <p>
                    Please read the full BLCA member agreement located at{" "}
                    <a
                        href="http://www.beos.world/membership_agreement.html"
                        target="_blank"
                    >
                        http://www.beos.world/membership_agreement.html
                    </a>{" "}
                    before proceeding.
                </p>
                <p className="backingWarning">
                    By clicking on the button below and purchasing a BEOS
                    account, you are agreeing to the terms of the BEOS LCA
                    membership agreement.
                </p>
                <button
                    style={{marginRight: 10, marginBottom: 30}}
                    className="button"
                    onClick={this.onTransferBts.bind(this)}
                    type="submit"
                >
                    <Translate content="gateway.bitshares_beos.transfer_button_label" />
                </button>
                <p>
                    After you create your account, you can access it via the
                    BEOS wallets here:{" "}
                    <a href="https://get.beos.world/wallets/" target="_blank">
                        https://get.beos.world/wallets/
                    </a>
                    .
                </p>
                <Modal
                    onCancel={this.hideModal}
                    title={counterpart.translate(
                        "gateway.bitshares_beos.modal_title"
                    )}
                    footer={null}
                    visible={this.state.isModalVisible}
                    id={transferBtsId}
                    overlay={true}
                >
                    <BitsharesBeosModal
                        key={"transfer_bts"}
                        hideModal={this.hideModal}
                        showModal={this.showModal}
                        account={this.props.account.get("name")}
                        asset={asset.get("symbol")}
                        assets={assets.map(a => a.get("symbol"))}
                        balance={this.getBalanceById(asset.get("id"))}
                        balances={this.getBalances()}
                        creator={"eosio"}
                        issuer={beosIssuer}
                        beosApiUrl={beosApiUrl}
                        beosFee={beosFee}
                        owner_key={
                            "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV"
                        }
                        ram={"0.0006 SYS"}
                        account_contract={"beos.token"}
                        action={"lock"}
                        from={"beos.token"}
                        coinsList={coinsList}
                    />
                </Modal>
            </div>
        );
    }
}

export default BindToChainState(BitsharesBeos);