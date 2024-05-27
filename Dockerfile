# Builder
FROM node:18-alpine as builder

#
WORKDIR /usr/app

# dependencies
COPY package.json package-lock.json ./

# install dependencies
RUN npm ci

# build configuration
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# sources to build
COPY src ./src
COPY libs ./libs

# build sources
RUN npm run build

# remove devDependencies
RUN npm prune --omit=dev

# Runner
FROM node:18-alpine as runner

# timezone
RUN apk --no-cache add tzdata && \
        cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
        echo "Asia/Seoul" > /etc/timezone && \
        apk del tzdata

# for express
ENV NODE_ENV=production

#
WORKDIR /usr/app

#
COPY --from=builder /usr/app/node_modules ./node_modules

#
COPY --from=builder /usr/app/dist ./dist

#
CMD node dist/main

#
EXPOSE 3000/tcp
