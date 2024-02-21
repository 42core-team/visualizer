package socket

import (
	"core/visualizer/env"
	"log"
	"net"
)

func InitSocket() (net.Conn, error) {
	conn, err := net.Dial("tcp", env.GetEnv("SOCKET_SERVER", "host.docker.internal:4242"))
	log.Println(env.GetEnv("SOCKET_SERVER", "host.docker.internal:4242"))
	return conn, err
}

func CloseSocket(conn net.Conn) {
	conn.Close()
}

func WriteToSocket(conn net.Conn, data []byte) (int, error) {
	return conn.Write(data)
}

func ReadFromSocket(conn net.Conn, data *[]byte) (int, error) {
	return conn.Read(*data)
}
