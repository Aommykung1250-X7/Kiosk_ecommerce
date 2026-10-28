FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force \
    && mkdir -p logs uploads/products uploads/screensavers uploads/contact \
    && chown -R node:node logs uploads

COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node assets/ditc_logo.png ./assets/ditc_logo.png

USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
