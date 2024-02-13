import { EventEmitter } from "events"
import type { createClient } from "redis"
import postgres from "postgres"

export type EventsAdapterEmitFn = (event: string, data: string) => Promise<void>
export type EventsAdapterOnFn = (event: string, fn: (data: string, event: string) => void) => Promise<void>
export type EventsAdapterInitFn = () => Promise<void>

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
  
  export class PostgresEventAdapter extends EventsAdapter {
    #client = postgres({
      host: "postgres",
      port: 5432,
      user: "postgres",
      password: "12345678",
      database: "postgres"
    })
  
    constructor() {
      super({
        emit: async(event, data) => {
          await this.#client.notify(event, data)
        },
        on: async(event, fn) => {
          await this.#client.listen(event, (data: string) => fn(data, event))
        }
      })
    }
  }