const { describe, it } = require("mocha")
const { expect } = require("chai")
const Cleaner = require("../src/Cleaner")

describe("Cleaner", function(){
  it("should return a cleanup function", function(){
    const myCleanupScript = () => {};
    const cleanup = Cleaner(myCleanupScript);
    expect(cleanup).to.be.a("function");
  })
  describe("synchronous mocha tests without done callback", function(){
    describe("cleanup function", function(){
      it("should return a new synchronous mocha test", function(){
        const cleanup = Cleaner(() => {});
        const rawMochaTest = function(){};
        const safeMochaTest = cleanup(rawMochaTest);
        expect(rawMochaTest).to.not.equal(safeMochaTest)
        expect(safeMochaTest).to.be.a("function");
        expect(safeMochaTest.length).to.equal(0)
      })
    })
    describe("new mocha test", function(){
      it("should run the original mocha test", function(){
        let didCallMyTest = 0;
        const cleanup = Cleaner(() => {});
        const rawMochaTest = function(){
          didCallMyTest++
        };
        cleanup(rawMochaTest)();
        expect(didCallMyTest).to.equal(1)
      })
      it("should run the cleanup script after running the original test", function(){
        let didCallMyTest = 0, didCallCleanup = 0;
        const cleanup = Cleaner(() => {
          expect(didCallMyTest).to.equal(1)
          didCallCleanup++
        });
        const rawMochaTest = function(){
          expect(didCallCleanup).to.equal(0)
          didCallMyTest++
        };
        cleanup(rawMochaTest)();
        expect(didCallMyTest).to.equal(1)
        expect(didCallCleanup).to.equal(1)
      })
      it("should run the cleanup script before throwing the original test's error", function(){
        let didCallCleanup = 0;
        const cleanup = Cleaner(() => {
          didCallCleanup++;
        });
        const rawMochaTest = function(){
          throw new Error("mocha test failed")
        };
        expect(cleanup(rawMochaTest)).to.throw("mocha test failed")
        expect(didCallCleanup).to.equal(1)
      })
    })
  })
  describe("synchronous mocha tests with done callback", function(){
    describe("cleanup function", function(){
      it("should return a new 'asynchronous' mocha test", function(){
        const cleanup = Cleaner(() => {});
        const rawMochaTest = function(done){};
        const safeMochaTest = cleanup(rawMochaTest);
        expect(rawMochaTest).to.not.equal(safeMochaTest)
        expect(safeMochaTest).to.be.a("function");
        expect(safeMochaTest.length).to.equal(1)
      })
    })
    describe("new mocha test", function(){
      it("should run the original mocha test", function(){
        let didCallMyTest = 0;
        const cleanup = Cleaner(() => {});
        const rawMochaTest = function(done){
          didCallMyTest++
        };
        cleanup(rawMochaTest)();
        expect(didCallMyTest).to.equal(1)
      })
      it("should provide a done callback to the original test", function(done){
        const cleanup = Cleaner(() => {});
        const rawMochaTest = function(doneCb){
          expect(doneCb).to.be.a("function")
          done()
        };
        cleanup(rawMochaTest)(() => {});
      })
      it("should run the cleanup script after running the original test if done not called", function(){
        let didCallMyTest = 0, didCallCleanup = 0;
        const cleanup = Cleaner(() => {
          expect(didCallMyTest).to.equal(1)
          didCallCleanup++
        });
        const rawMochaTest = function(done){
          expect(didCallCleanup).to.equal(0)
          didCallMyTest++
        };
        cleanup(rawMochaTest)();
        expect(didCallMyTest).to.equal(1)
        expect(didCallCleanup).to.equal(1)
      })
      it("should run the cleanup script before throwing the original test's error", function(){
        let didCallCleanup = 0;
        const cleanup = Cleaner(() => {
          didCallCleanup++;
        });
        const rawMochaTest = function(done){
          throw new Error("mocha test failed")
        };
        expect(cleanup(rawMochaTest)).to.throw("mocha test failed")
        expect(didCallCleanup).to.equal(1)
      })
      it("should run the cleanup script before done is called with no error", function(){
        let didCallDone = 0, didCallCleanup = 0;
        const cleanup = Cleaner(() => {
          expect(didCallDone).to.equal(0);
          didCallCleanup++
        });
        const rawMochaTest = function(done){
          done()
        };
        cleanup(rawMochaTest)(() => {
          expect(didCallCleanup).to.equal(1)
          didCallDone++;
        });
        expect(didCallDone).to.equal(1)
        expect(didCallCleanup).to.equal(1)
      })
      it("should run the cleanup script before done is called with an error", function(){
        let didCallCleanup = 0, didCallDone = 0;
        const msg = "mocha test setup failed";
        const cleanup = Cleaner(() => {
          expect(didCallDone).to.equal(0)
          didCallCleanup++;
        })
        const rawMochaTest = function(done){
          done(new Error(msg))
        }
        cleanup(rawMochaTest)(err => {
          expect(didCallCleanup).to.equal(1)
          didCallDone++;
          expect(err).to.be.an("error");
          expect(err.message).to.equal(msg)
        });
        expect(didCallDone).to.equal(1);
        expect(didCallCleanup).to.equal(1)
      })
      it("should not throw an error which was thrown after calling done", function(){
        const cleanup = Cleaner(() => {});
        let didCallMyTest = 0;
        const rawMochaTest = function(doneCb){
          didCallMyTest++
          doneCb()
          throw new Error("doesn't matter for this code path")
        };
        const newTest = cleanup(rawMochaTest)
        expect(() => newTest(() => {})).to.not.throw()
        expect(didCallMyTest).to.equal(1)
      })
    })
  })
})
