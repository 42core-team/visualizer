package main

import (
	"core/visualizer/env"
	"core/visualizer/websockethandler"
	"text/template"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Get("/sketch.js", func(c *fiber.Ctx) error {
		// Get the environment variable or use a default value
		socketServer := env.GetEnv("HOST", "127.0.0.1:3000")

		// Parse the JavaScript file as a template
		tmpl, err := template.ParseFiles("../public/sketch.js")
		if err != nil {
			return err
		}

		err = tmpl.Execute(c, map[string]string{
			"socket": socketServer,
		})
		if err != nil {
			return err
		}
		c.Set("Content-Type", "application/javascript")

		return c.SendStatus(fiber.StatusOK)
	})
	app.Static("/", "../public")

	app.Use("/ws", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client
		// requested upgrade to the WebSocket protocol.
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(websockethandler.HandleWebSocket))

	app.Listen(":" + env.GetEnv("PORT", "3000"))
}
