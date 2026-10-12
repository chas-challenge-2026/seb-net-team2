// jsdom supplies the page; Node supplies fetch's Headers and Response classes.
const { TestEnvironment } = require('jest-environment-jsdom')
const { Headers, Response } = globalThis
module.exports = class extends TestEnvironment {
  async setup() {
    await super.setup()
    Object.assign(this.global, { Headers, Response })
  }
}
