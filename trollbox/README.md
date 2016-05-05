## Trollbox server instructions

This is a very simple server using peerjs-server to provide a centralized connection point for trollbox peer discovery.

To get started, simply use the following commands:

```
npm install
npm install -g forever
npm install -g nodemon
npm start
```

By default this will launch a server on port 9000, without SSL. If you're using SSL or would like to modify the port, edit config.js.

## Nginx reverse proxy
In order to use Nginx for SSL, you need to add the following proxy location to your nginx.conf file in your SSL server block:

```
 location ~ /trollbox/? {
    access_log off;
    proxy_pass http://localhost:9000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # WebSocket support (nginx 1.4)
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;
}
```

