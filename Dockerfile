FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
COPY . /usr/src/app/

RUN npm install
RUN npm run build
RUN npm install -g serve
CMD serve -s build/dist -p 3500


# FROM node:6

# # Install nginx
# RUN apt-get update \
#   && apt-get install -y nginx --no-install-recommends \
#   && apt-get clean \
#   && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# RUN npm install -g cross-env

# # We copy the code from the docker-compose-yml
# # RUN git clone https://github.com/bitshares/bitshares-ui.git /bitshares-ui
# CMD mkdir /bitshares-ui
# WORKDIR /bitshares-ui

# ADD package.json .
# RUN cross-env npm install --env.prod

# EXPOSE 80

# ## Copying default configuration
# ADD conf/nginx.conf /etc/nginx/nginx.conf
# ADD conf/start.sh /start.sh
# RUN chmod a+x /start.sh

# ## Entry point
# ENTRYPOINT ["/start.sh"]
