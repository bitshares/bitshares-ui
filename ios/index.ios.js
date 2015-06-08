var React = require('react-native');
var {
    AppRegistry,
    StyleSheet,
    Text,
    TextInput,
    View,
    ScrollView,
    ListView,
    TouchableHighlight,
    NavigatorIOS } = React;

var AccountStore = require("stores/AccountStore.js");
var AccountActions = require("stores/AccountActions.js");


var Graphene = React.createClass({
    render: function () {
        return (
            <NavigatorIOS
                style={styles.nav_container}
                initialRoute={{ title: 'Graphene iOS GUI', component: AccountsList }}/>
        );
    }
});

var AccountsList = React.createClass({
    getInitialState: function () {
        this.store = AccountStore;
        var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        var accounts = AccountStore.getState().accounts;
        // .map below didn't work for me - returning initial object
        //var accounts_array = accounts.map(a => { return a.get("name")});
        var accounts_array = [];
        accounts.forEach(a => accounts_array.push(a.get("name")));
        return {
            dataSource: ds.cloneWithRows(accounts_array),
            new_account_name_text: ""
        };
    },

    componentWillMount: function () {
        if (this.store) this.store.listen(this.onChange);
    },

    componentWillUnmount: function () {
        if (this.store) this.store.unlisten(this.onChange);
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        return this.props !== nextProps || this.state !== nextState;
    },

    onChange: function () {
        if (this.store) this.setState(this.getInitialState());
    },

    addAccount: function (account_name) {
        if (account_name == "") return;
        AccountActions.addAccount(account_name);
    },

    selectAccount: function (account_name) {
        this.props.navigator.push({
            component: AccountScreen,
            passProps: {account_name}
        });
    },

    render: function () {
        return (
            <View style={styles.container}>
                <ListView style={styles.list_view} dataSource={this.state.dataSource} renderRow={this._renderRow}/>
                <View style={styles.text_input_container}>
                    <TextInput
                        value={this.state.new_account_name_text}
                        autoCapitalize="none"
                        placeholder="New Account Name"
                        autoCorrect={false}
                        onSubmitEditing={ (event) => this.addAccount(event.nativeEvent.text) }
                        style={styles.text_input}/>
                </View>
            </View>
        );
    },

    _renderRow: function (account_name) {
        return (
            <AccountCell
                onSelect={() => this.selectAccount(account_name)}
                account_name={account_name}/>
        );
    }

});

var AccountCell = React.createClass({
    render: function () {
        return (
            <View>
                <TouchableHighlight onPress={this.props.onSelect}>
                    <View style={styles.row}>
                        <View style={styles.text}>
                            <Text>
                                {this.props.account_name}
                            </Text>
                        </View>
                    </View>
                </TouchableHighlight>
                <View style={styles.separator}/>
            </View>
        );
    }
});

var AccountScreen = React.createClass({
    render: function () {
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.welcome}>
                    {this.props.account_name}
                </Text>
            </ScrollView>
        );
    }
});

var styles = StyleSheet.create({
    nav_container: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    list_view: {
        flex: 1,
    },
    row: {
        alignItems: 'center',
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 5,
    },
    separator: {
        height: 1,
        backgroundColor: '#CCCCCC',
    },
    text: {
        flex: 1,
    },
    welcome: {
        flex: 1,
        color: "#ff0000",
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    text_input_container: {},
    text_input: {
        height: 26,
        borderWidth: 0.5,
        borderColor: '#0f0f0f',
        padding: 4,
        flex: 1,
        fontSize: 13
    }
});

AppRegistry.registerComponent('Graphene', () => Graphene);

module.exports = Graphene;
