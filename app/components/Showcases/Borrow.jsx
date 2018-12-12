import React, {Component} from "react";
import counterpart from "counterpart";
import BindToChainState from "components/Utility/BindToChainState";
import Translate from "react-translate-component";
import {Input, Button, Card, Steps, Tooltip} from "bitshares-ui-style-guide";
import debounceRender from "react-debounce-render";
import AssetWrapper from "../Utility/AssetWrapper";
import {connect} from "alt-react";
import {ChainStore} from "bitsharesjs";
import ChainTypes from "components/Utility/ChainTypes";
import AssetSelector from "../Utility/AssetSelector";

import BorrowModal from "../Modal/BorrowModal";
import AccountStore from "../../stores/AccountStore";
import Icon from "../Icon/Icon";

class Borrow extends Component {
    constructor() {
        super();
        this.state = {
            isBorrowBaseModalVisible: false,
            step: 0
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

    next() {
        const step = this.state.step + 1;
        this.setState({step});
    }

    prev() {
        const step = this.state.step - 1;
        this.setState({step});
    }

    render() {
        let currentAccount = ChainStore.getAccount(this.props.currentAccount);
        let accountLoaded = !(
            !currentAccount || typeof currentAccount === "string"
        );

        let steps = [
            {
                key: "introduction",
                icon: "borrow"
            },
            {
                key: "concept"
            },
            {
                key: "setup",
                has_legend: true
            },
            {
                key: "benefits",
                has_legend: true
            },
            {
                key: "risks",
                has_legend: true
            }
        ];
        const current = this.state.step;
        const tinyScreen = window.innerWidth <= 800;

        const started = this.state.step > 0;

        let legend = null;
        try {
            if (steps[current].has_legend) {
                legend = counterpart.translate(
                    "showcases.borrow.steps_" +
                        steps[current].key +
                        ".text_legend"
                );
                legend = legend.split("\n").map(item => {
                    return item.split(":");
                });
            }
        } catch (err) {
            legend = counterpart.translate(
                "showcases.borrow.steps_" + steps[current].key + ".text_legend"
            );
        }

        return (
            <div
                style={{
                    align: "center",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "2rem"
                }}
            >
                <Card
                    style={{
                        borderRadius: "50px",
                        width: "70%",
                        maxWidth: "70rem",
                        paddingTop: "2rem"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center"
                        }}
                    >
                        <Translate
                            component="h1"
                            content={"showcases.borrow.title_long"}
                        />
                    </div>
                    {started &&
                        (!tinyScreen ? (
                            <Steps progressDot current={current - 1}>
                                {steps.map((item, index) => {
                                    if (index == 0) return null;
                                    return (
                                        <Steps.Step
                                            key={item.key}
                                            title={counterpart.translate(
                                                "showcases.borrow.steps_" +
                                                    item.key +
                                                    ".title"
                                            )}
                                        />
                                    );
                                })}
                            </Steps>
                        ) : (
                            <React.Fragment>
                                {current + ". "}
                                <Translate
                                    content={
                                        "showcases.borrow.steps_" +
                                        steps[current].key +
                                        ".title"
                                    }
                                />
                            </React.Fragment>
                        ))}
                    <div
                        style={{
                            paddingTop: "1rem",
                            paddingBottom: "1rem"
                        }}
                    >
                        <Card>
                            {!!steps[current].icon && (
                                <Icon name="steps[current].icon" />
                            )}
                            <Translate
                                component="h2"
                                content={
                                    "showcases.borrow.steps_" +
                                    steps[current].key +
                                    ".title_within"
                                }
                            />

                            <Translate
                                component="p"
                                content={
                                    "showcases.borrow.steps_" +
                                    steps[current].key +
                                    ".text"
                                }
                            />

                            {!!steps[current].has_legend && (
                                <React.Fragment>
                                    {legend.map((content, index) => {
                                        return (
                                            <p key={"borrow_subp_" + index}>
                                                <strong>{content[0]}</strong>:{" "}
                                                {content[1]}
                                            </p>
                                        );
                                    })}
                                </React.Fragment>
                            )}
                        </Card>
                    </div>
                    <div className="steps-action">
                        {current == 0 && (
                            <Button type="primary" onClick={() => this.next()}>
                                Get started
                            </Button>
                        )}
                        {current > 0 &&
                            current < steps.length - 1 && (
                                <Button
                                    type="primary"
                                    onClick={() => this.next()}
                                >
                                    Next
                                </Button>
                            )}
                        {current > 0 &&
                            current === steps.length - 1 && (
                                <React.Fragment>
                                    <Tooltip
                                        title={
                                            accountLoaded
                                                ? ""
                                                : "Login required"
                                        }
                                    >
                                        <Button
                                            type="primary"
                                            disabled={
                                                accountLoaded
                                                    ? currentAccount.get(
                                                          "id"
                                                      ) === "1.2.3"
                                                    : true
                                            }
                                            onClick={this.showBorrowModal}
                                        >
                                            <Translate content="exchange.borrow" />
                                        </Button>
                                    </Tooltip>
                                </React.Fragment>
                            )}
                        {current > 0 && (
                            <Button
                                style={{marginLeft: 8}}
                                onClick={() => this.prev()}
                            >
                                Previous
                            </Button>
                        )}
                    </div>
                </Card>
                {accountLoaded &&
                    !!this.state.assetToBorrow && (
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
