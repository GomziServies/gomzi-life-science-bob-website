/** The few parts of imagetracerjs (a plain-JS tracer without types) that the vectorizer uses. */
declare module 'imagetracerjs' {
  export interface TracedSegment {
    type: string
    x1: number
    y1: number
    x2: number
    y2: number
    x3?: number
    y3?: number
  }
  export interface TracedPath {
    segments: TracedSegment[]
    isholepath: boolean
    holechildren: number[]
  }
  export interface TracedPalette {
    r: number
    g: number
    b: number
    a: number
  }
  export interface TraceData {
    layers: TracedPath[][]
    palette: TracedPalette[]
    width: number
    height: number
  }
  export interface RasterLike {
    width: number
    height: number
    data: ArrayLike<number>
  }
  const ImageTracer: {
    imagedataToTracedata(image: RasterLike, options: Record<string, unknown>): TraceData
    svgpathstring(trace: TraceData, layer: number, path: number, options: Record<string, unknown>): string
    checkoptions(options: Record<string, unknown>): Record<string, unknown>
  }
  export default ImageTracer
}
