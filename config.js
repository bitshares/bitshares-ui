const env = process.env.NODE_ENV || "development";
const debug = env === "development";

const config = {
    env,
    debug,
    support: {
        url: process.env.API_SUPPORT_BASE || "http://localhost:3000"
    }
};

export default config;
