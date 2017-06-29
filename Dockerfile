# Set the base image to Ubuntu with node and npm installed
FROM node:7

MAINTAINER Nikos Triantafyllou


# downgrade to node v6.10
RUN npm install -g n
RUN n 6.10.0

#install npm v4.5
#RUN npm install -g npm@4.5

#check node Version
RUN node --version
RUN npm -v

# Install PM2
RUN npm install -g pm2

RUN mkdir -p /var/www/dipSupMon

# Define working directory
WORKDIR /var/www/dipSupMon

ADD . /var/www/dipSupMon

RUN npm rebuild

RUN npm install

#COPY docker-entrypoint.sh /
#ENTRYPOINT ["/docker-entrypoint.sh"]

# Expose port
EXPOSE 5000

# Run app
CMD pm2 start --no-daemon  app.js
