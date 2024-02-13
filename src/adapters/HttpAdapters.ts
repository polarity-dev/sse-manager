import { Response } from "express"
import { FastifyReply } from "fastify"

export type HTTPAdapterSetResHeadersFn = (res: any, headers: { [key: string]: string }) => void
export type HTTPAdapterWriteResFn = (res: any, data: string) => void
export type HTTPFlushResHeadersFn = (res: any) => void
export type HTTPEndResHeadersFn = (res: any) => void
export type HTTPResOnCloseCallbackFn = (res: any, fn: () => void) => void


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
  
          const resWithFlush = res as Response & { flush?: () => void }
          if (typeof resWithFlush.flush  === "function") {
            resWithFlush.flush()
          }
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
  
  
  export class FastifyHttpAdapter extends HTTPAdapter {
    constructor() {
      
      super({
        setResHeaders: (res: FastifyReply, headers): void => {
          res.header
          Object.entries(headers).forEach(([k, v]) => res.raw.setHeader(k, v))
        },
  
        writeRes: (res: FastifyReply, data): void => {
          res.raw.flushHeaders()
          res.raw.write(data)
          res.raw.flushHeaders()
        },
  
        flushResHeaders: (res: FastifyReply): void => {
          res.raw.flushHeaders()
        },
  
        endRes: (res: FastifyReply): void => {
          res.raw.end()
        },
  
        onCloseCallback: (res: FastifyReply, fn): void => {
          res.raw.on("close", fn)
        }
      })
    }
  }
  
  