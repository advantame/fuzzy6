FROM --platform=linux/arm64 node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The server uses Node built-ins only, so the runtime stage can be the small image.
FROM --platform=linux/arm64 node:24-alpine AS runtime
WORKDIR /app
RUN mkdir -p /data && chown 10001:10001 /data
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
# The build context can arrive with owner-only modes (a checkout under umask 077);
# the server runs as another user, so make what it reads readable here.
RUN chmod -R a+rX /app
USER 10001:10001
EXPOSE 8080
CMD ["node", "server/serve.mjs"]
