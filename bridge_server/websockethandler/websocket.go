package websockethandler

import (
	"log"

	"github.com/gofiber/contrib/websocket"
)

func HandleWebSocket(con *websocket.Conn) {
	// con.Locals is added to the *websocket.Conn
	log.Println(con.Locals("allowed"))  // true
	log.Println(con.Params("id"))       // 123
	log.Println(con.Query("v"))         // 1.0
	log.Println(con.Cookies("session")) // ""

	// websocket.Conn bindings https://pkg.go.dev/github.com/fasthttp/websocket?tab=doc#pkg-index
	var (
		mt  int
		msg []byte
		err error
	)
	for {
		if mt, msg, err = con.ReadMessage(); err != nil {
			log.Println("read:", err)
			break
		}
		log.Printf("recv: %s", msg)

		if err = con.WriteMessage(mt, msg); err != nil {
			log.Println("write:", err)
			break
		}
	}
}
