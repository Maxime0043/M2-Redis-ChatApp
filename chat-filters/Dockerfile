FROM node:18

WORKDIR /app

# On copie ça en premier puisque ça ne va pas souvent être modifié
COPY ./app/package.json ./app/package-lock.json ./

RUN npm install

COPY ./app/index.js ./app/filters.js ./app/insults.json ./

CMD [ "node", "index.js" ]