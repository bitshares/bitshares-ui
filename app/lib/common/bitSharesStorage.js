import localStorage from "./localStorage";
let bitSharesStorage = Component => {
    // Return Component if no localStorage is available
    if (!localStorage) return Component;

    let name =
        Component.displayName ||
        Component.constructor.displayName ||
        Component.constructor.name;

    class bitSharesStorage extends Component {
        componentWillMount() {
            this.setState(JSON.parse(localStorage.getItem(name)));
        }

        componentWillUpdate(nextProps, nextState) {
            localStorage.setItem(name, JSON.stringify(nextState));
        }
    }

    bitSharesStorage.displayName = name;

    return bitSharesStorage;
};

export default bitSharesStorage;
