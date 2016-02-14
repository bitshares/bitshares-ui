import { Map, List } from "immutable"

export default class RateLimit {

    /**
        duration: 60 * 60 * 1000, // 1 hour
        max: npm_package_config_network_ip_requests_per_hour
    */
    constructor(config) {
        this.duration = req(config.duration, "config.duration")
        this.max_requests_per_duration = req(config.max, "config.max")
        this.hits = Map()
    }
    
    over(key) {
        req(key, 'key')
        
        let event = Date.now()
        let expired = event - this.duration

        this.hits = this.hits
        
            // Add this event
            .update(key, List(), events => events.push(event))
            
            // Remove expired events
            .update(key, events => events.filter(event => event > expired))
            
            // Remove "other" keys that no longer have any events
            .filterNot( keys => keys.isEmpty())
        
        if(global.INFO) console.log("INFO\tRateLimit\t", key, "\t",
            this.hits.get(key).count(), "of", this.max_requests_per_duration)
        
        return this.hits.get(key).count() > this.max_requests_per_duration
    }
    
}

// required
function req(data, field_name) {
    if( data == null ) throw new Error("Missing required field: " + field_name)
    return data
}