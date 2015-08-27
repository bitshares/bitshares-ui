import React from "react"
import connectToStores from "alt/utils/connectToStores"

@connectToStore(BackupStore)
export default class Backup extends React.Component {
    
    constructor() {
        super()
        this.state = {
            
        }
    }
    
    componentWillMount() {
        BackupActions.mount()
    }
    
    componentWillUnmount() {
        BackupActions.unmount()
    }
    
    render() {
        return <div>
            
        </div>
    }
    
    

}