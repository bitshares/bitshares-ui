import React from "react";
import {PropTypes, Component} from "react";
import ActionSheet from "react-foundation-apps/lib/action-sheet";
import ZfApi from "react-foundation-apps/lib/utils/foundation-api";

class Typeahead extends Component {

    handleChange(e) {
        // value e.target.value
        ZfApi.publish(this.props.id, "open");
    }

    render() {
        var items = this.props.options.map( o => {
            return (<li key={o[0]}><a href>{o[1]}</a></li>);
        });
        return (
            <ActionSheet id={this.props.id}>
                <input type="text" placeholder={this.props.placeholder} onChange={this.handleChange.bind(this)}/>
                <ActionSheet.Content >
                    <ul className="no-first-element-top-border">
                        {items}
                    </ul>
                </ActionSheet.Content>
            </ActionSheet>
        );
    }
}


Typeahead.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    options: PropTypes.array.isRequired
};

export default Typeahead;
