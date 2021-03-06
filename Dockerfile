FROM node:16
ENV application_path default_value
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD node ${application_path}