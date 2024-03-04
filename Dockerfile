FROM golang:latest

WORKDIR /app

COPY bridge_server/ /app/bridge_server/
COPY public/ /app/public/

WORKDIR /app/bridge_server
RUN go mod download
RUN go build -o /bridge_server

WORKDIR /app
CMD [ "/bridge_server" ]
