const run = (test, cleanup, done) => {
  let error, isDone = false;
  try { 
    test(err => {
      isDone = true, cleanup(), done(err);
    }) 
  }
  catch (err) { error = err }
  finally {
    if (!isDone){
      cleanup();
      if (error) throw error;
    }
  }
}

module.exports = cleanup => test => {
  // returns a mocha test
  return test.length ?
    function(done){run(test, cleanup, done)} : 
    function(){run(test, cleanup)}
}