FROM docker.n8n.io/n8nio/n8n:2.0.0

USER root

# Install Chrome dependencies and Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    glib \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    ttf-liberation \
    font-noto-emoji \
    pandoc

# Tell Puppeteer to use installed Chrome instead of downloading it
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_PATH=/usr/local/lib/node_modules

# Install n8n-nodes-puppeteer in a permanent location
RUN mkdir -p /opt/n8n-custom-nodes && \
    cd /opt/n8n-custom-nodes && \
    npm install n8n-nodes-puppeteer && \
    chown -R node:node /opt/n8n-custom-nodes

# Install packages for Code node globally so VM2 can find them
RUN npm install -g \
    docxtemplater@3.5.2 \
    open-docxtemplater-image-module \
    pizzip \
    image-size

# Also install in /home/node/node_modules for VM2 access
RUN mkdir -p /home/node/node_modules && \
    cd /home/node && \
    npm install --prefix /home/node \
    docxtemplater@3.5.2 \
    open-docxtemplater-image-module \
    pizzip \
    image-size && \
    chown -R node:node /home/node/node_modules

# Also install in /opt/custom-packages for backup access
RUN mkdir -p /opt/custom-packages && \
    cd /opt/custom-packages && \
    npm install \
    docxtemplater@3.5.2 \
    open-docxtemplater-image-module \
    pizzip \
    image-size && \
    chown -R node:node /opt/custom-packages

# Install base n8n nodes so runner/main process can resolve node types like dateTimeTool
RUN cd /opt/custom-packages && \
    npm install n8n-nodes-base @n8n/nodes-base || true && \
    chown -R node:node /opt/custom-packages

# Also install n8n-nodes-base into /home/node for VM2 and runner access
RUN mkdir -p /home/node/node_modules && \
    cd /home/node && \
    npm install --prefix /home/node n8n-nodes-base @n8n/nodes-base || true && \
    chown -R node:node /home/node/node_modules

# Copy our custom entrypoint
COPY docker-custom-entrypoint.sh /docker-custom-entrypoint.sh
RUN chmod +x /docker-custom-entrypoint.sh && \
    chown node:node /docker-custom-entrypoint.sh

# Switch to node user for runtime
USER node

ENTRYPOINT ["/docker-custom-entrypoint.sh"]