import React, {Component} from "react"
import ResolveLinkedAccounts from "components/Utility/ComponentTest"

export default class ComponentTest extends Component {
    
    render() {
        return (
            <ResolveLinkedAccounts>
                <MyList/>
            </ResolveLinkedAccounts>
        )
    }

}

class MyList extends Component {
    
    render() {
        return <span>hi</span>
    }
}