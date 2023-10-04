/* eslint-disable no-console */
const express = require("express")
const { createClient } = require("redis")
const { join } = require("path")
const app = new express()
const { createSSEManager, ExpressHttpAdapter, RedisEventsAdapter } = require("../SSEManager")

void (async() => {
  const redisClient = createClient({
    url: "redis://redis:6379"
  })

  await redisClient.connect()

  const redisSubscriber = redisClient.duplicate()
  await redisSubscriber.connect()

  const sseManager = await createSSEManager({
    httpAdapter: new ExpressHttpAdapter(),
    eventsAdapter: new RedisEventsAdapter({
      redisClient,
      redisSubscriber
    })
  })

  setInterval(async() => {
    await sseManager.broadcast("test-room", { data: PORT })
  }, 1000)

  const { PORT } = process.env

  app.use(express.static(join(__dirname, "./public")))

  app.get("/close/:id", async(req, res) => {
    await sseManager.closeSSEStream(req.params.id)
    res.sendStatus(200)
  })

  app.get("/stream", async(req, res) => {
    const sseStream = await sseManager.createSSEStream(res)
    // sseStream.broadcast("ciao")
    // await sseManager.addSSEStreamToRoom(sseStream.id, "test-room")
    await sseStream.addToRoom("test-room")
  })

  app.get("/info", (req, res) => {
    res.json({
      rooms: Object.keys(sseManager.rooms),
      streams: Object.keys(sseManager.sseStreams)
    })
  })

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
})().catch(console.error)
