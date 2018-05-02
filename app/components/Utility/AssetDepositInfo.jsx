import React from "react";

export default class AssetDepositFeeWarning extends React.Component {
    _getLabelClass(type) {
        if (type === "warn" || type === "warning") {
            return "warning";
        }
        if (type === "error" || type === "alert") {
            return "alert";
        }
        return "";
    }

    render() {
        const {asset, style} = this.props;

        if (!asset || !asset.info || !asset.info.length > 0) {
            return <span />;
        }

        const labelStyle = {
            whiteSpace: "normal",
            lineHeight: 1.4
        };

        return (
            <div style={style || {}}>
                {asset.info.map((info, i) => {
                    if (!info.section || info.section === "deposit") {
                        return (
                            <label
                                key={"depositInfo" + i}
                                className={
                                    "label " + this._getLabelClass(info.type)
                                }
                                style={labelStyle}
                            >
                                {info.text}
                            </label>
                        );
                    }
                })}
            </div>
        );
    }
}
