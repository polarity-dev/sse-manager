export type HTTPAdapterSetResHeadersFn = (res: any, headers: { [key: string]: string }) => void
export type HTTPAdapterWriteResFn = (res: any, data: string) => void
export type HTTPFlushResHeadersFn = (res: any) => void
export type HTTPEndResHeadersFn = (res: any) => void
export type HTTPResOnCloseCallbackFn = (res: any, fn: () => void) => void
export type HTTPRequestIsFinishedFn = (res: any) => boolean


export default class HTTPAdapter {
  setResHeaders: HTTPAdapterSetResHeadersFn
  writeRes: HTTPAdapterWriteResFn
  flushResHeaders: HTTPFlushResHeadersFn
  endRes: HTTPEndResHeadersFn
  onCloseCallback: HTTPResOnCloseCallbackFn
  requestIsFinished: HTTPRequestIsFinishedFn

  constructor({
    setResHeaders,
    writeRes,
    flushResHeaders,
    endRes,
    onCloseCallback,
    requestIsFinished
  }: {
    setResHeaders: HTTPAdapterSetResHeadersFn,
    writeRes: HTTPAdapterWriteResFn,
    flushResHeaders: HTTPFlushResHeadersFn,
    endRes: HTTPEndResHeadersFn,
    onCloseCallback: HTTPResOnCloseCallbackFn,
    requestIsFinished: HTTPRequestIsFinishedFn
  }) {
    this.setResHeaders = setResHeaders
    this.writeRes = writeRes
    this.flushResHeaders = flushResHeaders
    this.endRes = endRes
    this.onCloseCallback = onCloseCallback
    this.requestIsFinished = requestIsFinished
  }
}
