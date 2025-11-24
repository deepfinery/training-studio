# syntax=docker/dockerfile:1.6
FROM node:20-bullseye AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3050
CMD ["npm", "run", "start"]
