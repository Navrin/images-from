FROM node:10

# Dependency caching

RUN mkdir -p /app/images-from-client
RUN mkdir -p /app/images-from-server

WORKDIR /app/images-from-client
COPY ./images-from-client/package.json .
COPY ./images-from-client/yarn.lock .

WORKDIR /app/images-from-server
COPY ./images-from-server/package.json .
COPY ./images-from-server/yarn.lock .

RUN yarn
WORKDIR /app/images-from-client
RUN yarn


WORKDIR /app
COPY . .

WORKDIR /app/images-from-client
RUN yarn build

WORKDIR /app/images-from-server
RUN yarn build

CMD ["node", "/app/images-from-server/build/index.js"]