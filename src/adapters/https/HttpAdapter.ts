export type HTTPAdapterSetResHeadersFn = (res: any, headers: { [key: string]: string }) => void
export type HTTPAdapterWriteResFn = (res: any, data: string) => void
export type HTTPFlushResHeadersFn = (res: any) => void
export type HTTPEndResHeadersFn = (res: any) => void
export type HTTPResOnCloseCallbackFn = (res: any, fn: () => void) => void


export default class HTTPAdapter {
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
  