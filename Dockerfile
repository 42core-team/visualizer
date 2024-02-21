FROM golang:latest

WORKDIR /app

COPY bridge_server/ /app/
COPY public/ /app/public/

RUN go mod download
RUN go build -o /bridge_server

CMD [ "/bridge_server" ]
