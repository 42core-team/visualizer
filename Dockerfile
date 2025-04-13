# Build stage
FROM golang:latest AS builder

WORKDIR /app

COPY . .

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /bridge_server

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy only the binary from the builder stage
COPY --from=builder /bridge_server /app/bridge_server

# Add necessary certificates for HTTPS
RUN apk --no-cache add ca-certificates

CMD [ "/app/bridge_server" ]
