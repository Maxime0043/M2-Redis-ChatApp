run-api:
	EXPRESS_PORT=3001 \
		MONGO_HOST=localhost \
		REDIS_HOST=redis \
    REDIS_PORT=6379 \
    SESSION_MAX_AGE=3600 \
		node app.mjs

run-db:
	docker run \
		-d \
		-p 27017:27017 \
		-v mondo-demo:/data/db \
		mongo:latest

run-redis:
	docker run \
		-d \
		-p 6379:6379 \
		redis

register:
	http :3000/register \
		username=remiremi \
		password=12341234 \
		email=remi@remi.com

login:
	http :3000/login \
		email=remi@remi.com \
		password=12341234 

build:
	docker compose \
		-f docker-compose.dev.yml \
		build

up:
	docker compose \
		-f docker-compose.dev.yml \
		up \
		-d

down:
	docker compose \
		-f docker-compose.dev.yml \
		down