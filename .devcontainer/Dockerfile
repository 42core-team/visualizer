FROM golang:latest

# Set the working directory
WORKDIR /go/src

# Create a dummy Go module
RUN go mod init example.com/dummy

# Install postgresql-client
ENV PYTHONUNBUFFERED 1

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client

# Install Go tools
RUN go install golang.org/x/tools/gopls@latest

RUN go get github.com/lib/pq

RUN go get -u github.com/gorilla/mux

# Install Hasura CLI
RUN curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

# Install MinIO client
RUN curl https://dl.min.io/client/mc/release/linux-amd64/mc \
  --create-dirs \
  -o $HOME/minio-binaries/mc
RUN chmod +x $HOME/minio-binaries/mc
RUN export PATH=$PATH:$HOME/minio-binaries/
