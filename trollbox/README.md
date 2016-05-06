## Trollbox server instructions

This is a very simple server using peerjs-server to provide a centralized connection point for trollbox peer discovery.

To get started, simply type the following commands:

```
npm install
npm install -g forever
npm start
```

By default this will launch a server on port 9000, without SSL. If you're using SSL or would like to modify the port, edit config.js. The SSL is `not` necessary if you're using a reverse proxy as described below for nginx.

## Nginx reverse proxy
In order to use Nginx as a reverse proxy, you need to add the following proxy location to your nginx.conf file in your server block. To use with SSL, simply add this in your SSL server block.

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
## Production
For production you can use the forever script:

```
npm run forever
```
This will launch the server using forever.js, which will automatically restart the server if it crashes. Some useful commands for forever, to be used in a terminal:

```
forever list
forever stop <process>
forever restart <process>
```
