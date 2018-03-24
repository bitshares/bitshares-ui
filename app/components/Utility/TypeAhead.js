import Autocomplete from "react-autocomplete";
import React from "react";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";
import cnames from "classnames";

export default class TypeAhead extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.defaultValue
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value && nextProps.value != this.state.value) {
            this.setState({value: nextProps.value});
        }
    }

    onClick = () => {
        // Timer is used to keep menu from popping back open due to order of blur then click event
        if (this.blockClick) {
            return;
        }
        const {isMenuShowing} = this.state || {};
        this.setState({isMenuShowing: !isMenuShowing, filter: ""}, () => {
            const {autocomplete} = this.refs;
            autocomplete.refs.input.focus();
        });
    };

    onChange = e => {
        this.setState({filter: e.target.value});
        if (this.props.onChange) {
            this.props.onChange(e.target.value);
        }
    };

    onSelect(value) {
        let asset = null;
        let disabled = false;
        this.props.items.forEach(item => {
            if (value == item.id && item.disabled) disabled = true;
            if (value == item.id) asset = item;
        });
        
        if(disabled) return;
        
        this.setState({value, filter: "", isMenuShowing: false});
        if (this.props.onSelect) this.props.onSelect(value, asset);
    }

    renderInput = props => {
        const {isMenuShowing} = this.state || {};
        return isMenuShowing ? (
            <input {...props} style={TypeAhead.inputStyle} />
        ) : null;
    };

    dropDown = () => {
        const {props, state} = this;
        const {filter = "", isMenuShowing} = state;
        let inputProps = props.inputProps || {};

        if (props.tabIndex) inputProps.tabIndex = props.tabIndex;
        return (
            <Autocomplete
                renderInput={this.renderInput}
                ref="autocomplete"
                items={
                    props.items || [
                        {id: "foo", label: "foo"},
                        {id: "bar", label: "bar"},
                        {id: "baz", label: "baz"}
                    ]
                }
                shouldItemRender={({label}) =>
                    label.toLowerCase().indexOf(filter.toLowerCase()) > -1
                }
                getItemValue={this.getValueFromItem}
                renderItem={this.renderItem}
                value={filter}
                onChange={this.onChange}
                onSelect={this.onSelect.bind(this)}
                inputProps={{...inputProps, onBlur: this.onBlur}}
                menuStyle={TypeAhead.menuStyle}
                wrapperProps={{
                    className: isMenuShowing ? "typeahead__innerList" : ""
                }}
                open={isMenuShowing}
            />
        );
    };

    onBlur = () => {
        // Timer is used to keep menu from popping back open due to order of blur then click event
        this.timer && clearTimeout(this.timer);
        this.blockClick = true;
        this.setState({isMenuShowing: false});
        this.timer = setTimeout(() => {
            this.blockClick = false;
        }, 300); // Magic number that seems fast and slow enough for events and render to complete
    };

    static inputStyle = {
        marginTop: 4
    };

    // Suggestion Menu List
    static menuStyle = {
        borderBottomRightRadius: 3,
        borderBottomLeftRadius: 3,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
        paddingBottom: 0,
        marginTop: 5,
        marginLeft: 0,
        width: "100%",
        maxWidth: 436,
        fontSize: "90%",
        position: "",
        overflowX: "visible",
        overflowY: "scroll",
        maxHeight: "10rem",
        zIndex: 1
    };

    renderItem = (item, highlighted) => {
        const isDisabled = item.disabled;
        const className = item.className ? item.className : null;
        return (
            <div
                key={item.id}
                className={cnames(
                    "typeahead__innerItem",
                    highlighted ? " typeahead__innerItem_highlighted" : "",
                    className
                )}
            >
                <span
                    className={
                        isDisabled ? "typeahead__innerItem__disabled" : ""
                    }
                >
                    {item.label}
                </span>
                <span style={{float: "right", fontSize: "90%", textTransform: "uppercase"}}>{item.status}</span>
            </div>
        );
    };

    getValueFromItem = item => item.label;

    selectedDisplay = () => {
        const {value} = this.state;
        return (
            <div onClick={this.onClick} className="typeahead__input">
                {value}
            </div>
        );
    };

    render() {
        const {isMenuShowing} = this.state || {};

        const style = isMenuShowing ? this.props.typeaheadVisibleStyle : {};

        return (
            <div
                className="typeahead"
                style={style} // Something is making the typeahead take less space when dropdown is open. Add extra padding for now...
            >
                {!!this.props.label ? (
                    <label className="left-label">
                        <Translate content={this.props.label} />
                    </label>
                ) : null}
                {this.selectedDisplay()}
                {this.dropDown()}
                <Icon
                    onClick={this.onClick}
                    name="chevron-down"
                    style={{
                        position: "absolute",
                        right: 10,
                        top: !!this.props.label ? 35 : 7,
                        transform: isMenuShowing ? "rotate(180deg)" : null
                    }}
                />
            </div>
        );
    }
}
