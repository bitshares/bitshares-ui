import logging from "./src/logging"
import replApi from "./src/ReplApi"

console.log("Press Enter to see the prompt, press Ctrl+C several times to exit.")

/** Run the server and command-line interface in hot-deploy mode. */
describe('wallet server', () => {
    it('run_server', done => {
        replApi.cli()
        replApi.start()
        done()
    })
})
