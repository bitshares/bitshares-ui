openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout server.key -out server.crt -subj "/CN=example.com" \
  -addext "subjectAltName=DNS:example.com,DNS:example.net,IP:127.0.0.1"
