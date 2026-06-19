FROM node:20-bullseye AS protogen
WORKDIR /gen

RUN apt-get update && apt-get install -y unzip curl \
    && curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v25.1/protoc-25.1-linux-x86_64.zip \
    && unzip protoc-25.1-linux-x86_64.zip -d protoc \
    && curl -LO https://github.com/grpc/grpc-web/releases/download/1.5.0/protoc-gen-grpc-web-1.5.0-linux-x86_64 \
    && mv protoc-gen-grpc-web-1.5.0-linux-x86_64 /usr/local/bin/protoc-gen-grpc-web \
    && chmod +x /usr/local/bin/protoc-gen-grpc-web \
    && curl -L -o protobuf-javascript.tar.gz https://github.com/protocolbuffers/protobuf-javascript/releases/download/v3.21.4/protobuf-javascript-3.21.4-linux-x86_64.tar.gz \
    && tar -xzf protobuf-javascript.tar.gz -C /usr/local \
    && chmod +x /usr/local/bin/protoc-gen-js

COPY proto ./proto

RUN mkdir -p ./public/generated && \
    ./protoc/bin/protoc -I=./proto \
      --js_out=import_style=commonjs,binary:./public/generated \
      --grpc-web_out=import_style=commonjs,mode=grpcwebtext:./public/generated \
      ./proto/totalservice.proto

FROM node:20-bullseye AS bundle
WORKDIR /bundle
COPY frontend/public ./public
COPY --from=protogen /gen/public/generated ./public/generated
RUN npm init -y >/dev/null \
    && npm install --no-save google-protobuf grpc-web esbuild \
    && npx esbuild ./public/script.js --bundle --outfile=./public/script.bundle.js --format=iife

FROM nginx:1.27-alpine
COPY --from=bundle /bundle/public/ /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80