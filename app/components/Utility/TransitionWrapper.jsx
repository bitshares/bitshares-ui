import React from "react";
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup";

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
        this.enableAnimation();
    }

    resetAnimation() {
        this.setState({
            animateEnter: false
        });

        this.enableAnimation();
    }

    enableAnimation() {
        this.timer = setTimeout(() => {
            if (this.timer) {
                this.setState({
                    animateEnter: true
                });
            }
        }, 2000);
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
        this.timer = null;
    }

    render() {
        if (!this.props.children) {
            return React.createElement(this.props.component);
        } else {
            return (
                <CSSTransitionGroup
                    className={this.props.className}
                    component={this.props.component}
                    transitionName={this.props.transitionName}
                    transitionEnterTimeout={this.props.enterTimeout}
                    transitionEnter={this.state.animateEnter}
                    transitionLeave={false}
                >
                    {this.props.children}
                </CSSTransitionGroup>
            );
        }
    }
}
