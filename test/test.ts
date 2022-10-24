import { expect } from "chai"
import { describe, it } from "mocha"
import f from "../dist/index.esm"

describe("Function", () => {
   it("Response should be object", done => {
      try {
         const response = f()
         expect(response).to.be.an("Object")
         done()
      } catch (err) {
         done(err)
      }
   })
   it("Response should have message", done => {
      try {
         const response = f()
         expect(response.message).to.be.equal("Hello World!")
         done()
      } catch (err) {
         done(err)
      }
   })
})
 