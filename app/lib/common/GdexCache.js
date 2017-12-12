import ss from "common/localStorage";
const session = new ss("__gdex__");

class GdexCache {

    getUserInfo(user_account){
        let user_infos = session.get(user_account, null);
        return user_infos?user_infos[user_account]: null;
    }

    cacheUserInfo(user_account, user_id, status) {
        let user_infos = session.get(user_account, {});
        if(user_infos!={}){
            user_infos[user_account] = {"user_id": user_id, "status": status};
            session.set(user_account, user_infos);
        }
    }
};

export default GdexCache;
