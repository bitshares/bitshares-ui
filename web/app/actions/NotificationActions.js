import alt from "alt-instance";

class NotificationActions {

    addNotification(notification) {
        notification = normalize(notification);
        return notification;
    }

    // Creating aliases: success, error, warning and info

    success(notification) {
        notification = normalize(notification, "success");
        return notification;
    }

    error(notification) {
        notification = normalize(notification, "error");
        return notification;
    }

    warning(notification) {
        notification = normalize(notification, "warning");
        return notification;
    }

    info(notification) {
        notification = normalize(notification, "info");
        return notification;
    }
}

export default alt.createActions(NotificationActions);

var normalize = (notification, level) => {
    if(typeof notification == "string")
        notification = {message: notification};
    if(level)
        notification.level = level;
    // Adjust the css position for notices.. bottom messages can't be seen
    //if(notification.level === "success" && ! notification.position)
    //    notification.position = 'br' //bottom right
    return notification;
};
