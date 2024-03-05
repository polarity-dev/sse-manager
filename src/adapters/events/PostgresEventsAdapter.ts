import EventsAdapter from './EventsAdapter'
import postgres from 'postgres'

export default class PostgresEventsAdapter extends EventsAdapter {
    #client: ReturnType<typeof postgres>;
  
    constructor(client: ReturnType<typeof postgres>) {
      super({
        emit: async(event, data) => {
          await this.#client.notify(event, data)
        },
        on: async(event, fn) => {
          await this.#client.listen(event, (data: string) => fn(data, event))
        }
      })

      this.#client = client
    }
  }