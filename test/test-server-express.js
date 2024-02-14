/* eslint-disable no-console */
const express = require("express")
const { join } = require("path")
const { createClient } = require("redis")
const app = new express()
const { createSSEManager} = require("../SSEManager")
const RedisEventsAdapter = require("../SSEManager/dist/adapters/events/RedisEventsAdapter")
const ExpressHttpAdapter = require("../SSEManager/dist/adapters/https/ExpressHttpAdapter")

void (async() => {

  const redisClient = createClient({
    url: "redis://redis:6379"
  })

  redisClient.connect()
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
    console.log("broadcasting")
    await sseManager.broadcast("test-room", { data: PORT })
  }, 1000)

  const {PORT, ADDRESS}  = process.env
  
  app.use(express.static(join(__dirname, "./public")))

  app.get("/close/:id", async(req, res) => {
    await sseManager.closeSSEStream(req.params.id)
    res.sendStatus(200)
  })

  app.get("/stream", async(req, res) => {
    console.log("creating")
    const sseStream = await sseManager.createSSEStream(res)
    console.log("created")

    sseStream.broadcast({ data: "Joining you to test-room" })
    // sseStream.broadcast("ciao")
    // await sseManager.addSSEStreamToRoom(sseStream.id, "test-room")
    console.log("adding")
    await sseStream.addToRoom("test-room")
    console.log("added")
  })

  app.get("/info", (req, res) => {
    res.json({
      rooms: Object.keys(sseManager.rooms),
      streams: Object.keys(sseManager.sseStreams)
    })
  })

  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
})().catch(console.error)
