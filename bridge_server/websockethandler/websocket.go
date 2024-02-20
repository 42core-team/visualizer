package websockethandler

import (
	"core/visualizer/socket"
	"log"

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

	conn, err := socket.InitSocket()
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
			_, err := socket.WriteToSocket(conn, msg)
			if err != nil {
				log.Println("socket write:", err)
				break
			}
		}
	}()

	go func() {
		for {
			msgSocket := make([]byte, 4096)

			_, err = socket.ReadFromSocket(conn, &msgSocket)
			if err != nil {
				log.Println("socket read:", err)
				break
			}

			if err = con.WriteMessage(mt, msgSocket); err != nil {
				log.Println("write:", err)
				break
			}
		}
	}()
	select {}
}
