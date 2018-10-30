import React, {Component} from "react";
import PropTypes from "prop-types";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";

export default class Showcase extends Component {
    static propTypes = {
        target: PropTypes.func.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired
    };

    constructor() {
        super();
    }

    render() {
        return (
            <div className="small-12 padding">
                <div
                    className="grid-block vertical medium-horizontal padding"
                    style={{"background-color": "gray"}}
                >
                    <Translate
                        className="small-12 showcase-label padding"
                        content="transfer.fee"
                    />
                    <label className="small-12 showcase-label padding">
                        {this.props.description}
                    </label>
                    <div className="small-3 ">
                        <Icon name={this.props.icon} />
                    </div>
                </div>
            </div>
        );
    }
}
