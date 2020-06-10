import React from "react";

import counterpart from "counterpart";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import {
    Table,
    Button,
    Radio,
    Modal,
    Checkbox,
    Collapse,
    Tooltip,
    Icon
} from "bitshares-ui-style-guide";
import SettingsStore from "stores/SettingsStore";
import {availableGateways, availableBridges} from "common/gateways";
import {getFaucet, allowedGateway} from "../../branding";
import SettingsActions from "../../actions/SettingsActions";
import {updateGatewayBackers} from "common/gatewayUtils";
import ServiceProviderExplanation from "./ServiceProviderExplanation";
import {getGatewayConfig} from "../../lib/chain/onChainConfig";

class GatewaySelectorModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showIntroduction: true,
            onChainConfig: {}
        };
    }

    onSubmit() {
        this.onClose();
    }

    onNone() {
        SettingsActions.changeSetting({
            setting: "filteredServiceProviders",
            value: []
        });
        this.onClose();
    }

    next() {
        this.setState({showIntroduction: false});
    }

    onClose() {
        if (!this.props.hasSeenExternalServices) {
            SettingsActions.changeViewSetting({
                hasSeenExternalServices: true
            });
        }
        updateGatewayBackers();
        this.props.hideModal();
    }

    _getRowHeaders() {
        const columns = [
            {
                key: "name",
                title: counterpart.translate(
                    "external_service_provider.selector.name"
                ),
                render: row => {
                    if (!!this.state.onChainConfig[row.key]) {
                        return (
                            <Tooltip
                                title={
                                    "This gateway has been deactivated or is not functioning correctly. " +
                                    (this.state.onChainConfig[row.key]
                                        .comment ||
                                        "This can be due to several reasons.")
                                }
                            >
                                <span style={{whiteSpace: "nowrap"}}>
                                    {row.name}
                                    <Icon
                                        style={{
                                            marginLeft: "0.5rem"
                                        }}
                                        type="warning"
                                    />
                                </span>
                            </Tooltip>
                        );
                    }
                    return row.name;
                }
            },
            {
                key: "type",
                title: counterpart.translate(
                    "external_service_provider.selector.type"
                ),
                align: "left",
                render: row => {
                    if (row.type == "bridge") {
                        return counterpart.translate(
                            "external_service_provider.bridge.short"
                        );
                    } else {
                        return (
                            <div>
                                <span>
                                    {counterpart.translate(
                                        "external_service_provider.gateway.short"
                                    )}
                                </span>
                                <br />
                                <span>
                                    {counterpart.translate(
                                        "external_service_provider.gateway.prefix"
                                    )}
                                    {": " + row.prefix}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div>
                            <span>
                                {counterpart.translate(
                                    "external_service_provider." +
                                        row.type +
                                        ".short"
                                )}
                            </span>
                            <br />
                            <span>{row.prefix}</span>
                        </div>
                    );
                }
            },
            {
                key: "landing",
                title: counterpart.translate(
                    "external_service_provider.selector.landing"
                ),
                align: "left",
                render: row => {
                    if (!row.landing) return "-";
                    if (row.landing.startsWith("http")) {
                        return (
                            <a
                                target="_blank"
                                className="external-link"
                                rel="noopener noreferrer"
                                href={row.landing}
                            >
                                External Link
                            </a>
                        );
                    } else {
                        return <span>{row.landing}</span>;
                    }
                }
            },
            {
                key: "wallet",
                title: counterpart.translate(
                    "external_service_provider.selector.wallet"
                ),
                align: "left",
                render: row => {
                    if (!row.wallet) return "-";
                    if (row.wallet.startsWith("http")) {
                        return (
                            <a
                                target="_blank"
                                className="external-link"
                                rel="noopener noreferrer"
                                href={row.wallet}
                            >
                                External Link
                            </a>
                        );
                    } else {
                        return <span>{row.wallet}</span>;
                    }
                }
            }
        ];
        return columns;
    }

    _getReferrerLink() {
        return !!getFaucet().referrer ? "?r=" + getFaucet().referrer : "";
    }

    async _checkOnChainConfig() {
        const all = this._getRows();
        let onChainConfig = {};
        for (let i = 0; i < all.length; i++) {
            if (!(await all[i].isEnabled({onlyOnChainConfig: true})))
                onChainConfig[all[i].key] = await getGatewayConfig(all[i].key);
        }
        this.setState({onChainConfig});
    }

    _getEnabledRowKeys() {
        return this._getRows().map(
            item => (this.state.onChainConfig[item.key] ? undefined : item.key)
        );
    }

    _getRows() {
        const gateways = Object.values(availableGateways).map(item => {
            return {
                key: item.id,
                type: "gateway",
                name: item.name,
                prefix: item.id,
                landing: !!item.landing ? item.landing : undefined,
                wallet:
                    !!item.wallet && item.wallet.startsWith("http")
                        ? item.wallet + this._getReferrerLink()
                        : item.wallet,
                isEnabled: item.isEnabled
            };
        });
        const bridges = Object.values(availableBridges).map(item => {
            return {
                key: item.id,
                type: "bridge",
                name: item.name,
                landing: !!item.landing ? item.landing : undefined,
                wallet:
                    !!item.wallet && item.wallet.startsWith("http")
                        ? item.wallet + this._getReferrerLink()
                        : item.wallet,
                isEnabled: item.isEnabled
            };
        });
        return gateways
            .concat(bridges)
            .filter(item => {
                return allowedGateway(item.key);
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    componentDidMount() {
        this._checkOnChainConfig();
    }

    render() {
        const footer = !this.state.showIntroduction ? (
            <div key="buttons" style={{position: "relative", left: "0px"}}>
                <Tooltip
                    title={counterpart.translate(
                        "external_service_provider.welcome.explanation_later"
                    )}
                >
                    <Button key="cancel" onClick={this.onClose.bind(this)}>
                        <Translate
                            component="span"
                            content="external_service_provider.selector.cancel"
                        />
                    </Button>
                </Tooltip>
                <Button
                    key="none"
                    onClick={this.onNone.bind(this)}
                    type="primary"
                >
                    <Translate
                        component="span"
                        content="external_service_provider.selector.use_none"
                    />
                </Button>
                <Button
                    key="submit"
                    type="primary"
                    onClick={this.onSubmit.bind(this)}
                >
                    <Translate
                        component="span"
                        content="external_service_provider.selector.use_selected"
                    />
                </Button>
            </div>
        ) : (
            <div key="buttons" style={{position: "relative", left: "0px"}}>
                <Button key="cancel" onClick={this.onClose.bind(this)}>
                    <Translate
                        component="span"
                        content="external_service_provider.selector.not_now"
                    />
                </Button>
                <Button
                    key="submit"
                    type="primary"
                    onClick={this.next.bind(this)}
                >
                    <Translate
                        component="span"
                        content="external_service_provider.selector.choose_services"
                    />
                </Button>
            </div>
        );
        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                if (selectedRowKeys.length == this._getRows().length) {
                    SettingsActions.changeSetting({
                        setting: "filteredServiceProviders",
                        value: ["all"]
                    });
                } else {
                    SettingsActions.changeSetting({
                        setting: "filteredServiceProviders",
                        value: selectedRowKeys
                    });
                }
            },
            getCheckboxProps: record => {
                return {
                    disabled:
                        !!this.state.onChainConfig[record.key] &&
                        !this.state.onChainConfig[record.key].enabled,
                    key: record.key
                };
            },
            // Required in order resetSelected to work
            selectedRowKeys:
                this.props.filteredServiceProviders.length == 1 &&
                this.props.filteredServiceProviders[0] == "all"
                    ? this._getEnabledRowKeys()
                    : this.props.filteredServiceProviders
        };
        return (
            <Modal
                visible={this.props.visible}
                overlay={true}
                title={
                    <Translate content="external_service_provider.selector.title" />
                }
                closable={false}
                footer={[footer]}
                width={640}
            >
                {this.state.showIntroduction ? (
                    <ServiceProviderExplanation
                        showSalutation={!this.props.hasSeenExternalServices}
                    />
                ) : (
                    <React.Fragment>
                        <Collapse>
                            <Collapse.Panel
                                header="What is a Gateway?"
                                showArrow={false}
                            >
                                <Translate
                                    component="p"
                                    content="external_service_provider.gateway.description"
                                />
                            </Collapse.Panel>
                        </Collapse>
                        <Collapse style={{marginTop: "1rem"}}>
                            <Collapse.Panel
                                header="What is a Bridge?"
                                showArrow={false}
                            >
                                <Translate
                                    component="p"
                                    content="external_service_provider.bridge.description"
                                />
                            </Collapse.Panel>
                        </Collapse>
                        <div style={{marginTop: "1rem"}}>
                            <Translate content="external_service_provider.selector.table_description" />
                        </div>
                        <Table
                            style={{marginTop: "1rem"}}
                            columns={this._getRowHeaders()}
                            pagination={{
                                hideOnSinglePage: true,
                                pageSize: 20
                            }}
                            dataSource={this._getRows()}
                            footer={null}
                            rowSelection={rowSelection}
                        />
                    </React.Fragment>
                )}
            </Modal>
        );
    }
}

GatewaySelectorModal = connect(
    GatewaySelectorModal,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                filteredServiceProviders: SettingsStore.getState().settings.get(
                    "filteredServiceProviders",
                    []
                ),
                hasSeenExternalServices: SettingsStore.getState().viewSettings.get(
                    "hasSeenExternalServices",
                    false
                )
            };
        }
    }
);

export default GatewaySelectorModal;
