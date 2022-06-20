FROM node:16.15-alpine3.16 as build
WORKDIR /app
COPY package.json ./
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm install \
  && npm run build

FROM node:16.15-alpine3.16
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist .
ENTRYPOINT ["node","app.js"]