Generate server-side token (with optional payload) which may be emailed or QR encoded then verified on the server.  Tokens can be expired.

```js
import {createToken, checkToken} from "@graphene/time-token"`
```

# Configure
Update `./.npmrc` if you need to change something:
```sh
# Tokens have the time in them, expire_min is tested when verifying
@graphene/time-token:expire_min = 10
```

* [Index](./index.js)