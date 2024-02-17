FROM golang:latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o /bridge_server

EXPOSE 3000

CMD [ "/bridge_server" ]
