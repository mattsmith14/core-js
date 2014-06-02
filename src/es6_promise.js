/**
 * ES6 Promises
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-objects
 * https://github.com/domenic/promises-unwrapping
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * http://caniuse.com/promises
 * Based on:
 * https://github.com/jakearchibald/ES6-Promises
 * Alternatives:
 * https://github.com/paulmillr/es6-shim
 */
!function(Promise, $Promise){
  isFunction(Promise)
  && isFunction(Promise.resolve) && isFunction(Promise.reject) && isFunction(Promise.all) && isFunction(Promise.race)
  && (function(promise){
    return Promise.resolve(promise) === promise;
  })(new Promise(Function()))
  || !function(SUBSCRIBERS, STATE, DETAIL, SEALED, FULFILLED, REJECTED, PENDING){
    // microtask or, if not possible, macrotask
    var asap =
      isNode ? process.nextTick :
      Promise && isFunction(Promise.resolve) ? function(fn){ $Promise.resolve().then(fn); } :
      setImmediate;
    // 25.4.3 The Promise Constructor
    Promise = function(executor){
      var promise       = this
        , rejectPromise = part.call(handle, promise, REJECTED);
      assertInstance(promise, Promise, PROMISE);
      assertFunction(executor);
      promise[SUBSCRIBERS] = [];
      try {
        executor(part.call(resolve, promise), rejectPromise);
      } catch(e){
        rejectPromise(e);
      }
    }
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    Promise[PROTOTYPE]['catch'] = function(onRejected){
      return this.then(undefined, onRejected);
    },
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    Promise[PROTOTYPE].then = function(onFulfilled, onRejected){
      var promise     = this
        , thenPromise = new Promise(Function())
        , args        = [onFulfilled, onRejected]; 
      if(promise[STATE])asap(function(){
        invokeCallback(promise[STATE], thenPromise, args[promise[STATE] - 1], promise[DETAIL]);
      });
      else promise[SUBSCRIBERS].push(thenPromise, onFulfilled, onRejected);
      return thenPromise;
    }
    // 25.4.4.1 Promise.all(iterable)
    Promise.all = function(iterable){
      var C      = this
        , values = [];
      return new C(function(resolve, reject){
        forOf(iterable, push, values);
        var remaining = values.length
          , results   = Array(remaining);
        if(remaining)forEach.call(values, function(promise, index){
          C.resolve(promise).then(function(value){
            results[index] = value;
            --remaining || resolve(results);
          }, reject);
        });
        else resolve(results);
      });
    }
    // 25.4.4.4 Promise.race(iterable)
    Promise.race = function(iterable){
      var C = this;
      return new C(function(resolve, reject){
        forOf(iterable, function(promise){
          C.resolve(promise).then(resolve, reject)
        });
      });
    }
    // 25.4.4.5 Promise.reject(r)
    Promise.reject = function(r){
      return new this(function(resolve, reject){
        reject(r);
      });
    }
    // 25.4.4.6 Promise.resolve(x)
    Promise.resolve = function(x){
      return isObject(x) && getPrototypeOf(x) === this[PROTOTYPE] ? x : new this(function(resolve, reject){
        resolve(x);
      });
    }
    function invokeCallback(settled, promise, callback, detail){
      var hasCallback = isFunction(callback)
        , value, succeeded, failed;
      if(hasCallback){
        try {
          value     = callback(detail);
          succeeded = 1;
        } catch(e){
          failed = 1;
          value  = e;
        }
      } else {
        value = detail;
        succeeded = 1;
      }
      if(handleThenable(promise, value))return;
      else if(hasCallback && succeeded)resolve(promise, value);
      else if(failed)handle(promise, REJECTED, value);
      else if(settled == FULFILLED)resolve(promise, value);
      else if(settled == REJECTED)handle(promise, REJECTED, value);
    }
    function handleThenable(promise, value){
      var resolved;
      try {
        assert(promise !== value, "A promises callback can't return that same promise.");
        if(value && isFunction(value.then)){
          value.then(function(val){
            if(resolved)return true;
            resolved = true;
            if(value !== val)resolve(promise, val);
            else handle(promise, FULFILLED, val);
          }, function(val){
            if(resolved)return true;
            resolved = true;
            handle(promise, REJECTED, val);
          });
          return 1;
        }
      } catch(error){
        if(!resolved)handle(promise, REJECTED, error);
        return 1;
      }
    }
    function resolve(promise, value){
      if(promise === value || !handleThenable(promise, value))handle(promise, FULFILLED, value);
    }
    function handle(promise, state, reason){
      if(promise[STATE] === PENDING){
        promise[STATE]  = SEALED;
        promise[DETAIL] = reason;
        asap(function(){
          promise[STATE] = state;
          for(var subscribers = promise[SUBSCRIBERS], i = 0; i < subscribers.length; i += 3){
            invokeCallback(state, subscribers[i], subscribers[i + state], promise[DETAIL]);
          }
          promise[SUBSCRIBERS] = undefined;
        });
      }
    }
  }(symbol('subscribers'), symbol('state'), symbol('detail'), 0, 1, 2);
  setTag(Promise, PROMISE)
  $define(GLOBAL, {Promise: Promise}, 1);
}(Promise, Promise);