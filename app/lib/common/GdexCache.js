import ss from "common/localStorage";
const session = new ss("__gdex__user_");

class GdexCache {

    getUserInfo(user_account){
        let user_info = session.get(user_account, null);
        if(!user_info) return null;
        let cur_time = Math.floor(new Date().getTime()/1000);
        // User info expire time set to 1 day
        if(Math.abs(user_info.ctime-cur_time) > 86400){
            session.remove(user_account);
            return null;
        }
        return user_info;
    }

    cacheUserInfo(user_account, user_id, status) {
        let user_info = session.get(user_account, {});
        if(user_info!={}){
            user_info = {"user_id": user_id, "status": status,"ctime": Math.floor(new Date().getTime()/1000)};
            session.set(user_account, user_info);
        }
    }

    delUserInfo(user_account){
        if(session.has(user_account)) session.del(user_account);
    }

}

export default GdexCache;