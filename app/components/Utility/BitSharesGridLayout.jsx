import React from "react";
import {WidthProvider, Responsive} from "react-grid-layout";
import ls from "common/localStorage";

const STORAGE_KEY = "__BitSharesGridLayout__";
const ss = new ls(STORAGE_KEY);

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
            cols: {lg: 3, md: 2, sm: 1, xs: 1, xxs: 1},
            rowHeight: 30,
            isDraggable: true,
            isResizable: true
        };
    }

    getInitialLayout() {
        let layouts = this.getFromLS();
        console.log(layouts);
        if (!!!layouts) {
            layouts = getDefaultLayout();
        }
        return layouts;
    }

    getDefaultLayout() {
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
        this.setState({layouts: this.getDefaultLayout()});
    }

    toggleCustomizable() {
        this.setState({
            isDraggable: !this.state.isDraggable,
            isResizable: !this.state.isResizable
        });
    }

    onLayoutChange(layout, layouts) {
        this.saveToLS(layouts);
        this.setState({layouts});
    }

    getFromLS() {
        return ss.get(this.props.layoutid, null);
    }

    saveToLS(layouts) {
        ss.set(this.props.layoutid, layouts);
    }

    render() {
        let children = this.props.children;

        console.log(this.state.layouts);

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
                        let props = {};
                        props["data-grid"] = child.props.layout.lg;
                        if (this.state.isDraggable) {
                            return (
                                <div
                                    {...child.props}
                                    {...props}
                                    style={{
                                        border: "1px solid #000000"
                                    }}
                                >
                                    {child.props.dragname}
                                </div>
                            );
                        } else {
                            return React.cloneElement(child, props);
                        }
                    })}
                </ResponsiveReactGridLayout>
            </div>
        );
    }
}

export default BitSharesGridLayout;
