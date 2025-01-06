package socket

import (
	"core/visualizer/env"
	"net"
	"time"
)

func InitSocket() (net.Conn, error) {
	conn, err := net.DialTimeout("tcp", env.GetEnv("SOCKET_SERVER", "host.docker.internal:4242"), time.Duration(time.Millisecond*500))
	return conn, err
}

func CloseSocket(conn net.Conn) {
	conn.Close()
}

func WriteToSocket(conn net.Conn, data []byte) (int, error) {
	conn.SetWriteDeadline(time.Now().Add(time.Duration(time.Millisecond * 500)))
	return conn.Write(data)
}

func ReadFromSocket(conn net.Conn, data *[]byte) (int, error) {
	conn.SetReadDeadline(time.Now().Add(time.Duration(time.Millisecond * 500)))
	return conn.Read(*data)
}
