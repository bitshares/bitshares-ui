import React from "react";
import {WidthProvider, Responsive} from "react-grid-layout";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

/**
 * This layout demonstrates how to sync multiple responsive layouts to localstorage.
 */
class BitSharesGridLayout extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            layouts: this.getInitialLayout(),
            isDraggable: false,
            isResizable: false
        };
    }

    static get defaultProps() {
        return {
            className: "layout",
            cols: {lg: 12, md: 10, sm: 6, xs: 4, xxs: 2},
            rowHeight: 30,
            isDraggable: true,
            isResizable: true
        };
    }

    getInitialLayout() {
        let layouts = {};

        this.props.children.forEach(child => {
            if (!!child.props.layout) {
                Object.keys(child.props.layout).forEach(key => {
                    if (!layouts[key]) {
                        layouts[key] = [];
                    }
                    layouts[key].push(
                        Object.assign(
                            {},
                            {i: child.key},
                            child.props.layout[key]
                        )
                    );
                });
            }
        });
        return layouts;
    }

    resetLayout() {
        this.setState({layouts: this.getInitialLayout()});
    }

    toggleCustomizable() {
        this.setState({
            isDraggable: !this.state.isDraggable,
            isResizable: !this.state.isResizable
        });
    }

    onLayoutChange(layout, layouts) {
        saveToLS("layouts", layouts);
        this.setState({layouts});
    }

    render() {
        const children = this.props.children;

        return (
            <div>
                <button
                    className="button"
                    onClick={() => this.toggleCustomizable()}
                >
                    {this.state.isDraggable
                        ? "Disable customization"
                        : "Enable customization"}
                </button>
                <button className="button" onClick={() => this.resetLayout()}>
                    Reset layout
                </button>
                <ResponsiveReactGridLayout
                    className={this.props.className}
                    cols={this.props.cols}
                    rowHeight={this.props.rowHeight}
                    isDraggable={this.state.isDraggable}
                    isResizable={this.state.isResizable}
                    layouts={this.state.layouts}
                    onLayoutChange={(layout, layouts) =>
                        this.onLayoutChange(layout, layouts)
                    }
                >
                    {React.Children.map(children, (child, i) => {
                        return child;
                    })}
                </ResponsiveReactGridLayout>
            </div>
        );
    }
}

export default BitSharesGridLayout;

function getFromLS(key) {
    let ls = {};
    if (global.localStorage) {
        try {
            ls = JSON.parse(global.localStorage.getItem("rgl-8")) || {};
        } catch (e) {
            /*Ignore*/
        }
    }
    return ls[key];
}

function saveToLS(key, value) {
    if (global.localStorage) {
        global.localStorage.setItem(
            "rgl-8",
            JSON.stringify({
                [key]: value
            })
        );
    }
}
