import React from "react";
import Translate from "react-translate-component";
import {ChainValidation} from "bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import counterpart from "counterpart";
import FloatingDropdown from "./FloatingDropdown";
import FormattedAsset from "./FormattedAsset";
import Immutable from "immutable";
import classnames from "classnames";
import AssetWrapper from "./AssetWrapper";

class AssetDropdown extends React.Component {
    static propTypes = {
        value: React.PropTypes.string, // asset id
        onChange: React.PropTypes.func
    };

    render() {
        if (this.props.assets.length === 0 || !this.props.value) return null;
        return (
            <FloatingDropdown
                entries={this.props.assets
                    .map(a => a && a.get("symbol"))
                    .filter(a => !!a)}
                values={this.props.assets.reduce((map, a) => {
                    if (a && a.get("symbol")) map[a.get("symbol")] = a;
                    return map;
                }, {})}
                singleEntry={
                    this.props.assets[0] ? (
                        <FormattedAsset
                            asset={this.props.assets[0].get("id")}
                            amount={0}
                            hide_amount={true}
                        />
                    ) : null
                }
                value={""}
                onChange={this.props.onChange}
            />
        );
    }
}

AssetDropdown = AssetWrapper(AssetDropdown, {asList: true});

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AssetSelector extends React.Component {
    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        error: React.PropTypes.string, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onFound: React.PropTypes.func, // a method to be called when existing account is selected
        assetInput: React.PropTypes.string, // the current value of the account selector, the string the user enters
        asset: ChainTypes.ChainAsset, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.string // use it if you need to disable action button
    };

    static defaultProps = {
        disabled: false
    };

    // can be used in parent component: this.refs.asset_selector.getAsset()
    getAsset() {
        return this.props.asset;
    }

    getError(input = this.props.assetInput) {
        let error = this.props.error;
        if (!error && input && !this.getNameType(input))
            error = counterpart.translate("explorer.asset.invalid", {
                name: input
            });
        return error;
    }

    getNameType(value) {
        if (!value) return null;
        // if(value[0] === "#" && utils.is_object_id("1.2." + value.substring(1))) return "id";
        if (!ChainValidation.is_valid_symbol_error(value, true))
            return "symbol";
        return null;
    }

    onInputChanged(event) {
        let value = event.target.value
            .trim()
            .substr(0, 16)
            .toUpperCase(); //.toLowerCase();
        if (this.props.onChange && value !== this.props.assetInput)
            this.props.onChange(value);
    }

    onKeyDown(event) {
        if (event.keyCode === 13) {
            this.onFound(event);
            this.onAction(event);
        }
    }

    componentDidMount() {
        if (this.props.onFound && this.props.asset)
            this.props.onFound(this.props.asset);
    }

    componentWillReceiveProps(newProps) {
        if (this.props.onFound && newProps.asset !== this.props.asset)
            this.props.onFound(newProps.asset);
    }

    onFound(e) {
        e.preventDefault();
        if (
            this.props.onFound &&
            !this.getError() &&
            !this.props.disableActionButton
        ) {
            if (this.props.asset) this.props.onFound(this.props.asset);
        }
    }

    onAssetSelect(selected_asset) {
        if (selected_asset) {
            this.props.onFound(selected_asset);
            this.props.onChange(selected_asset.get("symbol"));
        }
    }

    onAction(e) {
        e.preventDefault();
        if (
            this.props.onAction &&
            !this.getError() &&
            !this.props.disableActionButton
        ) {
            if (this.props.asset) this.props.onAction(this.props.asset);
        }
    }

    render() {
        let {disabled, noLabel} = this.props;
        let error = this.getError();
        let lookup_display;
        if (!disabled) {
            if (this.props.asset) {
                lookup_display = this.props.asset.get("symbol");
            } else if (!error && this.props.assetInput) {
                error = counterpart.translate("explorer.asset.not_found", {
                    name: this.props.assetInput
                });
            }
        }

        let action_class = classnames("button", {
            disabled:
                !this.props.asset || error || this.props.disableActionButton
        });

        return (
            <div className="asset-selector" style={this.props.style}>
                <div>
                    <div className="header-area">
                        {error || noLabel ? null : (
                            <label className="right-label">
                                &nbsp; <span>{lookup_display}</span>
                            </label>
                        )}
                        <Translate
                            component="label"
                            content={this.props.label}
                        />
                    </div>
                    <div className="input-area">
                        <div className="inline-label input-wrapper">
                            <input
                                style={this.props.inputStyle}
                                disabled={this.props.disabled}
                                type="text"
                                value={this.props.assetInput || ""}
                                placeholder={
                                    this.props.placeholder ||
                                    counterpart.translate(
                                        "explorer.assets.symbol"
                                    )
                                }
                                ref="user_input"
                                onChange={this.onInputChanged.bind(this)}
                                onKeyDown={this.onKeyDown.bind(this)}
                                tabIndex={this.props.tabIndex}
                            />
                            <div className="form-label select floating-dropdown">
                                {this.props.asset ? (
                                    <AssetDropdown
                                        ref={this.props.refCallback}
                                        value={this.props.asset.get("symbol")}
                                        assets={Immutable.List(
                                            this.props.assets
                                        )}
                                        onChange={this.onAssetSelect.bind(this)}
                                    />
                                ) : null}
                            </div>
                            {this.props.children}
                            {this.props.onAction ? (
                                <button
                                    className={action_class}
                                    onClick={this.onAction.bind(this)}
                                >
                                    <Translate
                                        content={this.props.action_label}
                                    />
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <div className="error-area" style={{paddingBottom: "10px"}}>
                        <span style={{wordBreak: "break-all"}}>{error}</span>
                    </div>
                </div>
            </div>
        );
    }
}
export default BindToChainState(AssetSelector);
