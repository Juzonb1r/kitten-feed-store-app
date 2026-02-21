# build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
