FROM node:24-bullseye-slim

# Copy local code to the container image
WORKDIR /usr/src/app
COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y openssl
RUN npm i
RUN npx prisma generate

# Run the app on entry
ENTRYPOINT [ "node", "--loader", "ts-node/esm", "main.ts" ]
