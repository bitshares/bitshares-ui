import alt from "alt-instance"

class NotificationActions {

    addNotification(notification) {
        this.dispatch(notification)
    }
    
    // Creating aliases: success, error, warning and info
    
    success(notification) {
        notification = normalize(notification)
        notification.level = 'success'
        notification.position = 'br' //bottom right
        this.dispatch(notification)
    }
    
    error(notification) {
        notification = normalize(notification)
        notification.level = 'error'
        this.dispatch(notification)
    }
    
    warning(notification) {
        notification = normalize(notification)
        notification.level = 'warning'
        this.dispatch(notification)
    }
    
    info(notification) {
        notification = normalize(notification)
        notification.level = 'info'
        this.dispatch(notification)
    }
}

export default alt.createActions(NotificationActions)

var normalize = notification => {
    if(typeof notification == 'string')
        notification = {message: notification}
    return notification
}
