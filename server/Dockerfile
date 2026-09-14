FROM node:20-slim AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# prisma generate only needs DATABASE_URL to be *present* (not valid/reachable) —
# it reads the schema and config, it doesn't connect to a database at this stage.
# The real value gets injected at container runtime via docker-compose/Railway env vars,
# which override this placeholder.
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]