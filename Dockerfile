FROM node:16-slim
ADD . /mrpc-server
WORKDIR /mrpc-server
RUN npm install
RUN node .
EXPOSE 3000