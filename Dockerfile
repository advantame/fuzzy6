FROM --platform=linux/arm64 node:26-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# The build context can arrive with owner-only modes (a checkout under umask 077); the server runs as
# another user, so make what it reads readable here. (Done in this stage: a chmod in the runtime stage
# would write every file again as a layer of its own, and every ship would send them twice.)
# The media whose names carry their content's hash (voice, fonts, figures) move to a tree of their own
# with a fixed mtime: copied as a layer of their own, they come out byte for byte the same as long as
# they are, and a ship that changes only code sends that layer as nothing new.
RUN set -eu; \
    cd dist; \
    find assets -type f \( -name '*.opus' -o -name '*.woff2' -o -name '*.woff' -o -name '*.ttf' -o -name '*.png' \) \
      -exec sh -c 'for f; do mkdir -p "/media/dist/${f%/*}"; mv "$f" "/media/dist/$f"; done' sh {} +; \
    chmod -R a+rX /app/dist /app/server /media; \
    find /media -exec touch -h -d @0 {} +

# The server uses Node built-ins only, so the runtime stage can be the small image.
FROM --platform=linux/arm64 node:26-alpine AS runtime
WORKDIR /app
RUN mkdir -p /data && chown 10001:10001 /data
COPY --from=build /media/dist ./dist
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
USER 10001:10001
EXPOSE 8080
CMD ["node", "server/serve.mjs"]
