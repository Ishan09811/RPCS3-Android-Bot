
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x run_bot.sh

CMD ["sh", "./run_bot.sh"]
