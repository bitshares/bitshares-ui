import React from "react";
import curry from "lodash.curry";
import flow from "lodash.flow";
import reject from "lodash.reject";
import clone from "lodash.clone";
import pairs from "lodash.pairs";
import filter from "lodash.filter";
import omit from "lodash.omit";
import get from "lodash.get";
import pick from "lodash.pick";
import {ChainStore} from "graphenejs-lib";
import ChainTypes from "./ChainTypes";
import utils from "common/utils";
import LoadingIndicator from "../LoadingIndicator";

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
const firstEl = curry(arrayElement)(0);
const secondEl = curry(arrayElement)(1);
const checkChainType = curry( (chain_type, t) => t === chain_type || t === chain_type.isRequired );
const isObjectType = checkChainType(ChainTypes.ChainObject);
const isAccountType = checkChainType(ChainTypes.ChainAccount);
const isKeyRefsType = checkChainType(ChainTypes.ChainKeyRefs);
const isAddressBalancesType = checkChainType(ChainTypes.ChainAddressBalances);
const isAssetType = checkChainType(ChainTypes.ChainAsset);
const isObjectsListType = checkChainType(ChainTypes.ChainObjectsList);
const isAccountsListType = checkChainType(ChainTypes.ChainAccountsList);
const isAssetsListType = checkChainType(ChainTypes.ChainAssetsList);

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

            constructor(props) {
                super(props);
                let prop_types_array = pairs(Component.propTypes);
                if(options && options.all_props) {
                    this.chain_objects = reject(Object.keys(this.props), (e) => e === "children" || e === "keep_updating" || e === "show_loader");
                    this.chain_accounts = [];
                    this.chain_key_refs = [];
                    this.chain_address_balances = [];
                    this.chain_assets = [];
                    this.chain_objects_list = [];
                    this.chain_accounts_list = [];
                    this.chain_assets_list = [];
                    this.required_props = [];
                    this.all_chain_props = this.chain_objects;
                } else {
                    this.chain_objects = prop_types_array.filter(flow(secondEl, isObjectType)).map(firstEl);
                    this.chain_accounts = prop_types_array.filter(flow(secondEl, isAccountType)).map(firstEl);
                    this.chain_key_refs = prop_types_array.filter(flow(secondEl, isKeyRefsType)).map(firstEl);
                    this.chain_address_balances = prop_types_array.filter(flow(secondEl, isAddressBalancesType)).map(firstEl);
                    this.chain_assets = prop_types_array.filter(flow(secondEl, isAssetType)).map(firstEl);
                    this.chain_objects_list = prop_types_array.filter(flow(secondEl, isObjectsListType)).map(firstEl);
                    this.chain_accounts_list = prop_types_array.filter(flow(secondEl, isAccountsListType)).map(firstEl);
                    this.chain_assets_list = prop_types_array.filter(flow(secondEl, isAssetsListType)).map(firstEl);
                    this.required_props = prop_types_array.filter(flow(secondEl, checkIfRequired)).map(firstEl);
                    this.all_chain_props = [...this.chain_objects,
                                            ...this.chain_accounts,
                                            ...this.chain_key_refs,
                                            ...this.chain_address_balances,
                                            ...this.chain_assets,
                                            ...this.chain_objects_list];
                }
                if(options && options.require_all_props){
                    this.required_props = this.all_chain_props;
                }
                this.dynamic_props = {}
                this.default_props = clone(Component.defaultProps) || {};
                for (let key in this.default_props) {
                    let value = this.default_props[key];
                    if (typeof(value) === "string" && value.indexOf("props.") === 0) {
                        this.dynamic_props[key] = get(this, value);
                    }
                }

                this.tempComponent = Component.defaultProps ? Component.defaultProps.tempComponent || null : null;

                //console.log("----- Wrapper constructor ----->", this.all_chain_props);
                this.update = this.update.bind(this);
                this.state = { resolved: false };
            }

            shouldComponentUpdate(nextProps, nextState){
                return !utils.are_equal_shallow(this.props, nextProps) ||
                       !utils.are_equal_shallow(this.state, nextState);
            }

            componentWillMount() {
                ChainStore.subscribe(this.update);
                this.update();
            }

            componentWillUnmount() {
                ChainStore.unsubscribe(this.update);
            }

            componentWillReceiveProps(next_props) {
                if(options && options.all_props) {
                    this.chain_objects = reject(Object.keys(next_props), (e) => e === "children" || e === "keep_updating" || e === "show_loader");
                    this.all_chain_props = this.chain_objects;
                    this.state = pick(this.state, this.chain_objects);
                }
                let props_obj = null;
                for(let k in this.dynamic_props) {
                    let selector = this.default_props[k];
                    if(!props_obj) props_obj = {props: next_props};
                    let cur_value  = get(this, selector);
                    let next_value = get(props_obj, selector);
                    if (next_value && next_value !== cur_value) {
                        this.dynamic_props[k] = get(props_obj, selector);
                    }
                }
                this.update(next_props);
            }

            update(next_props = null)
            {
                //let keep_updating = (options && options.keep_updating) || this.props.keep_updating;
                //if(!next_props && !keep_updating && this.state.resolved) return;

                let props = next_props || this.props;
                let new_state = {};
                let all_objects_counter = 0;
                let resolved_objects_counter = 0;
                for( let key of this.chain_objects )
                {
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getObject(prop);
                        if (new_obj === undefined && this.required_props.indexOf(key) === -1 && new_obj !== this.state[key]) new_state[key] = new_obj;
                        else if (new_obj && new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if (new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_accounts )
                {
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        if(prop[0] === "#" && Number.parseInt(prop.substring(1)))
                            prop = "1.2." + prop.substring(1);
                        let new_obj = ChainStore.getAccount(prop);
                        if (new_obj === undefined && this.required_props.indexOf(key) === -1 && new_obj !== this.state[key]) new_state[key] = new_obj;
                        else if (new_obj && new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if (new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_key_refs )
                {
                    let prop = props[key] || this.dynamic_prop[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getAccountRefsOfKey(prop);
                        if (new_obj === undefined && this.required_props.indexOf(key) === -1 && new_obj !== this.state[key]) new_state[key] = new_obj;
                        else if (new_obj && new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if (new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_address_balances )
                {
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getBalanceObjects(prop);
                        if (new_obj === undefined && this.required_props.indexOf(key) === -1 && new_obj !== this.state[key]) new_state[key] = new_obj;
                        else if (new_obj && new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if (new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_assets )
                {
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let new_obj = ChainStore.getAsset(prop);
                        if (new_obj === undefined && this.required_props.indexOf(key) === -1 && new_obj !== this.state[key]) new_state[key] = new_obj;
                        else if (new_obj && new_obj !== this.state[key]) new_state[key] = new_obj;
                        ++all_objects_counter;
                        if (new_obj !== undefined) ++resolved_objects_counter;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }
                for( let key of this.chain_objects_list )
                {
                    //console.log("-- Wrapper.update -->", this.chain_objects_list);
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let prop_prev_state = this.state[key];
                        let prop_new_state = [];
                        let changes = false;
                        if(!prop_prev_state || prop_prev_state.length !== prop.size) {
                            prop_prev_state = [];
                            changes = true;
                        }
                        let index = 0;
                        prop.forEach( obj_id => {
                            ++index;
                            //console.log("-- Wrapper.chain_objects_list item -->", obj_id, index);
                            if(obj_id) {
                                let new_obj = ChainStore.getObject(obj_id);
                                if(new_obj) ++resolved_objects_counter;
                                if(prop_prev_state[index] !== new_obj) {
                                    changes = true;
                                    prop_new_state[index] = new_obj;
                                } else {
                                    prop_new_state[index] = prop_prev_state[index];
                                }
                            }
                            ++all_objects_counter;
                        });
                        //console.log("-- Wrapper.chain_objects_list: ", prop_new_state);
                        if(changes) new_state[key] = prop_new_state;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }

                for( let key of this.chain_accounts_list )
                {
                    //console.log("-- Wrapper.update -->", this.chain_accounts_list);
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let prop_prev_state = this.state[key];
                        let prop_new_state = [];
                        let changes = false;
                        if(!prop_prev_state || prop_prev_state.length !== prop.size) {
                            prop_prev_state = [];
                            changes = true;
                        }
                        let index = 0;
                        prop.forEach( obj_id => {
                            //console.log("-- Wrapper.chain_accounts_list item -->", obj_id, index);
                            if(obj_id) {
                                let new_obj = ChainStore.getAccount(obj_id);
                                if(new_obj) ++resolved_objects_counter;
                                if(prop_prev_state[index] !== new_obj) {
                                    changes = true;
                                    prop_new_state[index] = new_obj;
                                } else {
                                    prop_new_state[index] = prop_prev_state[index];
                                }
                            }
                            ++index;
                            ++all_objects_counter;
                        });
                        //console.log("-- Wrapper.chain_accounts_list: ", prop_new_state);
                        if(changes) new_state[key] = prop_new_state;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }

                for( let key of this.chain_assets_list )
                {
                    //console.log("-- Wrapper.update -->", this.chain_assets_list);
                    let prop = props[key] || this.dynamic_props[key] || this.default_props[key];
                    if(prop) {
                        let prop_prev_state = this.state[key];
                        let prop_new_state = [];
                        let changes = false;
                        if(!prop_prev_state || prop_prev_state.length !== prop.size) {
                            prop_prev_state = [];
                            changes = true;
                        }
                        let index = 0;
                        prop.forEach( obj_id => {
                            ++index;
                            //console.log("-- Wrapper.chain_assets_list item -->", obj_id, index);
                            if(obj_id) {
                                let new_obj = ChainStore.getAsset(obj_id);
                                if(new_obj) ++resolved_objects_counter;
                                if(prop_prev_state[index] !== new_obj) {
                                    changes = true;
                                    prop_new_state[index] = new_obj;
                                } else {
                                    prop_new_state[index] = prop_prev_state[index];
                                }
                            }
                            ++all_objects_counter;
                        });
                        //console.log("-- Wrapper.chain_assets_list: ", prop_new_state);
                        if(changes) new_state[key] = prop_new_state;
                    } else {
                        if(this.state[key]) new_state[key] = null;
                    }
                }


                //console.log("----- Wrapper update ----->", this.all_chain_props, this.all_chain_props.length, all_objects_counter, resolved_objects_counter);
                if(all_objects_counter <= resolved_objects_counter) new_state.resolved = true;
                this.setState( new_state )
            }

            componentName() {
                let cf = Component.toString();
                return cf.substr(9, cf.indexOf('(') - 9);
            }

            render() {
                const props = omit(this.props, this.all_chain_props);

                //console.log("----- Wrapper render ----->", this.componentName(), this.props, this.state);
                for (let prop of this.required_props)  {
                    if(!this.state[prop]) {
                        if (typeof options !== "undefined" && options.show_loader) {
                            return <LoadingIndicator />
                        } else {
                            // returning a temp component of the desired type prevents invariant violation errors, notably when rendering tr components
                            // to use, specicy a defaultProps field of tempComponent: "tr" (or "div", "td", etc as desired)
                            return this.tempComponent ? React.createElement(this.tempComponent) : null;
                        }
                    }
                }
                //return <span className={this.state.resolved ? "resolved":"notresolved"}><Component {...props} {...this.state}/></span>;
                return <Component {...props} {...this.state}/>;
            }
        }

    }
}

@BindToChainState({all_props: true, require_all_props: true})
class Wrapper extends React.Component {
    render() {
        return <span className="wrapper">
            {this.props.children(this.props)}
        </span>;
    }
}

BindToChainState.Wrapper = Wrapper;

export default BindToChainState;
