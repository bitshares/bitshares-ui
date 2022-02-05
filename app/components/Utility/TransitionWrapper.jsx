import React from "react";
import {CSSTransition, TransitionGroup} from "react-transition-group";

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
                <TransitionGroup
                    component={this.props.component}
                    id={this.props.id}
                    className={this.props.className}
                >
                    {React.Children.map(this.props.children, (child, index) => (
                        <CSSTransition
                            key={index}
                            classNames={this.props.transitionName}
                            timeout={{enter: this.props.enterTimeout}}
                            exit={false}
                            enter={this.state.animateEnter}
                        >
                            {child}
                        </CSSTransition>
                    ))}
                </TransitionGroup>
            );
        }
    }
}
