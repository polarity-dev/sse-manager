/* eslint-disable no-console */
const {readFileSync} = require('fs');
const { join } = require("path")
const fastify = require('fastify');
const postgres = require('postgres');
const fastifyApp = new fastify({ logger: true })
const { createSSEManager} = require("../SSEManager")
const PostgresEventsAdapter = require("../SSEManager/dist/adapters/events/postgresEventsAdapter")
const FastifyHttpAdapter = require("../SSEManager/dist/adapters/https/fastifyHttpAdapter")

void (async() => {

  const db =postgres({
    host : "postgres",
    user : "postgres",
    port : 5432,
    password : "12345678",
    database : "postgres"
  })

  const sseManager = await createSSEManager({
    httpAdapter: new FastifyHttpAdapter(),
    eventsAdapter: new PostgresEventsAdapter(db)
  })

  setInterval(async() => {
    console.log("broadcasting")
    await sseManager.broadcast("test-room", { data: PORT })
  }, 1000)

  const {PORT, ADDRESS}  = process.env

  console.log(PORT)

  fastifyApp.get("/", (req, res) => {
    const indexFilePath = join(__dirname, "public/index.html")
    const indexFile = readFileSync(indexFilePath, "utf-8")
    res.type("text/html").send(indexFile)
  })

  fastifyApp.get("/close/:id", async(req, res) => {
    await sseManager.closeSSEStream(req.params.id)
    res.sendStatus(200)
  })

  fastifyApp.get("/stream", async(req, res) => {
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

  fastifyApp.get("/info", (req, res) => {
    res.json({
      rooms: Object.keys(sseManager.rooms),
      streams: Object.keys(sseManager.sseStreams)
    })
  })

  fastifyApp.listen({host: ADDRESS, port: parseInt(PORT, 10)}, () => console.log(`Server listening on port ${PORT}`))
})().catch(console.error)
