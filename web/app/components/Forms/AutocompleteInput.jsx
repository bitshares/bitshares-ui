import React from "react";
import {PropTypes, Component} from "react";
import ActionSheet from "react-foundation-apps/lib/action-sheet";
import ZfApi from "react-foundation-apps/lib/utils/foundation-api";

class AutocompleteInput extends Component {

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.handleItemClick = this.handleItemClick.bind(this);
        this.state = { items: [] }
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
            this.props.onChange(event);
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
            let event = { target: { id: input.id, value: value[1]} };
            this.props.onChange(event);
        }
    }

    render() {
        var items = this.state.items.map( i => {
            return (<li key={i[0]}><a href data-value={i[0]} onClick={this.handleItemClick}>{i[1]}</a></li>);
        });
        let action_sheet_id = this.props.id + "-container";
        return (
            <div className="autocomplete">
                <ActionSheet className="autocomplete" ref="action_sheet" id={action_sheet_id}>
                    <input name="value" id={this.props.id} type="text" placeholder={this.props.placeholder} onChange={this.handleChange} defaultValue={this.props.initial_value}/>
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
    onChange: PropTypes.func.isRequired
};

export default AutocompleteInput;
