import React from "react";

// a class to display time nicely when given seconds
// for example, display

// expects the number of seconds as a property

class FormattedTime extends React.Component {
    constructor(props) {
        super(props);

        this.state = {time: props.time};
    }

    // given an integer seconds as an argument,
    // return the number of hours
    getHours(secs) {
        //console.log("get hours called with: " + secs);
        return secs / 3600;
    }

    render() {
        return <div>{this.getHours(this.state.time)}h</div>;
    }
}

export default FormattedTime;
