type Cb = (...args: any[]) => void

export class EventEmitter {
  callbacks: Record<string, Cb[]>

  constructor() {
    this.callbacks = {}
  }

  on(event: string, cb: Cb) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }

    this.callbacks[event].push(cb)
  }

  emit(event: string, data: unknown) {
    let cbs = this.callbacks[event]
    if (cbs) {
      cbs.forEach((cb) => cb(data))
    }
  }
}
