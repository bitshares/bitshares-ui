import alt from "alt-instance"

class NotificationActions {

    addNotification(notification) {
        this.dispatch(notification)
    }
    
    // Creating aliases: success, error, warning and info
    
    success(notification) {
        notification.level = 'success'
        this.addNotification(notification)
    }
    
    error(notification) {
        notification.level = 'error'
        this.addNotification(notification)
    }
    
    warning(notification) {
        notification.level = 'warning'
        this.addNotification(notification)
    }
    
    info(notification) {
        notification.level = 'info'
        this.addNotification(notification)
    }
}

export default alt.createActions(NotificationActions)
