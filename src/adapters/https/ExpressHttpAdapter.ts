import { Response } from "express"
import HTTPAdapter from "./HttpAdapter"

export default class ExpressHttpAdapter extends HTTPAdapter {
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