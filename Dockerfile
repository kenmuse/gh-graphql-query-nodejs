FROM node:16.15-alpine3.16 as build
WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./
RUN npm install
RUN npm run build

FROM node:16.15-alpine3.16
WORKDIR /usr
COPY package.json ./
RUN npm install --only=production
COPY --from=build /usr/dist .
CMD ["node","app.js"]