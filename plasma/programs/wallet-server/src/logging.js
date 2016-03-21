
// JSON.parse is smart enough to handle string values an error condition

global.INFO = JSON.parse( process.env.npm_package_config_log_info )
global.DEBUG = JSON.parse( process.env.npm_package_config_log_debug )
global.SQL_DEBUG = JSON.parse( process.env.npm_package_config_sql_debug )
