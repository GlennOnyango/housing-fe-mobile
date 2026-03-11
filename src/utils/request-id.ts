function randomChunk() {
  return Math.random().toString(16).slice(2, 10);
}

export function createRequestId() {
  return `${Date.now().toString(16)}-${randomChunk()}-${randomChunk()}`;
}
