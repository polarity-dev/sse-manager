/* eslint-disable no-console */
const {readFileSync} = require('fs');
const express = require("express")
const { join } = require("path")
const fastify = require('fastify');
const postgres = require('postgres');
const app = new express()
const fastifyApp = new fastify({ logger: true })
const { createSSEManager} = require("../SSEManager")
const {PostgresEventAdapter, RedisEventsAdapter} = require("../SSEManager/dist/adapters/eventAdapters")
const {ExpressHttpAdapter, FastifyHttpAdapter} = require("../SSEManager/dist/adapters/httpAdapters")

void (async() => {

  const db = postgres({
    host: 'postgres',
    user: 'postgres',
    password: '12345678',
    port: 5432,
    database: 'postgres',
  })

  const sseManager = await createSSEManager({
    httpAdapter: new FastifyHttpAdapter(),
    eventsAdapter: new PostgresEventAdapter()
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
  
  //app.use(express.static(join(__dirname, "./public")))

  fastifyApp.get("/close/:id", async(req, res) => {
    await sseManager.closeSSEStream(req.params.id)
    res.sendStatus(200)
  })

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  fastifyApp.get("/stream", async(req, res) => {
    await sleep(100)
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

  fastifyApp.get("/dbNum", async(req, res) => {
    const result = await db`SELECT * FROM testoo`
    res.send(result)
  })

  fastifyApp.listen({host: ADDRESS, port: parseInt(PORT, 10)}, () => console.log(`Server listening on port ${PORT}`))
})().catch(console.error)
