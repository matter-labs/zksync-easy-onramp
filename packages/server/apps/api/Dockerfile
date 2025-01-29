FROM node:20-alpine AS base-stage

WORKDIR /usr/src/app

# Copy necessary files
COPY --chown=node:node .npmrc .npmrc
COPY --chown=node:node package*.json ./
COPY --chown=node:node ./packages/api/package*.json ./packages/api/
COPY --chown=node:node ./packages/common/package*.json ./packages/common/

# Build stage
FROM base-stage AS build-stage

# Set environment variables
ENV NODE_ENV=development

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code for api and common
COPY --chown=node:node ./packages/api/. ./packages/api
COPY --chown=node:node ./packages/common/. ./packages/common

# Remove .npmrc for security
RUN rm -f .npmrc

# Build the api
RUN npm run build -w=api

FROM base-stage AS production-stage

# Copy built files from the build-stage
COPY --chown=node:node --from=build-stage /usr/src/app/packages/api/dist ./packages/api/dist
COPY --chown=node:node --from=build-stage /usr/src/app/packages/common/dist ./packages/common/dist

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Remove .npmrc for security
RUN rm -f .npmrc

# Set environment variables and ports
ARG NODE_ENV=production
ARG PORT=3020
ARG METRICS_PORT=3005

ENV NODE_ENV $NODE_ENV
ENV PORT $PORT
ENV METRICS_PORT $METRICS_PORT

# Expose ports
EXPOSE $PORT $METRICS_PORT 9229 9230

# Switch to non-root user for better security
USER node

# Healthcheck configuration
HEALTHCHECK --interval=30s --timeout=3s --retries=5 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Run the application
CMD [ "node", "packages/api/dist/apps/api/apps/api/src/main.js" ]