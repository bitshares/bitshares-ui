import React from "react";
import {connect} from "alt-react";
import BlockchainStore from "stores/BlockchainStore";
import SettingsStore from "stores/SettingsStore";
import Translate from "react-translate-component";
import WebsocketAddModal from "./Settings/WebsocketAddModal";
import SettingsActions from "actions/SettingsActions";
import {Apis} from "tuscjs-ws";
import {Form, Select, Button, Input} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

const optionalApis = {enableCrypto: true, enableOrders: true};
class InitError extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isModalVisible: false
        };

        this.handleModalClose = this.handleModalClose.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.rpc_connection_status === "open" &&
            nextProps.apiServer !== this.props.apiServer
        ) {
            SettingsActions.showWS(nextProps.apiServer);
        }
    }

    handleModalClose() {
        this.setState({
            isModalVisible: false
        });
    }

    triggerModal(e) {
        this.setState({
            isModalVisible: true
        });
    }

    onChangeWS(value) {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: value
        });
        Apis.reset(value, true, 4000, optionalApis);
    }

    onReloadClick(e) {
        if (e) {
            e.preventDefault();
        }
        if (window.electron) {
            window.location.hash = "";
            window.remote.getCurrentWindow().reload();
        } else window.location.href = __BASE_URL__;
    }

    onReset() {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: this.props.defaultConnection
        });
        SettingsActions.clearSettings();
    }

    render() {
        let uniqueNodes = this.props.apis.reduce((a, node) => {
            // node is the minimum requirement of filled data to connect
            if (!!node && !!node.url) {
                let exists =
                    a.findIndex(n => {
                        return n.url === node.url;
                    }) !== -1;
                if (!exists) a.push(node);
            }
            return a;
        }, []);

        let selectOptions = uniqueNodes.map(entry => {
            let onlyDescription =
                entry.url.indexOf("fake.automatic-selection") !== -1;
            let {location} = entry;
            if (
                !!location &&
                typeof location === "object" &&
                "translate" in location
            )
                location = counterpart.translate(location.translate);

            return (
                <Select.Option key={entry.url} value={entry.url}>
                    {location || entry.url}{" "}
                    {!onlyDescription && location ? `(${entry.url})` : null}
                </Select.Option>
            );
        });

        return (
            <div className="grid-block">
                <div className="grid-container">
                    <div className="grid-content no-overflow">
                        <br />
                        <Translate component="h3" content={`app_init.title`} />

                        <Form layout="vertical">
                            <Form.Item
                                label={counterpart.translate(
                                    "settings.apiServer"
                                )}
                            >
                                <Input.Group compact>
                                    <Select
                                        style={{width: "calc(100% - 175px)"}}
                                        onChange={this.onChangeWS.bind(this)}
                                        value={this.props.apiServer}
                                    >
                                        {selectOptions}
                                    </Select>
                                    <Button
                                        id="add"
                                        style={{width: "175px"}}
                                        onClick={this.triggerModal.bind(this)}
                                        icon={"plus"}
                                    >
                                        {counterpart.translate(
                                            "settings.add_api"
                                        )}
                                    </Button>
                                </Input.Group>
                            </Form.Item>

                            <Form.Item
                                label={counterpart.translate(
                                    "app_init.ws_status"
                                )}
                            >
                                {this.props.rpc_connection_status === "open" ? (
                                    <span className="txtlabel success">
                                        <Translate
                                            content={`app_init.connected`}
                                        />
                                    </span>
                                ) : (
                                    <span className="txtlabel warning">
                                        <Translate
                                            content={`app_init.not_connected`}
                                        />
                                    </span>
                                )}
                            </Form.Item>

                            <Button
                                type={"primary"}
                                onClick={this.onReloadClick}
                            >
                                {counterpart.translate(`app_init.retry`)}
                            </Button>
                            <Button
                                style={{marginLeft: "16px"}}
                                onClick={this.onReset.bind(this)}
                            >
                                {counterpart.translate(`settings.reset`)}
                            </Button>
                        </Form>

                        <WebsocketAddModal
                            ref="ws_modal"
                            isAddNodeModalVisible={this.state.isModalVisible}
                            onAddNodeClose={this.handleModalClose}
                            apis={this.props.apis}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(
    InitError,
    {
        listenTo() {
            return [BlockchainStore, SettingsStore];
        },
        getProps() {
            return {
                rpc_connection_status: BlockchainStore.getState()
                    .rpc_connection_status,
                apis: SettingsStore.getState().defaults.apiServer,
                apiServer: SettingsStore.getState().settings.get("apiServer"),
                defaultConnection: SettingsStore.getState().defaultSettings.get(
                    "apiServer"
                )
            };
        }
    }
);
