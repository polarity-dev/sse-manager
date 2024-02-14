import { createClient } from 'redis'
import EventsAdapter from './EventsAdapter'

export default class RedisEventsAdapter extends EventsAdapter {
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