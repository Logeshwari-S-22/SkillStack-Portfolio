const vm = require('vm');

/**
 * Execute user code safely using Node.js vm module
 */
async function executeCode(code, input, timeout = 5000) {
  try {
    let parsedInput;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      parsedInput = input;
    }
    
    const completeCode = `
      ${code}
      
      try {
        const input = ${JSON.stringify(parsedInput)};
        const result = solve(input);
        result;
      } catch (err) {
        throw new Error('Runtime: ' + err.message);
      }
    `;
    
    const sandbox = {
      console: console,
    };
    
    const script = new vm.Script(completeCode, {
      filename: 'user-code.js',
      timeout: timeout,
      displayErrors: true,
    });
    
    const result = script.runInNewContext(sandbox, {
      timeout: timeout,
    });
    
    return String(result);
    
  } catch (error) {
    console.error("Execution error:", error.message);
    throw new Error("Code execution failed: " + error.message);
  }
}

/**
 * Validate code against all test cases
 */
async function validateCode(code, testCases) {
  const results = [];
  let passedCount = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    try {
      const output = await executeCode(code, testCase.input);
      
      const expected = String(testCase.expectedOutput).trim();
      const actual = String(output).trim();
      const passed = expected === actual;
      
      results.push({
        testNumber: i + 1,
        input: testCase.input,
        expected: expected,
        actual: actual,
        passed: passed,
        error: null
      });
      
      if (passed) {
        passedCount++;
        console.log(`  Test ${i + 1}: ✅ PASS`);
      } else {
        console.log(`  Test ${i + 1}: ❌ FAIL`);
        console.log(`    Expected: ${expected}`);
        console.log(`    Got: ${actual}`);
      }
      
    } catch (err) {
      results.push({
        testNumber: i + 1,
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: null,
        passed: false,
        error: err.message
      });
      
      console.log(`  Test ${i + 1}: ❌ ERROR`);
      console.log(`    ${err.message}`);
    }
  }
  
  return {
    passed: passedCount,
    total: testCases.length,
    results: results
  };
}

// ✅ Export using CommonJS
module.exports = {
  executeCode,
  validateCode,
};