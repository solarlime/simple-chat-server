FROM node:20-alpine AS build

WORKDIR /app

# Copy config files
COPY package.json yarn.lock ./

ARG yarn_version=3.6.4
RUN echo "nodeLinker: node-modules" > .yarnrc.yml \
    && corepack enable \
    && yarn set version $yarn_version \
    && yarn install --immutable

COPY ./dist ./dist

EXPOSE 3002

# Start the app using serve command
ENTRYPOINT [ "node", "/app/dist/bundle.js" ]
