/* eslint-disable @typescript-eslint/no-explicit-any */
import type { createClient } from "redis"
import type { Response } from "express"
import { EventEmitter } from "events"
import { randomUUID } from "crypto"

/* eslint-disable @typescript-eslint/no-explicit-any */
export type SSEManagerOptions = {
  httpAdapter?: HTTPAdapter,
  eventsAdapter?: EventsAdapter,
  keepAliveInterval?: number | null
}

export type SSEMessage = { data: string, id?: number | string,  channel?: string, retry?: number }

export type SSEStreamOptions = { keepAliveInterval: number | null }

export type HTTPAdapterSetResHeadersFn = (res: any, headers: { [key: string]: string }) => void
export type HTTPAdapterWriteResFn = (res: any, data: string) => void
export type HTTPFlushResHeadersFn = (res: any) => void
export type HTTPEndResHeadersFn = (res: any) => void
export type HTTPResOnCloseCallbackFn = (res: any, fn: () => void) => void


export type EventsAdapterEmitFn = (event: string, data: string) => Promise<void>
export type EventsAdapterOnFn = (event: string, fn: (data: string, event: string) => void) => Promise<void>
export type EventsAdapterInitFn = () => Promise<void>


export class SSEManager extends EventEmitter {
  readonly id: string
  httpAdapter: HTTPAdapter
  eventsAdapter: EventsAdapter
  #sseStreams: { [id: string]: SSEStream } = {}
  #rooms: { [id: string]: SSEStream[] } = {}
  #keepAliveInterval: number | null

  constructor(options?: SSEManagerOptions) {
    super()
    this.id = randomUUID()
    this.httpAdapter = options?.httpAdapter || new ExpressHttpAdapter()
    this.eventsAdapter = options?.eventsAdapter || new EmitterEventsAdapter()
    this.#keepAliveInterval = typeof options?.keepAliveInterval !== "undefined" ? options.keepAliveInterval : 15000
  }

  async init(): Promise<void> {
    if (this.eventsAdapter.init) {
      await this.eventsAdapter.init()
    }

    await Promise.all([
      this.eventsAdapter.on("broadcast", (data) => {
        const { id, message } = JSON.parse(data) as { id: string, message: SSEMessage }
        if (this.#sseStreams[id]) {
          this.#sseStreams[id].broadcast(message)
        } else if (this.#rooms[id]) {
          Object.values(this.#rooms[id]).forEach(sseStream => {
            sseStream.broadcast(message)
          })
        }
      }),

      this.eventsAdapter.on("closeSSEStream", (data) => {
        const { id } = JSON.parse(data) as { id: string }
        if (this.#sseStreams[id]) {
          this.#sseStreams[id].close()
        } else if (this.#rooms[id]) {
          Object.values(this.#rooms[id]).forEach(sseStream => {
            sseStream.close()
          })
        }
      }),

      this.eventsAdapter.on("addSSEStreamToRoom", (data) => {
        const { streamId, roomId } = JSON.parse(data) as { streamId: string, roomId: string }
        if (this.#sseStreams[streamId]) {
          if (!this.#rooms[roomId]) {
            this.#rooms[roomId] = []
          }
          this.#rooms[roomId].push(this.#sseStreams[streamId])
        }
      }),

      this.eventsAdapter.on("removeSSEStreamFromRoom", (data) => {
        const { streamId, roomId } = JSON.parse(data) as { streamId: string, roomId: string }
        if (this.#sseStreams[streamId]) {
          this.#rooms[roomId]?.splice(this.#rooms[roomId]?.indexOf(this.#sseStreams[streamId]), 1)
        }
      })
    ])
  }

  async createSSEStream(res: any, options: SSEStreamOptions = { keepAliveInterval: this.#keepAliveInterval }): Promise<SSEStream> {
    const sseStream = new SSEStream(res, this, options)
    this.#sseStreams[sseStream.id] = sseStream

    sseStream.on("close", async() => {
      this.#sseStreams[sseStream.id].rooms.forEach(roomId => {
        const room = this.#rooms[roomId]
        for (let i = 0; i < room.length; i++) {
          if (room[i].id === sseStream.id) {
            room.splice(i, 1)
            break
          }
        }

        if (!room.length) {
          delete this.#rooms[roomId]
        }
      })
      delete this.#sseStreams[sseStream.id]
    })

    return sseStream
  }

  async broadcast(id: string, message: SSEMessage): Promise<void> {
    if (this.#sseStreams[id]) {
      this.#sseStreams[id].broadcast(message)
    } else {
      await this.eventsAdapter.emit("broadcast", JSON.stringify({ id, message }))
    }
  }

  async closeSSEStream(id: string): Promise<void> {
    if (this.#sseStreams[id]) {
      this.#sseStreams[id].close()
    } else {
      await this.eventsAdapter.emit("closeSSEStream", JSON.stringify({ id }))
    }
  }

  async addSSEStreamToRoom(streamId: string, roomId: string): Promise<void> {
    if (this.#sseStreams[streamId]) {
      if (!this.#rooms[roomId]) {
        this.#rooms[roomId] = []
      }
      this.#rooms[roomId].push(this.#sseStreams[streamId])
      this.#sseStreams[streamId].rooms.push(roomId)
    } else {
      await this.eventsAdapter.emit("addSSEStreamToRoom", JSON.stringify({ streamId, roomId }))
    }
  }

  async removeSSEStreamFromRoom(streamId: string, roomId: string): Promise<void> {
    if (this.#sseStreams[streamId]) {
      this.#rooms[roomId]?.splice(this.#rooms[roomId]?.indexOf(this.#sseStreams[streamId]), 1)
    } else {
      await this.eventsAdapter.emit("removeSSEStreamFromRoom", JSON.stringify({ streamId, roomId }))
    }
  }
}

