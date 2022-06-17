FROM node:16.14.2-alpine as build
WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build

FROM node:16.14.2-alpine
WORKDIR /usr
COPY package.json ./
RUN npm install --only=production
COPY --from=build /usr/dist .
#RUN npm install pm2 -g
CMD ["node","app.js"]