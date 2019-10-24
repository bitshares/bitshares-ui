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
    Collapse
} from "bitshares-ui-style-guide";
import SettingsStore from "stores/SettingsStore";
import {availableGateways, availableBridges} from "common/gateways";
import {getFaucet} from "../../branding";
import SettingsActions from "../../actions/SettingsActions";
import {updateGatewayBackers} from "common/gatewayUtils";

class GatewaySelectorModal extends React.Component {
    constructor(props) {
        super(props);
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

    onClose() {
        if (
            !SettingsStore.getState().viewSettings.get(
                "hasSeenExternalServices",
                false
            )
        ) {
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
                }
            }
        ];
        return columns;
    }

    _getReferrerLink() {
        return !!getFaucet().referrer ? "r=" + getFaucet().referrer : "";
    }

    _getRows() {
        const gateways = Object.values(availableGateways).map(item => {
            return {
                key: item.id,
                type: "gateway",
                name: item.name,
                prefix: item.id,
                landing: !!item.landing ? item.landing : undefined,
                wallet: !!item.wallet
                    ? item.wallet + this._getReferrerLink()
                    : undefined
            };
        });
        const bridges = Object.values(availableBridges).map(item => {
            return {
                key: item.id,
                type: "bridge",
                name: item.name,
                landing: !!item.landing ? item.landing : undefined,
                wallet: !!item.wallet
                    ? item.wallet + this._getReferrerLink()
                    : undefined
            };
        });
        return gateways
            .concat(bridges)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    render() {
        const footer = (
            <div key="buttons" style={{position: "relative", left: "0px"}}>
                <Button key="cancel" onClick={this.onNone.bind(this)}>
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
            // Required in order resetSelected to work
            selectedRowKeys:
                this.props.filteredServiceProviders.length == 1 &&
                this.props.filteredServiceProviders[0] == "all"
                    ? this._getRows().map(item => item.key)
                    : this.props.filteredServiceProviders
        };
        return (
            <Modal
                visible={this.props.visible}
                overlay={true}
                onCancel={this.onClose.bind(this)}
                title={
                    <Translate content="external_service_provider.selector.title" />
                }
                footer={[footer]}
                width={640}
            >
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
                )
            };
        }
    }
);

export default GatewaySelectorModal;
