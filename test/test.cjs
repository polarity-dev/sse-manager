const { expect } = require("chai")
const { describe, it } = require("mocha")
const f = require("../dist/index.cjs")

describe("Function", () => {
   it("Module should be a function", done => {
      try {
         expect(f).to.be.a("Function")
         done()
      } catch (err) {
         done(err)
      }
   })
})