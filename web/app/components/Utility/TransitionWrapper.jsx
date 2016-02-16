import React from "react";
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export default class TransitionWrapper extends React.Component {

    static defaultProps = {
        component: "span",
        enterTimeout: 2000
    };

    constructor() {
        super();

        this.state = {
            animateEnter: false
        };

        this.timer = null;
    }

    componentDidMount() {
        this.timer = setTimeout(() => {
            this.setState({
                animateEnter: true
            })
        }, 2000)
    }

    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    render() {
        if (!this.props.children) {
            return React.createElement(this.props.component);
        } else {
            return (
                <ReactCSSTransitionGroup
                    className={this.props.className}
                    component={this.props.component}
                    transitionName={this.props.transitionName}
                    transitionEnterTimeout={this.props.enterTimeout}
                    transitionEnter={this.state.animateEnter}
                    transitionLeave={false}
                >
                    {this.props.children}
                </ReactCSSTransitionGroup>
            );
        }
    }
}
