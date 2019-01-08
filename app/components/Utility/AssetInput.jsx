import React, {Fragment, PureComponent} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import {Form, Input, Button} from "bitshares-ui-style-guide";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Translate from "react-translate-component";
import {Map} from "immutable";

const AssetInputView = ({
    label,
    hasAction,
    onChange,
    placeholder,
    style,
    inputStyle,
    value,
    validateStatus,
    onAction,
    actionLabel,
    disableActionButton,
    help
}) => (
    <Fragment>
        <Form.Item
            colon={false}
            label={<Translate content={label} />}
            style={style}
            className={"asset-input" + (hasAction ? " with-action" : "")}
            validateStatus={validateStatus}
            hasFeedback
            help={help}
        >
            <Input
                value={value}
                onChange={onChange}
                style={inputStyle}
                placeholder={placeholder}
            />
        </Form.Item>
        {hasAction && (
            <Form.Item>
                <Button
                    type="primary"
                    disabled={disableActionButton}
                    onClick={onAction}
                >
                    <Translate content={actionLabel} />
                </Button>
            </Form.Item>
        )}
    </Fragment>
);

class ControlledAssetInput extends PureComponent {
    static propTypes = {
        asset: ChainTypes.ChainAsset // the selected asset
    };

    checkFound = prevAsset => {
        const {onFound, asset, resolved} = this.props;
        if (
            resolved &&
            asset !== undefined &&
            typeof onFound === "function" &&
            (Map.isMap(prevAsset) && Map.isMap(asset)
                ? prevAsset.get("id") !== asset.get("id")
                : prevAsset != asset)
        ) {
            onFound(Map.isMap(asset) ? asset : null);
        }
    };

    componentDidMount() {
        this.checkFound();
    }

    componentDidUpdate(prevProps) {
        this.checkFound(prevProps.asset);
    }

    handleChange = event => {
        const {onChange} = this.props;
        if (typeof onChange === "function")
            onChange(event.target.value.toUpperCase());
    };

    getValidateStatus = () => {
        const {validateStatus, asset, resolved, value} = this.props;
        return typeof validateStatus === "string"
            ? validateStatus
            : resolved
                ? Map.isMap(asset)
                    ? "success"
                    : value
                        ? "error"
                        : undefined
                : "validating";
    };

    handleAction = () => {
        const {asset, onAction} = this.props;
        onAction(asset);
    };

    render() {
        const {
            label,
            placeholder,
            inputStyle,
            style,
            value,
            actionLabel,
            help,
            onAction
        } = this.props;
        const validateStatus = this.getValidateStatus();
        const hasAction = typeof onAction === "function";
        return (
            <AssetInputView
                label={label}
                onChange={this.handleChange}
                hasAction={hasAction}
                onAction={this.handleAction}
                actionLabel={actionLabel}
                placeholder={counterpart.translate(
                    placeholder || "utility.asset_input_placeholder"
                )}
                disableActionButton={validateStatus !== "success"}
                inputStyle={inputStyle}
                style={style}
                value={value}
                validateStatus={validateStatus}
                help={help ? <Translate content={help} /> : ""}
            />
        );
    }
}

const BoundAssetInput = BindToChainState(ControlledAssetInput);

// wrapper so you only need to hook onFound and provide a defaultValue
class AssetInput extends PureComponent {
    static propTypes = {
        // common
        label: PropTypes.string, // a translation key for the label
        placeholder: PropTypes.string, // the placeholder text to be displayed when there is no input
        // default to "utility.asset_input_placeholder"
        onFound: PropTypes.func, // a method to be called when a valid asset is found, the asset object is passed as argument.
        // is called with null when the input is changed from a valid to an invalid asset name
        style: PropTypes.object, // style to pass to the containing component (Form.Item)
        inputStyle: PropTypes.object, // Input component style
        onAction: PropTypes.func, // if provided, an action button will be displayed and this method will be called when the button is clicked
        actionLabel: PropTypes.string, // translation key for the action button
        validateStatus: PropTypes.string, // "succes", "error" or "validating" the action button will be disabled if set to "error"
        // if not provided, it is derived from the validity of the current value
        help: PropTypes.string, // a translation key for the help

        // automatic mode (no onChange callback provided)
        defaultValue: PropTypes.string, // pre-entered value

        // controlled mode
        onChange: PropTypes.func, // a method to be called when the input changes, the input is passed as argument
        value: PropTypes.string // the current value of the asset selector, the string the user enters (only used if an onChange callback is provided)
    };

    state = {
        value: undefined
    };

    static getDerivedStateFromProps = (props, state) => ({
        value:
            typeof state.value === "undefined"
                ? props.defaultValue || ""
                : state.value
    });

    handleChange = value => {
        this.setState({value});
    };

    render() {
        const {onChange} = this.props;
        const childProps =
            typeof onChange === "function"
                ? this.props
                : {
                      ...this.props,
                      value: this.state.value,
                      onChange: this.handleChange
                  };
        return <BoundAssetInput asset={childProps.value} {...childProps} />;
    }
}

export default AssetInput;