export const createSSEManager = async(options?: SSEManagerOptions): Promise<SSEManager> => {
  const sseManager = new SSEManager(options)
  await sseManager.init()
  return sseManager
}

export class SSEStream extends EventEmitter {
  readonly id: string
  readonly res: any
  readonly sseManager: SSEManager
  readonly rooms: string[]
  readonly options: SSEStreamOptions
  closed: boolean
  #keepAliveTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(res: any, sseManager: SSEManager, options: SSEStreamOptions) {
    super()
    this.id = randomUUID()
    this.res = res
    this.sseManager = sseManager
    this.rooms = []
    this.options = options
    this.closed = false

    sseManager.httpAdapter.setResHeaders(res, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive"
    })

    sseManager.httpAdapter.flushResHeaders(res)

    sseManager.httpAdapter.onCloseCallback(res, () => {
      this.closed = true
      if (this.#keepAliveTimeout) {
        clearTimeout(this.#keepAliveTimeout)
      }
      this.emit("close")
    })

    this.on("data", data => sseManager.httpAdapter.writeRes(res, data))
    this.on("end", () => sseManager.httpAdapter.endRes(res))

    this.#setKeepAliveInterval()
  }

  #setKeepAliveInterval = (): void => {
    if (this.#keepAliveTimeout) {
      clearTimeout(this.#keepAliveTimeout)
    }

    if (this.options.keepAliveInterval) {
      this.#keepAliveTimeout = setTimeout(() => {
        this.keepAlive()
        this.#setKeepAliveInterval()
      }, this.options.keepAliveInterval)
    }
  }

  keepAlive(): void {
    this.sseManager.httpAdapter.writeRes(this.res, ":keep-alive\n\n")
  }

  broadcast(message: SSEMessage): void {
    this.emit("data", `${Object.entries(message).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n`)
    this.#setKeepAliveInterval()
  }

  close(): void {
    this.emit("end")
  }

  addToRoom(id: string): Promise<void> {
    return this.sseManager.addSSEStreamToRoom(this.id, id)
  }

  removeFromRoom(id: string): Promise<void> {
    return this.sseManager.removeSSEStreamFromRoom(this.id, id)
  }
}

export class HTTPAdapter {
  setResHeaders: HTTPAdapterSetResHeadersFn
  writeRes: HTTPAdapterWriteResFn
  flushResHeaders: HTTPFlushResHeadersFn
  endRes: HTTPEndResHeadersFn
  onCloseCallback: HTTPResOnCloseCallbackFn

  constructor({
    setResHeaders,
    writeRes,
    flushResHeaders,
    endRes,
    onCloseCallback
  }: {
      setResHeaders: HTTPAdapterSetResHeadersFn,
      writeRes: HTTPAdapterWriteResFn,
      flushResHeaders: HTTPFlushResHeadersFn,
      endRes: HTTPEndResHeadersFn,
      onCloseCallback: HTTPResOnCloseCallbackFn
   }) {
    this.setResHeaders = setResHeaders
    this.writeRes = writeRes
    this.flushResHeaders = flushResHeaders
    this.endRes = endRes
    this.onCloseCallback = onCloseCallback
  }
}

export class ExpressHttpAdapter extends HTTPAdapter {
  constructor() {
    super({
      setResHeaders: (res: Response, headers): void => {
        Object.entries(headers).forEach(([k, v]) => res.set(k, v))
      },

      writeRes: (res: Response, data): void => {
        res.write(data)
      },

      flushResHeaders: (res: Response): void => {
        res.flushHeaders()
      },

      endRes: (res: Response): void => {
        res.end()
      },

      onCloseCallback: (res: Response, fn): void => {
        res.on("close", fn)
      }
    })
  }
}

export class EventsAdapter {
  emit: EventsAdapterEmitFn
  on: EventsAdapterOnFn
  init?: EventsAdapterInitFn

  constructor({
    emit,
    on,
    init
  }: {
    emit: EventsAdapterEmitFn,
    on: EventsAdapterOnFn,
    init?: EventsAdapterInitFn
  }) {
    this.emit = emit
    this.on = on
    this.init = init
  }
}

export class EmitterEventsAdapter extends EventsAdapter {
  #emitter = new EventEmitter()

  constructor() {
    super({
      emit: (event, data) => {
        this.#emitter.emit(event, data)
        return Promise.resolve()
      },
      on: (event, fn) => {
        this.#emitter.on(event, (data) => {
          return fn(data, event)
        })
        return Promise.resolve()
      }
    })
  }
}

export class RedisEventsAdapter extends EventsAdapter {
  #redisClient: ReturnType<typeof createClient>
  #redisSubscriber: ReturnType<typeof createClient>

  constructor({
    redisClient,
    redisSubscriber
  }: {
    redisClient: ReturnType<typeof createClient>,
    redisSubscriber: ReturnType<typeof createClient>
  }) {
    super({
      emit: async(event, data) => {
        await this.#redisClient.publish(event, data)
      },
      on: async(event, fn) => {
        await this.#redisSubscriber.subscribe(event, fn)
      }
    })

    this.#redisClient = redisClient
    this.#redisSubscriber = redisSubscriber
  }
}
