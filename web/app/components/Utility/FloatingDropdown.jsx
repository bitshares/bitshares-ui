import React from "react";
import utils from "common/utils";

class Dropdown extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            active: false,
            listener: false
        };

        this.onBodyClick = this.onBodyClick.bind(this);
    }

    componentDidMount() {
        this._setListener();
    }

    shouldComponentUpdate(np, ns) {
        return (
            !utils.are_equal_shallow(np.entries, this.props.entries) ||
            !utils.are_equal_shallow(ns, this.state) ||
            np.value !== this.props.value
        );
    }

    _setListener(props = this.props, state = this.state) {
        if(props.entries.length > 1 && !state.listener) {
            document.body.addEventListener("click", this.onBodyClick, false);
            this.setState({listener: true});
        }
    }

    componentWillReceiveProps(np) {
        this._setListener(np);
    }

    componentWillUnmount() {
        document.body.removeEventListener("click", this.onBodyClick);
    }

    onBodyClick(e) {
        let el = e.target;
        let insideActionSheet = false;

        do {
            if(el.classList && el.classList.contains("dropdown") && el.id === this.props.id) {
                insideActionSheet = true;
                break;
            }
        } while ((el = el.parentNode));

        if(!insideActionSheet) {
            this.setState({active: false});
        }
    }

    onChange(value, e) {
        e.preventDefault();
        e.stopPropagation();
        this.props.onChange(value);
        this.setState({
            active: false
        });
    }

    _toggleDropdown() {
        this.setState({
            active: !this.state.active
        });
    }

    render() {
        const {entries, value} = this.props;
        console.log("entries:", entries, "value:", value);
        let {active} = this.state;
        if(entries.length === 0) return null;
        if(entries.length == 1) {
            return (
               <div className={"dropdown-wrapper inactive"}>
                   <div>
                       {this.props.singleEntry ? this.props.singleEntry : entries[0]}
                   </div>
               </div>
           );
        } else {
            let options = entries.map(value => {
                return <li onClick={this.onChange.bind(this, this.props.values[value])}><span>{value}</span></li>
            });
            return (
                <div onClick={this._toggleDropdown.bind(this)} className={"dropdown-wrapper" + (active ? " active" : "")}>
                    <div style={{paddingRight: 15}}>{value}</div>
                    <ul className="dropdown">
                        {options}
                    </ul>
                </div>
                );
        }
    }
}

export default Dropdown;
