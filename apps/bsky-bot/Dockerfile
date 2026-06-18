FROM node:24-slim

WORKDIR /home/app

# Copy workspace manifests so npm understands the workspace structure
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/bsky-bot/package.json ./apps/bsky-bot/
COPY apps/seeder/package.json ./apps/seeder/
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=apps/bsky-bot

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

COPY packages/shared ./packages/shared
COPY apps/bsky-bot ./apps/bsky-bot

RUN groupadd -r app && useradd -rm -g app -G audio,video app \
    && chown -R app:app /home/app

USER app

WORKDIR /home/app/apps/bsky-bot

ENTRYPOINT ["npx", "tsx", "index.ts"]
