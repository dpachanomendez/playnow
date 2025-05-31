import assert from 'assert';
import { processPayment, __setPaymentClassForTesting, __resetPaymentClassForTesting } from './payment.controller.js';
// MP_ACCESS_TOKEN is not directly used in processPayment tests if mpClient is pre-configured
// and Payment class is mocked. If mpClient itself needed mocking, we might need it.
// import { MP_ACCESS_TOKEN } from '../config.js';

// --- Mock Payment Class ---
let mockPaymentCreateFn; // To store the mock function for 'create'

class MockPayment {
  constructor(clientConfig) {
    // console.log('MockPayment constructor called with:', clientConfig);
    // We can assert clientConfig if needed, but mpClient is created in the controller
    // and passed to new PaymentClass(mpClient).
  }

  async create(paymentData) {
    // console.log('MockPayment create called with:', paymentData);
    if (mockPaymentCreateFn) {
      return mockPaymentCreateFn(paymentData);
    }
    throw new Error('mockPaymentCreateFn not set for this test case');
  }
}

// --- Test Runner ---
const tests = {
  "should process payment successfully and return default 200 (implicit)": async () => {
    // Arrange
    __setPaymentClassForTesting(MockPayment);
    const mockPaymentResponse = { id: "pay_123", status: "approved", description: "Mock Payment Success" };
    mockPaymentCreateFn = async (paymentData) => {
      assert.deepStrictEqual(paymentData.body.token, "test_token_success", "Payment data token mismatch");
      return mockPaymentResponse;
    };

    const req = {
      body: { token: "test_token_success", amount: 100 },
    };
    let statusCalledWith = 0; // Will remain 0 if res.status() is not called
    let jsonCalledWith = null;
    const res = {
      status: (code) => {
        statusCalledWith = code;
        // Return 'this' or an object that has a json method for chaining
        return { json: (payload) => { jsonCalledWith = payload; } };
      },
      // json method directly on res for cases where .status is not called first
      json: (payload) => {
        jsonCalledWith = payload;
      },
    };
    const originalConsoleLog = console.log; // Backup original console.log
    console.log = () => {}; // Suppress console.log for this test

    // Act
    await processPayment(req, res);

    // Assert
    // In the controller, res.status() is only called for errors.
    // For success, only res.json() is called, implying a default 200 OK.
    assert.strictEqual(statusCalledWith, 0, `res.status should not have been called on success, but was called with ${statusCalledWith}`);
    assert.deepStrictEqual(jsonCalledWith, { success: true, data: mockPaymentResponse }, "Response payload mismatch for success");

    console.log = originalConsoleLog; // Restore console.log
    __resetPaymentClassForTesting(); // Clean up
  },

  "should handle errors during payment processing and return 500": async () => {
    // Arrange
    __setPaymentClassForTesting(MockPayment);
    const errorMessage = "SDK Error: Payment Failed";
    mockPaymentCreateFn = async (paymentData) => {
      assert.deepStrictEqual(paymentData.body.token, "test_token_failure", "Payment data token mismatch for failure case");
      throw new Error(errorMessage);
    };

    const req = {
      body: { token: "test_token_failure", amount: 50 },
    };
    let statusCalledWith = 0;
    let jsonCalledWith = null;
    const res = {
      status: (code) => {
        statusCalledWith = code;
        return { json: (payload) => { jsonCalledWith = payload; } };
      },
      json: (payload) => { // Fallback if status is not chained
        jsonCalledWith = payload;
      }
    };
    const originalConsoleError = console.error; // Backup original console.error
    const originalConsoleLog = console.log;
    console.error = () => {}; // Suppress console.error for this test
    console.log = () => {};

    // Act
    await processPayment(req, res);

    // Assert
    assert.strictEqual(statusCalledWith, 500, `res.status should be 500, was ${statusCalledWith}`);
    assert.deepStrictEqual(jsonCalledWith, { success: false, message: errorMessage }, "Response payload mismatch for failure");

    console.error = originalConsoleError; // Restore console.error
    console.log = originalConsoleLog;
    __resetPaymentClassForTesting(); // Clean up
  },
};

// --- Run Tests ---
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

(async () => {
  console.log("Running custom tests for payment.controller.js using Node Assert...\n");
  for (const testName in tests) {
    testsRun++;
    try {
      await tests[testName]();
      console.log(`✅ PASSED: ${testName}`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ FAILED: ${testName}`);
      console.error(error); // This will print the assertion error
      testsFailed++;
    }
  }
  console.log("\n--- Test Summary ---");
  console.log(`Total Tests: ${testsRun}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);

  if (testsFailed > 0) {
    process.exitCode = 1; // Indicate failure to CI/CD environments
  }
})();
