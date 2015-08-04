import alt from "alt-instance"

class NotificationActions {

    addNotification(notification) {
        notification = normalize(notification)
        this.dispatch(notification)
    }
    
    // Creating aliases: success, error, warning and info
    
    success(notification) {
        notification = normalize(notification, 'success')
        this.dispatch(notification)
    }
    
    error(notification) {
        notification = normalize(notification, 'error')
        this.dispatch(notification)
    }
    
    warning(notification) {
        notification = normalize(notification, 'warning')
        this.dispatch(notification)
    }
    
    info(notification) {
        notification = normalize(notification, 'info')
        this.dispatch(notification)
    }
}

export default alt.createActions(NotificationActions)

var normalize = (notification, level) => {
    if(typeof notification == 'string')
        notification = {message: notification}
    if(level)
        notification.level = level
    // Adjust the css position for notices.. bottom messages can't be seen
    //if(notification.level === "success" && ! notification.position)
    //    notification.position = 'br' //bottom right
    return notification
}
