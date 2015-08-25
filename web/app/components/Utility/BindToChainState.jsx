import React from "react";
import _ from "lodash";
import ChainStore from "api/chain.js";
import ChainTypes from "./ChainTypes";

/**
 * @brief provides automatic fetching and updating of chain data
 *
 * After applying this decorator to component any property of a type from ChainTypes
 * specified in component's propTypes will be automatically converted from object or account id
 * into a state object that is either null or an Immutable object.   The
 * Immutable object will automatically be updated anytime it changes on the
 * blockchain.
 *
 * In addition to automatically fetching/subscribing to object IDs, this
 * decorator will also automatically fetch/subscribe to the full accounts
 * prop type is ChainAccount or ChainFullAccount
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
const isFullAccountType = checkChainType(ChainTypes.ChainFullAccount);
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
                let prop_types_array = _.pairs(Component.propTypes);
                this.chain_objects = prop_types_array.filter(_.flow(secondEl, isObjectType)).map(firstEl);
                this.chain_accounts = prop_types_array.filter(_.flow(secondEl, isAccountType)).map(firstEl);
                this.chain_full_accounts = prop_types_array.filter(_.flow(secondEl, isFullAccountType)).map(firstEl);
                this.required_props = prop_types_array.filter(_.flow(secondEl, checkIfRequired)).map(firstEl);
                console.log("----- Wrapper constructor ----->", this.required_props);
                this.all_chain_props = [...this.chain_objects, ...this.chain_accounts, ...this.chain_full_accounts];
                this.update = this.update.bind(this);
                this.state = {};
            }

            getChangedProps(next_props) {
                return this.all_chain_props.filter( key => next_props[key] !== this.props[key]);
            }

            unsubscribeFromProps(props) {
                for( let key of props )
                    ChainStore.unsubscribeFromObject( this.props[key], this.update )
            }

            shouldComponentUpdate(nextProps, nextState){
                if(this.getChangedProps(nextProps).length > 0) return true;
                for( let key of this.all_chain_props ) {
                    console.log("-- shouldComponentUpdate -->", key, nextState[key], this.state[key]);
                    if (nextState[key] !== this.state[key]) return true;
                }
                return false;
            }

            componentWillMount() {
                this.update(null, this.props, null);
            }

            componentWillUnmount() {
                this.unsubscribeFromProps(this.all_chain_props);
            }

            componentWillReceiveProps( next_props ) {
                let changed_props = this.getChangedProps(next_props);
                console.log(" ----- componentWillReceiveProps all_chain_objs_changed ----->", changed_props);
                if(changed_props.length === 0) return;
                this.unsubscribeFromProps(changed_props);
                this.update(null, next_props, changed_props);
            }

            update(res = null, props = null, props_to_update = null)
            {
                if(!props) props = this.props;
                let new_state = {};
                for( let key of this.chain_objects )
                {
                    if(props_to_update === null || props_to_update.includes(key)) {
                        let new_obj = ChainStore.getObject(props[key], this.update, true);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                    }
                }
                for( let key of this.chain_accounts )
                {
                    if(props_to_update === null || props_to_update.includes(key)) {
                        let new_obj = ChainStore.getAccount(props[key], this.update);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                    }
                }
                for( let key of this.chain_full_accounts )
                {
                    if(props_to_update === null || props_to_update.includes(key)) {
                        let new_obj = ChainStore.getAccount(props[key], this.update, true);
                        if(new_obj !== this.state[key]) new_state[key] = new_obj;
                    }
                }
                console.log("----- Wrapper update ----->", props_to_update, this.state, new_state);
                this.setState( new_state )
            }

            render() {
                const props = _.omit(this.props, this.all_chain_props);
                console.log("----- Wrapper render ----->", props, this.state, this.required_props);
                for(let prop of this.required_props) if(!this.state[prop]) return null;
                return <Component {...props} {...this.state}/>;
            }
        }

    }
}

export default BindToChainState;
