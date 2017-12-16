<<<<<<< HEAD
import Autocomplete from 'react-autocomplete'
import React from 'react'
=======
import Autocomplete from "react-autocomplete"
import React from "react"
>>>>>>> ae46d0d20466358c2ee9977fb0a1921aa7933b42
import Icon from "../Icon/Icon";
import Translate from "react-translate-component"

class TypeAhead extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
<<<<<<< HEAD
            value: '',
=======
            value: "",
>>>>>>> ae46d0d20466358c2ee9977fb0a1921aa7933b42
        }
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

        return <div style={{position: "relative", display: "inline-block", width: "100%"}} className="typeahead">
<<<<<<< HEAD
            <label><Translate content="gateway.symbol" /></label>
            <Autocomplete
                ref="autocomplete"
                items={props.items || [
                    { id: 'foo', label: 'foo' },
                    { id: 'bar', label: 'bar' },
                    { id: 'baz', label: 'baz' },
                ]}
                getItemValue={(item) => item.label}
=======
            <label className="left-label"><Translate content="gateway.symbol" /></label>
            <Autocomplete
                ref="autocomplete"
                items={props.items || [
                    { id: "foo", label: "foo" },
                    { id: "bar", label: "bar" },
                    { id: "baz", label: "baz" },
                ]}
>>>>>>> ae46d0d20466358c2ee9977fb0a1921aa7933b42
                shouldItemRender={(item, value) => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1}
                getItemValue={item => item.label}
                renderItem={(item, highlighted) =>
                    <div
                        key={item.id}
<<<<<<< HEAD
                        style={{ backgroundColor: highlighted ? '#eee' : 'transparent', color: '#000', padding: '5px'}}
=======
                        style={{ backgroundColor: highlighted ? "#eee" : "transparent", color: "#000", padding: "5px"}}
>>>>>>> ae46d0d20466358c2ee9977fb0a1921aa7933b42
                    >
                    {item.label}
                    </div>
                }
                value={this.state.value}
                onChange={this.onChange.bind(this)}
                onSelect={this.onSelect.bind(this)}
            />
<<<<<<< HEAD
            <Icon name="chevron-down" style={{position: "absolute", right: "10px", top: "30px"}} onClick={this.focus.bind(this)} />
=======
            <Icon name="chevron-down" style={{position: "absolute", right: "10px", top: "35px"}} onClick={this.focus.bind(this)} />
>>>>>>> ae46d0d20466358c2ee9977fb0a1921aa7933b42
        </div>
    }
}

export default TypeAhead;
