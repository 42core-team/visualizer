FROM golang:latest

WORKDIR /app

COPY . .

RUN go mod download
RUN go build -o /bridge_server

CMD [ "/bridge_server" ]
