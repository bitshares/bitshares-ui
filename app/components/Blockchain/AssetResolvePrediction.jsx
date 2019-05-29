import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import {Radio} from "bitshares-ui-style-guide";

class AssetResolvePrediction extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();

        this.state = {
            price: 1
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            np.asset.id !== this.props.asset.id || ns.price !== this.state.price
        );
    }

    onSubmit() {
        const {asset, account} = this.props;

        AssetActions.resolvePrediction(
            asset,
            account.get("id"),
            this.state.price
        ).then(() => {
            this.onReset();
        });
    }

    onReset() {
        this.setState({
            price: 1
        });
    }

    onChange(e) {
        this.setState({
            price: e.target.value
        });
    }

    render() {
        const {current_feed_publication_time} = this.props.asset.bitasset;
        const disabled =
            new Date().getTime() <
            new Date(current_feed_publication_time).getTime();

        return (
            <div>
                <div style={{paddingBottom: "1rem"}}>
                    <Radio.Group
                        onChange={this.onChange.bind(this)}
                        value={this.state.price}
                    >
                        <Radio value={1}>
                            <Translate content="settings.yes" />
                        </Radio>
                        <Radio value={0}>
                            <Translate content="settings.no" />
                        </Radio>
                    </Radio.Group>
                </div>
                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled
                        })}
                        onClick={this.onSubmit.bind(this)}
                    >
                        <Translate content="account.perm.publish_prediction" />
                    </button>
                    <button
                        className="button outline"
                        onClick={this.onReset.bind(this)}
                    >
                        <Translate content="account.perm.reset" />
                    </button>
                </div>
            </div>
        );
    }
}

AssetResolvePrediction = BindToChainState(AssetResolvePrediction);
export default AssetResolvePrediction;
