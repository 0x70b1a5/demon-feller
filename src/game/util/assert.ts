function assert(condition: unknown, msg?: string): asserts condition {
  if (!!condition === false) throw new Error(msg)
}

export default assert