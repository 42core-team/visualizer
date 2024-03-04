package websockethandler

import (
	"bytes"
	"core/visualizer/socket"
	"log"
	"strings"

	"github.com/gofiber/contrib/websocket"
)

func HandleWebSocket(con *websocket.Conn) {
	// con.Locals is added to the *websocket.Conn
	// log.Println(con.Locals("allowed"))  // true
	// log.Println(con.Params("id"))       // 123
	// log.Println(con.Query("v"))         // 1.0
	// log.Println(con.Cookies("session")) // ""

	// websocket.Conn bindings https://pkg.go.dev/github.com/fasthttp/websocket?tab=doc#pkg-index
	var (
		mt  int
		msg []byte
		err error
	)

	socketCon, err := socket.InitSocket()
	if err != nil {
		log.Println("Error connecting to socket server")
		return
	}

	go func() {
		for {
			if mt, msg, err = con.ReadMessage(); err != nil {
				log.Println("read:", err)
				break
			}
			// log.Printf("recv: %s", msg)
			_, err := socket.WriteToSocket(socketCon, msg)
			if err != nil {
				log.Println("socket write:", err)
				break
			}
		}
	}()

	go func() {
		for {
			var buf bytes.Buffer
			tmp := make([]byte, 2048) // temporary buffer

			for {
				n, err := socket.ReadFromSocket(socketCon, &tmp)
				if err != nil {
					log.Println("socket read:", err)
					return
				}
				buf.Write(tmp[:n]) // write the data to the buffer
				if strings.HasSuffix(buf.String(), "\n") {
					break
				}
			}

			lines := strings.Split(buf.String(), "\n")
			len_lines := len(lines)
			lastLine := lines[0]
			if len_lines > 1 {
				lastLine = lines[len_lines-2]
			}

			if err = con.WriteMessage(mt, []byte(lastLine)); err != nil {
				log.Println("write:", err)
				break
			}
		}
	}()
	select {}
}
