
import Autocomplete from "react-autocomplete";
import React from "react";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component"
import Autocomplete from "react-autocomplete";

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

    onClick = () => {
        // Timer is used to keep menu from popping back open due to order of blur then click event
        if (this.blockClick) {
            return;
        }
        const { isMenuShowing } = this.state || {};
        this.setState({ isMenuShowing: !isMenuShowing, filter: "" }, () => {
            const { autocomplete } = this.refs;
            autocomplete.refs.input.focus();
        });
    };

    onChange = e => {
        this.setState({ filter: e.target.value });
        if (this.props.onChange) {
            this.props.onChange(e.target.value);
        }
    };

    onSelect(value){
        let asset = null;
        this.props.items.forEach((item)=>{
            if(value == item.id) asset = item;
        });

        this.setState({value, filter: "", isMenuShowing: false});
        if(this.props.onSelect) this.props.onSelect(value, asset);
    }


    renderInput = props => {
        const { isMenuShowing } = this.state || {};
        return isMenuShowing ? (
            <input {...props} style={TypeAhead.inputStyle} />
        ) : null;
    };

    dropDown = () => {
        const { props, state } = this;
        const { filter = "", isMenuShowing } = state;
        let inputProps = props.inputProps || {};

        if (props.tabIndex) inputProps.tabIndex = props.tabIndex;
        const wrapperStyle = isMenuShowing
            ? TypeAhead.menuShowingwrapperStyle
            : TypeAhead.menuHiddenwrapperStyle;
        return (
            <Autocomplete
                renderInput={this.renderInput}
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
                onSelect={this.onSelect}
                inputProps={{ ...inputProps, onBlur: this.onBlur }}
                menuStyle={TypeAhead.menuStyle}
                wrapperStyle={wrapperStyle}
                open={isMenuShowing}
            />
        );
    };

    onBlur = () => {
        // Timer is used to keep menu from popping back open due to order of blur then click event
        this.timer && clearTimeout(this.timer);
        this.blockClick = true;
        this.setState({ isMenuShowing: false });
        this.timer = setTimeout(() => {
            this.blockClick = false;
        }, 300); // Magic number that seems fast and slow enough for events and render to complete
    };

    static inputStyle = {
        marginTop: 4
    };

    static menuShowingwrapperStyle = {
        backgroundColor: "rgb(62, 62, 62)",
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: -4,
        paddingTop: 4,
        paddingBottom: 50,
        position: "fixed",
        width: "100%",
        maxWidth: 436,
        zIndex: 1
    };

    static menuHiddenwrapperStyle = {};

    static menuStyle = {
        borderBottomRightRadius: 3,
        borderBottomLeftRadius: 3,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
        background: "rgba(255, 255, 255, 0.9)",
        paddingTop: 5,
        paddingLeft: 5,
        paddingRight: 10,
        paddingBottom: 5,
        marginTop: 5,
        marginLeft: -10,
        width: "100%",
        maxWidth: 436,
        fontSize: "90%",
        position: "fixed",
        overflowX: "visible",
        overflowY: "scroll",
        maxHeight: "20%",
        zIndex: 1
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

    getValueFromItem = item => item.label;

    selectedDisplay = () => {
        const { value } = this.state;
        return (
            <div
                style={{
                    width: "100%",
                    backgroundColor: "#3e3e3e",
                    height: 32,

                    borderRadius: 5,
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingTop: 8,
                    paddingBottom: 5
                }}
                onClick={this.onClick}
            >
                {value}
            </div>
        );
    };

    render() {
        console.log("render");
        const { isMenuShowing } = this.state || {};
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
                        top: !!this.props.label ? 35 : 7,
                        transform: isMenuShowing ? "rotate(180deg)" : null
                    }}
                />
            </div>
        );
    }
}
