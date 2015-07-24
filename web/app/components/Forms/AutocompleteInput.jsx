import React from "react";
import {PropTypes, Component} from "react";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

class AutocompleteInput extends Component {

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.handleItemClick = this.handleItemClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = { items: [] };
    }

    getInput() {
        let action_sheet = React.findDOMNode(this.refs.action_sheet);
        return action_sheet.querySelector('[name="value"]');
    }

    value() {
        return this.getInput().value;
    }

    setValue(value) {
        return this.getInput().value = value;
    }

    clear() {
        this.getInput().value = "";
    }

    focus() {
        this.getInput().focus();
    }

    handleChange(e) {
        e.preventDefault();
        e.stopPropagation();
        let action_sheet_id = this.props.id + "-container";
        let value = e.target.value;
        let items = value === "" ? [] : this.props.options.filter( i => {
            let v = typeof i === "string" ? i : i[1];
            return v.startsWith(value);
        });
        this.setState({items});

        if(items.size) {
            if(items.size > 0 && !(items.size === 1 && items.first() === value)) {
                ZfApi.publish(action_sheet_id, "open");
            } else {
                ZfApi.publish(action_sheet_id, "close");
            }
        } else {
            if(items.length > 0 && !(items.length === 1 && items[0][1] === value)) {
                ZfApi.publish(action_sheet_id, "open");
            } else {
                ZfApi.publish(action_sheet_id, "close");
            }
        }
        if (this.props.onChange) this.props.onChange(e);
    }

    handleItemClick(e) {
        e.preventDefault();
        let raw_value = e.target.dataset.value;
        let value = raw_value[0] === "[" ? JSON.parse(raw_value)[1] : raw_value;
        let input = this.getInput();
        input.value = value;
        ZfApi.publish(this.props.id + "-container", "close");
        if (this.props.onChange) {
            let event = { target: { value: value, id: this.props.id}};
            this.props.onChange(event);
        }
    }

    onKeyDown(e) {
        if(this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        var items = this.state.items.map( i => {
            let j = typeof i === "string" ? [i,i] : i;
            return (<li key={j[0]}><a href data-value={j[0]} onClick={this.handleItemClick}>{j[1]}</a></li>);
        });
        let action_sheet_id = this.props.id + "-container";
        return (
            <div className="autocomplete">
                <ActionSheet className="autocomplete" ref="action_sheet" id={action_sheet_id}>
                    <input name="value" type="text" id={this.props.id}
                           placeholder={this.props.placeholder} defaultValue={this.props.initial_value}
                           onChange={this.handleChange} onKeyDown={this.onKeyDown}/>
                    <ActionSheet.Content >
                        <ul className="no-first-element-top-border">
                            {items}
                        </ul>
                    </ActionSheet.Content>
                </ActionSheet>
            </div>
        );
    }
}

AutocompleteInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    initial_value: PropTypes.string,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func,
    onEnter: PropTypes.func
};

export default AutocompleteInput;
