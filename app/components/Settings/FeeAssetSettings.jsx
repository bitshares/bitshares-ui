import React from "react";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import {ChainStore} from "bitsharesjs";
import {Button} from "bitshares-ui-style-guide";

import SetDefaultFeeAssetModal from "../Modal/SetDefaultFeeAssetModal";

class FeeAssetSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            current_asset: props.fee_asset
        };
    }

    render() {
        return (
            <div>
                <Button
                    key="open_change_fee_asset"
                    type="primary"
                    onClick={() => {
                        this.setState({showModal: true});
                    }}
                >
                    Change default asset
                </Button>
                <SetDefaultFeeAssetModal
                    key="change_fee_asset_modal"
                    className="modal"
                    show={this.state.showModal}
                    current_asset={this.props.fee_asset}
                    displayFees={false}
                    forceDefault={true}
                    onChange={value => {
                        this.setState({current_asset: value});
                    }}
                    close={() => {
                        this.setState({showModal: false});
                    }}
                />
            </div>
        );
    }
}

export default connect(
    FeeAssetSettings,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps(props) {
            return {
                fee_asset:
                    ChainStore.assets_by_symbol.get(
                        SettingsStore.getState().settings.get("fee_asset")
                    ) || "1.3.0"
            };
        }
    }
);
