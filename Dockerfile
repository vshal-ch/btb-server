FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx knex migrate:latest && node src/server.js"]
