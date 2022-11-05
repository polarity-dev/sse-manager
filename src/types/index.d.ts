import type { EventsAdapter, HTTPAdapter } from ".."

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
