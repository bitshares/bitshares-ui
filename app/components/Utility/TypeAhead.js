import Autocomplete from "react-autocomplete";
import React from "react";
import Icon from "../Icon/Icon";
import Translate from "react-translate-component";

class TypeAhead extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            value: this.props.defaultValue
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.value && nextProps.value != this.state.value) this.setState({value: nextProps.value});
    }

    focus(e){
        let { autocomplete } = this.refs;
        autocomplete.refs.input.click();
        autocomplete.refs.input.focus();
        e.stopPropagation();
    }

    onChange(e){
        this.setState({value: e.target.value});
        if(this.props.onChange) this.props.onChange(e.target.value);
    }

    onSelect(value){
        this.setState({value});
        if(this.props.onSelect) this.props.onSelect(value);
    }

    render(){
        const { props, state } = this;
        const { value } = state;
        const inputProps = props.tabIndex ? { tabIndex: props.tabIndex } : null;

        return <div style={{position: "relative", display: "inline-block", width: "100%"}} className="typeahead">
            {!!this.props.label ? <label className="left-label"><Translate content={this.props.label} /></label> : null}
            <Autocomplete
                ref="autocomplete"
                items={props.items || [
                    { id: "foo", label: "foo" },
                    { id: "bar", label: "bar" },
                    { id: "baz", label: "baz" },
                ]}
                shouldItemRender={(item, value) => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1}
                getItemValue={item => item.label}
                renderItem={(item, highlighted) =>
                    <div
                        key={item.id}
                        style={{ backgroundColor: highlighted ? "#eee" : "transparent", color: "#000", padding: "5px"}}
                    >
                    {item.label}
                    </div>
                }
                value={value}
                selectOnBlur={this.props.selectOnBlur}
                onChange={this.onChange.bind(this)}
                onSelect={this.onSelect.bind(this)}
                inputProps={inputProps}
            />
        <Icon name="chevron-down" style={{position: "absolute", right: 10, top: !!this.props.label ? 35 : 7}} onClick={this.focus.bind(this)} />
        </div>;
    }
}

export default TypeAhead;
