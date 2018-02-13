import Autocomplete from "react-autocomplete";
import React from "react";

import Icon from "../Icon/Icon";
import Translate from "react-translate-component";

export default class TypeAhead extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.defaultValue
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value && nextProps.value != this.state.value) {
            this.setState({ value: nextProps.value });
        }
    }

    focus = e => {
        const { autocomplete } = this.refs;
        autocomplete.refs.input.click();
        autocomplete.refs.input.focus();
        e.stopPropagation();
    };

    onChange = e => {
        this.setState({ filter: e.target.value });
        if (this.props.onChange) {
            this.props.onChange(e.target.value);
        }
    };

    onSelect = value => {
        this.setState({ value, filter: "" });
        if (this.props.onSelect) {
            this.props.onSelect(value);
        }
    };

    onMenuVisibilityChange = isOpen => {
        this.setState({ isOpen, filter: "" });
    };

    dropDown = () => {
        const { props, state } = this;
        const { filter = "" } = state;
        let inputProps = props.inputProps || {};

        if (props.tabIndex) inputProps.tabIndex = props.tabIndex;
        return (
            <Autocomplete
                ref="autocomplete"
                items={
                    props.items || [
                        { id: "foo", label: "foo" },
                        { id: "bar", label: "bar" },
                        { id: "baz", label: "baz" }
                    ]
                }
                shouldItemRender={({ label }) =>
                    label.toLowerCase().indexOf(filter.toLowerCase()) > -1
                }
                getItemValue={this.getValueFromItem}
                renderItem={this.renderItem}
                value={filter}
                onChange={this.onChange}
                onMenuVisibilityChange={this.onMenuVisibilityChange}
                onSelect={this.onSelect}
                inputProps={inputProps}
                menuStyle={TypeAhead.menuStyle}
            />
        );
    };

    static menuStyle = {
        borderRadius: "3px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
        background: "rgba(255, 255, 255, 0.9)",
        padding: "2px 0",
        fontSize: "90%",
        position: "fixed",
        overflow: "auto",
        maxHeight: "20%"
    };

    renderItem = (item, highlighted) => {
        const isDisabled = item.status && item.status > 1;
        const color = isDisabled ? "#afafaf" : "#ffffff";

        return (
            <div
                key={item.id}
                style={{
                    backgroundColor: highlighted ? "#eee" : "transparent",
                    padding: "5px"
                }}
            >
                <span style={{ color }}>{item.label}</span>
                <span style={{ float: "right", color: "#afafaf" }}>
                    {item.status}
                </span>
            </div>
        );
    };

    getItemByValue = value => {
        const { items } = this.props;
        return items.find(item => item.label === value);
    };

    getValueFromItem = item => item.label;

    selectedDisplay = () => {
        const { value } = this.state;
        return (
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#3e3e3e",
                    height: 32,
                    marginBottom: 10,
                    borderRadius: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 8,
                    paddingBottom: 5
                }}
                onClick={this.focus}
            >
                {value}
            </div>
        );
    };

    render() {
        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: "100%"
                }}
                className="typeahead"
            >
                {!!this.props.label ? (
                    <label className="left-label">
                        <Translate content={this.props.label} />
                    </label>
                ) : null}
                {this.selectedDisplay()}
                {this.dropDown()}
                <Icon
                    name="chevron-down"
                    style={{
                        position: "absolute",
                        right: 10,
                        top: !!this.props.label ? 35 : 7
                    }}
                    onClick={this.focus}
                />
            </div>
        );
    }
}
