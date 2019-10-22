import React from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import {Select} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import {Map} from "immutable";

class ChainSelectView extends React.Component {
    static propTypes = {
        chains: PropTypes.array,
        placeholder: PropTypes.string,
        style: PropTypes.object,
        selectStyle: PropTypes.object

        // all other props are passed to the Select component
    };

    static defaultProps = {
        chains: ["BitShares Blockchain"],
        placeholder: null,
        style: {},
        selectStyle: {}
    };

    render() {
        let {
            chains,
            selectStyle,
            style,
            placeholder,
            value,
            onDropdownVisibleChange,
            ...remProps
        } = this.props;

        const disableSelect =
            chains.filter(Map.isMap).length <= 1 && !onDropdownVisibleChange;

        if (!value) {
            value = chains[0];
        }

        // if onDropdownVisibleChange given we assume that lazy loading takes place
        const select = (
            <Select
                onDropdownVisibleChange={onDropdownVisibleChange}
                showArrow={disableSelect ? false : undefined}
                style={selectStyle}
                placeholder={
                    <Translate
                        content={
                            placeholder || "utility.asset_select_placeholder"
                        }
                    />
                }
                value={value}
                {...remProps}
                optionFilterProp="children"
                filterOption={(input, option) =>
                    option.key.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                disabled={disableSelect}
                notFoundContent={counterpart.translate("global.not_found")}
            >
                {chains.filter(Map.isMap).map(chain => {
                    return (
                        <Select.Option key={chain} value={chain}>
                            {chain}
                        </Select.Option>
                    );
                })}
            </Select>
        );
        return (
            <div className={"chain-select"} style={style}>
                {select}
            </div>
        );
    }
}

export default ChainSelectView;
