import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";

class CryptoBridgeDepositAccept extends React.Component {
    static propTypes = {
        asset: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            asset: props.asset,
            name: props.name,
            requiresAcknowledgement: this.getRequiresAcknowledgement(
                props.asset
            ),
            acknowledged: false
        };
    }

    componentWillReceiveProps(np) {
        if (np.asset !== this.props.asset) {
            this.setState({
                asset: np.asset,
                name: np.name,
                requiresAcknowledgement: this.getRequiresAcknowledgement(
                    np.asset
                ),
                acknowledged: false
            });
        } else if (np.children !== this.props.children) {
            this.setState({});
        }
    }

    getRequiresAcknowledgement(asset) {
        return ["XRP"].indexOf(asset.toUpperCase()) !== -1;
    }

    onAcknowledge() {
        this.setState({
            acknowledged: true
        });
    }

    render() {
        const {asset, name, acknowledged, requiresAcknowledgement} = this.state;

        return (
            <div style={{display: "inline-block"}}>
                {!requiresAcknowledgement || acknowledged ? (
                    this.props.children
                ) : (
                    <div>
                        <Translate
                            className="label alert"
                            content="cryptobridge.gateway.deposit_tag_acknowledgement_alert"
                            asset={`${asset} (${name})`}
                            style={{whiteSpace: "normal", lineHeight: 1.4}}
                        />
                        <br />
                        <br />
                        <Translate
                            tag="label"
                            content="cryptobridge.gateway.deposit_tag_acknowledgement_info"
                            asset={`${asset} (${name})`}
                            unsafe
                        />
                        <button
                            className="button"
                            onClick={this.onAcknowledge.bind(this)}
                        >
                            <Translate content="cryptobridge.gateway.deposit_tag_acknowledgement_confirm" />
                        </button>
                    </div>
                )}
            </div>
        );
    }
}

export default CryptoBridgeDepositAccept;
