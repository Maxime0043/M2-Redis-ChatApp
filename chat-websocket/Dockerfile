FROM node:18

WORKDIR /app

# On copie ça en premier puisque ça ne va pas souvent être modifié
COPY ./app/package.json ./app/package-lock.json ./

RUN npm install

COPY ./app/index.js ./app/app.js ./
COPY ./app/controllers/* ./controllers/
COPY ./app/middlewares/* ./middlewares/
COPY ./app/utils/* ./utils/

EXPOSE 3000

CMD [ "node", "index.js" ]