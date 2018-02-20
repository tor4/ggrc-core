/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
 * The util allows to perform batch of actions with some delay in a single transaction.
 * @param {function} completeTransaction - The function that allows to submit result of transaction.
 * @param {number} timeout - The execution delay in milliseconds.
 * @param {boolean} sequentially - The flag indicates that transactions must be completed sequentially.
 */
export default function (completeTransaction, timeout, sequentially) {
  let deferredQueue = [];
  let timeoutId = null;

  let sequence = {
    transactionDfd: can.Deferred().resolve(),
    callbackAdded: false,
  };

  function runBatch(batch) {
    can.each(batch, function (actionItem) {
      actionItem.action();
    });
  }

  function resolveBatch(batch, batchDfd, result) {
    can.each(batch, function (actionItem) {
      actionItem.deferred.resolve(result);
    });
    batchDfd.resolve();
  }

  function rejectBatch(batch, batchDfd, ...result) {
    can.each(batch, function (actionItem) {
      actionItem.deferred.reject(...result);
    });
    batchDfd.resolve();
  }

  function processQueue() {
    let batchDfd = can.Deferred();
    let currentBatch = deferredQueue.splice(0, deferredQueue.length);

    runBatch(currentBatch);
    completeTransaction(
      resolveBatch.bind(this, currentBatch, batchDfd),
      rejectBatch.bind(this, currentBatch, batchDfd));

    return batchDfd.promise();
  }

  function run() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(processQueue, timeout);
  }

  function runSequence() {
    if (sequence.transactionDfd.state() !== 'pending') {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(processSequentially, timeout);
    } else {
      addSequenceCallback();
    }
  }

  function processSequentially() {
    sequence.transactionDfd = can.Deferred();
    sequence.callbackAdded = false;
    processQueue().then(sequence.transactionDfd.resolve);
  }

  function addSequenceCallback() {
    if (!sequence.callbackAdded) {
      sequence.transactionDfd.then(processSequentially);
      sequence.callbackAdded = true;
    }
  }

  /**
   * Adds new action to execution queue.
   * @param {function} action - The action that should be executed.
   * @return {object} - The canJS promise indicates result of the transaction.
   */
  this.push = function (action) {
    let dfd = can.Deferred();
    deferredQueue.push({
      deferred: dfd,
      action: action,
    });

    if (sequentially) {
      runSequence();
    } else {
      run();
    }

    return dfd.promise();
  };
}
