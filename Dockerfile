FROM buildkite/puppeteer
ADD . /mrpc-server
WORKDIR /mrpc-server
RUN npm install
RUN node .
EXPOSE 3000