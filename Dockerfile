FROM node:18
WORKDIR /app
copy package*.json
RUN npm install
copy . .
EXPOSE 5432
CMD ["node","server.js"]
