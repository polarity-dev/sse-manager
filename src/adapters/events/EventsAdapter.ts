export type EventsAdapterEmitFn = (event: string, data: string) => Promise<void>
export type EventsAdapterOnFn = (event: string, fn: (data: string, event: string) => void) => Promise<void>
export type EventsAdapterInitFn = () => Promise<void>


export default class EventsAdapter {
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