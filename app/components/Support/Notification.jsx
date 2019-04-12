/**
 * The Notification component
 *
 * Renders a Notification for error messages, information, etc.
 */
import React from "react";

class Notification extends React.Component {
    state = {};

    render() {
        const classes = `notification-box ${this.props.className}`;

        return this.props.message ? (
            <div className={classes}>{this.props.message}</div>
        ) : null;
    }
}

export default Notification;
