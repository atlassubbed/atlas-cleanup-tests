# atlas-cleanup-tests

Seamlessly wrap sync mocha tests with your cleanup script. Supports 'done' callback.

---

## install

```
npm install --save-dev atlas-cleanup-tests
```

## why

If you are mocking an API in a mocha test, you may need to revert changes after the test is done. The `afterEach` hook in mocha runs *after* mocha tries to output the results for the test. This means that if your test mocks an API that mocha depends on (e.g. `process.stdout`), mocha itself will fail.

If we try and mock `console.log`, mocha will break:

```javascript
// Animal.test.js
const mocha = require("mocha");
const { expect } = require("chai");
const rewire = require("rewire")
const Animal = rewire("./Animal")

// a handle for reverting mocks
let revert;

describe("cat", function(){
  afterEach(function(){
    // this code doesn't get called soon enough
    revert()
  })
  it("should meow", function(){
    let sound;
    // this mocks 'console.log' for our Animal module
    revert = Animal.__set__("console.log", msg => {sound = msg})
    const cat = new Animal();
    cat.roar();
    expect(sound).to.equal("meow!")
  })
})
```

Fixing this isn't too difficult to do inside your tests, but I like to keep a clean house. Additionally, mocking standard output is pretty avoidable. By using a wrapper (e.g. a Logger) around `console.log` or `process.stdout`, you can easily mock your application's logging functionality. For simple stuff though, using a special logger feels uneccesary.

This package gives you a cleanup function which runs *after* your test runs, but *before* `afterEach` runs. This way, your home stays clean before mocha gets invited over.

## examples

#### without `done` callback

```javascript
// Animal.test.js
...
const Cleaner = require("atlas-cleanup-tests");
const cleanup = Cleaner(() => {
  revert()
  console.log("cleanup script done!")
})

// seamlessly wrap your tests
describe("cat", function(){
  it("should meow", cleanup(function(){
    let sound;
    revert = Animal.__set__("console.log", msg => {sound = msg})
    const cat = new Animal();
    cat.roar();
    expect(sound).to.equal("meow!")
  }))
})
```

#### with `done` callback

Even if your test is sync, mocha's `done` callback can be used to test (partial) code-paths. The `cleanup` function will also be able to wrap these tests without any work on your part:

```javascript
// Animal.test.js
...
describe("cat", function(){
  it("should lose health when it roars", cleanup(function(done){
    let sound;
    revert = Animal.__set__("console.log", msg => {
      expect(msg).to.equal("meow!");
      // don't care about anything verifying meow
      done();
    })
    const cat = new Animal();
    cat.roar();
  }))
})
```

## caveats

This wrapper assumes that you have mocked your async dependencies. It will not catch unhandled async errors (e.g. assertions made in an async callback). Unless you are unit testing your async functions or doing integration tests, it's probably better to mock them anyway.