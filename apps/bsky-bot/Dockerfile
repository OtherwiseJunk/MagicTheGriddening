FROM node:24-slim AS builder

WORKDIR /home/app

COPY package*.json ./
RUN npm ci

COPY ./ ./
RUN npm run build

FROM node:24-slim AS runner

ENV NODE_ENV=production

WORKDIR /home/app

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && install -m 0755 -d /etc/apt/keyrings \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub \
       | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
       fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
       --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /home/app/dist ./dist

RUN groupadd -r app && useradd -rm -g app -G audio,video app \
    && chown -R app:app /home/app

USER app

ENTRYPOINT ["node", "dist/index.js"]
