import logging from "./src/logging"
import createServer from "./src/server"

try {
    createServer()
} catch(error) {
    console.error("ERROR\tindex\tcreate server\t", error, 'stack', error.stack)
}