FROM node:20-slim

# Install Playwright deps
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/scraper/package.json ./apps/scraper/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Install Playwright browser
RUN pnpm --filter scraper exec playwright install chromium

# Copy source
COPY packages/shared ./packages/shared
COPY apps/scraper ./apps/scraper

# Build
RUN pnpm --filter shared build
RUN pnpm --filter scraper build

CMD ["pnpm", "--filter", "scraper", "start"]
