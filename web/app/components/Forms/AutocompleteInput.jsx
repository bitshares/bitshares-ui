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
            return i[1].startsWith( value);
        });
        this.setState({items});
        if(items.length > 0 && !(items.length === 1 && items[0][1] === value)) {
            ZfApi.publish(action_sheet_id, "open");
        } else {
            ZfApi.publish(action_sheet_id, "close");
        }
        if (this.props.onChange) {
            console.log("calling prop onChange", e);
            this.props.onChange(e);
        }
    }

    handleItemClick(e) {
        e.preventDefault();
        let raw_value = e.target.dataset.value;
        let value = raw_value[0] === "[" ? JSON.parse(raw_value) : raw_value;
        let input = this.getInput();
        input.value = value[1];
        ZfApi.publish(this.props.id + "-container", "close");
        if (this.props.onChange) {
            let event = { target: { value: value[1], id: this.props.id}};
            this.props.onChange(event);
        }
    }

    onKeyDown(e) {
        if(this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        var items = this.state.items.map( i => {
            return (<li key={i[0]}><a href data-value={i[0]} onClick={this.handleItemClick}>{i[1]}</a></li>);
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
    onChange: PropTypes.func
};

export default AutocompleteInput;
