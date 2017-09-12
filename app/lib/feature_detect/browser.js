export default function(){
    let ua = navigator.userAgent.toLowerCase();

    if(ua.indexOf("firefox") > -1){ //is firefox
        return "firefox";
    } else if(ua.search("safari") >= 0 && ua.search("chrome") < 0){ //is safari
        return "safari";
    } else if(window.chrome){ //is chrome
        return "chrome";
    } else if(ua.indexOf("msie") > -1 || ua.match(/trident.*rv\:11\./)){ //is IE
        return "ie";
    } else if(ua.indexOf("opera") > -1){
        return "opera";
    } else {
        return ua;
    }
}
