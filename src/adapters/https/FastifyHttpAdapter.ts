import HTTPAdapter from "./HttpAdapter"
import { FastifyReply } from "fastify/types/reply"

export default class FastifyHttpAdapter extends HTTPAdapter {
  constructor() {
    super({
      setResHeaders: (res: FastifyReply, headers): void => {
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
      },

      requestIsFinished: (res: FastifyReply): boolean => res.request.raw.closed
    })
  }
}
