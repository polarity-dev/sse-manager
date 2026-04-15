import { EventEmitter } from "stream"

export type EventsAdapterEmitFn = (event: string, data: string) => Promise<void>
export type EventsAdapterOnFn = (event: string, fn: (data: string, event: string) => void) => Promise<void>
export type EventsAdapterInitFn = () => Promise<void>


export default class EventsAdapter {
  _emit: EventsAdapterEmitFn
  _on: EventsAdapterOnFn
  init?: EventsAdapterInitFn

  localEventEmitter = new EventEmitter()

  constructor({
    emit,
    on,
    init
  }: {
      emit: EventsAdapterEmitFn,
      on: EventsAdapterOnFn,
      init?: EventsAdapterInitFn
    }) {

    this._emit = emit
    this._on = on
    this.init = init
  }

  emit = async(event: string, data: string, options?: { propagation?: boolean }): Promise<void> => {
    const propagation = options?.propagation ?? true
    if (propagation === false) {
      this.localEventEmitter.emit(event, data)
      return
    }

    await this._emit(event, data)
  }

  on: EventsAdapterOnFn = async(event, fn) => {
    this.localEventEmitter.on(event, fn)
    await this._on(event, fn)
  }

  static LOCAL_EVENT_KEY_PREFIX = "local_"
}
