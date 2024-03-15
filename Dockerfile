# Shared base stage
FROM node:20.11.1-alpine
WORKDIR /observeable
RUN npm i -g ts-node
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
EXPOSE 3001

CMD [ "ts-node", "index.ts" ]
