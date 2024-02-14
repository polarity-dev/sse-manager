import { EventEmitter } from 'events'
import EventsAdapter from './EventsAdapter'

export default class EmitterEventsAdapter extends EventsAdapter {
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