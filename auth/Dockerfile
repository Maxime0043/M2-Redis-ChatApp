FROM node:18

WORKDIR /api

EXPOSE 3001

COPY ./package.json ./package-lock.json ./

RUN npm install

COPY ./app.mjs .

CMD ["node", "app.mjs"]
