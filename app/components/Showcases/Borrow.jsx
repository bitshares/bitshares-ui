import React, {Component} from "react";
import BindToChainState from "components/Utility/BindToChainState";
import Translate from "react-translate-component";
import {Input, Button, Card} from "bitshares-ui-style-guide";
import debounceRender from "react-debounce-render";
import AssetWrapper from "../Utility/AssetWrapper";
import {connect} from "alt-react";
import {ChainStore} from "bitsharesjs";
import ChainTypes from "components/Utility/ChainTypes";

import BorrowModal from "../Modal/BorrowModal";
import AccountStore from "../../stores/AccountStore";

class Borrow extends Component {
    constructor() {
        super();
        this.state = {
            isBorrowBaseModalVisible: false
        };
        this.showBorrowModal = this.showBorrowModal.bind(this);
        this.hideBorrowModal = this.hideBorrowModal.bind(this);
    }
    componentWillMount() {}
    componentWillReceiveProps(np) {}
    getAccount() {}

    showBorrowModal(asset) {
        this.setState({
            assetToBorrow: this.props.bitAssets[0],
            isBorrowBaseModalVisible: true
        });
    }

    hideBorrowModal() {
        this.setState({
            assetToBorrow: null,
            isBorrowBaseModalVisible: false
        });
    }

    render() {
        let currentAccount = ChainStore.getAccount(this.props.currentAccount);
        if (!currentAccount || typeof currentAccount === "string") return null;

        return (
            <div className="container no-overflow wrap shrink center">
                <Card
                    style={{
                        borderRadius: "50px",
                        width: "50%",
                        maxWidth: "50rem"
                    }}
                >
                    <Translate content={"showcases.borrow.title"} />
                    <br />
                    <Translate content={"showcases.borrow.1_concept"} />
                    <br />
                    <Translate content={"showcases.borrow.2_benefits"} />
                    <br />
                    <Translate content={"showcases.borrow.3_setup"} />
                    <br />
                    <Translate content={"showcases.borrow.4_risks"} />
                    <br />
                    <Translate content={"showcases.borrow.5_cost"} />
                    <Button
                        style={{
                            margin: 5,
                            float: "right"
                        }}
                        disabled={currentAccount.get("id") === "1.2.3"}
                        onClick={this.showBorrowModal}
                    >
                        <Translate content="exchange.borrow" />
                    </Button>
                </Card>
                {!!this.state.assetToBorrow && (
                    <BorrowModal
                        visible={this.state.isBorrowBaseModalVisible}
                        hideModal={this.hideBorrowModal}
                        quote_asset={this.state.assetToBorrow.get("id")}
                        backing_asset={this.state.assetToBorrow.getIn([
                            "bitasset",
                            "options",
                            "short_backing_asset"
                        ])}
                        account={currentAccount}
                    />
                )}
            </div>
        );
    }
}

Borrow = debounceRender(Borrow, 50, {leading: false});

Borrow = connect(
    Borrow,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount:
                    AccountStore.getState().currentAccount ||
                    AccountStore.getState().passwordAccount
            };
        }
    }
);

export default (Borrow = AssetWrapper(Borrow, {
    propNames: ["bitAssets"],
    defaultProps: {
        bitAssets: [
            "1.3.103",
            "1.3.113",
            "1.3.120",
            "1.3.121",
            "1.3.958",
            "1.3.1325",
            "1.3.1362",
            "1.3.105",
            "1.3.106"
        ]
    },
    asList: true
}));
