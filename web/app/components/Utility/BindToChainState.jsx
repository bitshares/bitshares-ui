import React from "react";
import _ from "lodash";
import ChainStore from "api/ChainStore";
import ChainTypes from "./ChainTypes";
import utils from "common/utils";

/**
 * @brief provides automatic fetching and updating of chain data
 *
 * After applying this decorator to component any property of a type from ChainTypes
 * specified in component's propTypes will be automatically converted from object or account id
 * into a state object that is either undefined, null or an Immutable object.   The
 * Immutable object will automatically be updated anytime it changes on the
 * blockchain.
 *
 * Example:
 *
 * @BindToChainState()
 * class Balance {
 *    static propTypes = {
 *        balance: ChainTypes.ChainObject.isRequired
 *    }
 *    render() {
 *        let amount = Number(this.props.balance.get('balance'));
 *        let type = this.props.balance.get('asset_type');
 *        return (<FormattedAsset amount={amount} asset={type}/>);
 *    }
 * }
 *
 * <Balance balance="1.5.3"/>
 */

const arrayElement = (element_number, array) => array[element_number];
const firstEl = _.curry(arrayElement)(0);
const secondEl = _.curry(arrayElement)(1);
const checkChainType = _.curry( (chain_type, t) => t === chain_type || t === chain_type.isRequired );
const isObjectType = checkChainType(ChainTypes.ChainObject);
const isAccountType = checkChainType(ChainTypes.ChainAccount);
const isKeyRefsType = checkChainType(ChainTypes.ChainKeyRefs);
const isAddressBalancesType = checkChainType(ChainTypes.ChainAddressBalances);
const isAssetType = checkChainType(ChainTypes.ChainAsset);
function checkIfRequired(t) {
    for(let k in ChainTypes) {
        let v = ChainTypes[k];
        if(t === v.isRequired) return true;
    }
    return false;
}

function BindToChainState(options) {
    return function (Component) {

        return class Wrapper extends React.Component {

            static contextTypes = {
                router: React.PropTypes.func.isRequired
            }

            constructor(props) {
                super(props);
                let prop_types_array = _.pairs(Component.propTypes);
                if(options && options.all_props) {
                    this.chain_objects = _.reject(Object.keys(this.props), (e) => e === "children" || e === "keep_updating");
                    this.chain_accounts = [];
                    this.chain_key_refs = [];
                    this.chain_address_balances = [];
                    this.chain_assets = [];
                    this.required_props = [];
                    this.all_chain_props = this.chain_objects;
                    this.default_props = {};
                } else {
                    this.chain_objects = prop_types_array.filter(_.flow(secondEl, isObjectType)).map(firstEl);
                    this.chain_accounts = prop_types_array.filter(_.flow(secondEl, isAccountType)).map(firstEl);
                    this.chain_key_refs = prop_types_array.filter(_.flow(secondEl, isKeyRefsType)).map(firstEl);
                    this.chain_address_balances = prop_types_array.filter(_.flow(secondEl, isAddressBalancesType)).map(firstEl);
                    this.chain_assets = prop_types_array.filter(_.flow(secondEl, isAssetType)).map(firstEl);
                    this.required_props = prop_types_array.filter(_.flow(secondEl, checkIfRequired)).map(firstEl);
                    this.all_chain_props = [...this.chain_objects,
                                            ...this.chain_accounts,
                                            ...this.chain_key_refs,
                                            ...this.chain_address_balances,
                                            ...this.chain_assets];
                }
                if(options && options.require_all_props){
                    this.required_props = this.all_chain_props;
                }
                this.default_props = _.clone(Component.defaultProps) || {};
                for (let key in this.default_props) {
                    let value = this.default_props[key];
                    if (typeof(value) === "string" && value.indexOf("props.") === 0) {
                        this.default_props[key] = _.get(this, value);
                    }
                }
                //console.log("----- Wrapper constructor ----->", this.all_chain_props);
                this.update = this.update.bind(this);
                this.state = { resolved: false };
            }

            shouldComponentUpdate(nextProps, nextState){
                return !utils.are_equal_shallow(this.props, nextProps) ||
                       !utils.are_equal_shallow(this.state, nextState);
            }

            componentWillMount() {
                ChainStore.subscribe( this.update );
                this.update();
            }

            componentWillUnmount() {
                ChainStore.unsubscribe( this.update );
            }

            componentWillReceiveProps( next_props ) {
                if(options && options.all_props) {
                    this.chain_objects = _.reject(Object.keys(next_props), (e) => e === "children" || e === "keep_updating");
                    this.all_chain_props = this.chain_objects;
                    this.state = _.pick(this.state, this.chain_objects);
                }
                this.update(next_props);
            }

            update(next_props)
            {
                let keep_updating = (options && options.keep_updating) || this.props.keep_updating;
                if(!next_props && !keep_updating && this.state.resolved) return;

                let props = next_props || this.props;
                let new_state = {};
                let all_objects_counter = 0;
                let resolved_objects_counter = 0;
                for( let key of this.chain_objects )
                {
                    let prop = props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getObject(prop);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if(new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_accounts )
                {
                    let prop = props[key] || this.default_props[key];
                    if(prop) {
                        if(prop[0] === "#" && Number.parseInt(prop.substring(1)))
                            prop = "1.2." + prop.substring(1);
                        let new_obj = ChainStore.getAccount(prop);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if(new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_key_refs )
                {
                    let prop = props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getAccountRefsOfKey(prop);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if(new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_address_balances )
                {
                    let prop = props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getBalanceObjects(prop);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if(new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_assets )
                {
                    let prop = props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getAsset(prop);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if(new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                //console.log("----- Wrapper update ----->", this.all_chain_props, this.all_chain_props.length, all_objects_counter, resolved_objects_counter);
                if(all_objects_counter === resolved_objects_counter) new_state.resolved = true;
                this.setState( new_state )
            }

            render() {
                const props = _.omit(this.props, this.all_chain_props);
                //console.log("----- Wrapper render ----->", props, this.state, this.required_props);
                for(let prop of this.required_props) if(!this.state[prop]) return null;
                //return <span className={this.state.resolved ? "resolved":"notresolved"}><Component {...props} {...this.state}/></span>;
                return <Component {...props} {...this.state}/>;
            }
        }

    }
}

@BindToChainState({all_props: true, require_all_props: true})
class Wrapper extends React.Component {
    render() {
        return <div className="wrapper">
            {this.props.children(this.props)}
        </div>;
    }
}

@BindToChainState({all_props: true})
class WrapperNR extends React.Component {
    render() {
        return <div className="wrapper">
            {this.props.children(this.props)}
        </div>;
    }
}

BindToChainState.Wrapper = Wrapper;
BindToChainState.WrapperNR = WrapperNR;

export default BindToChainState;
