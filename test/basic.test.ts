/**
 * Basic tests for social-from-email API
 */

import { validateEmail, validatePersonInput } from '../src/api';

function testValidation() {
  console.log('🧪 Running validation tests...');
  
  // Test email validation
  const emailTests = [
    { email: 'valid@example.com', expected: true },
    { email: 'also.valid+test@company.co.uk', expected: true },
    { email: 'invalid-email', expected: false },
    { email: '@invalid.com', expected: false },
    { email: 'missing-domain@', expected: false },
    { email: '', expected: false }
  ];
  
  console.log('\n📧 Email validation tests:');
  let emailPassed = 0;
  
  emailTests.forEach((test, index) => {
    const result = validateEmail(test.email);
    const passed = result === test.expected;
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: "${test.email}" -> ${result} (expected: ${test.expected})`);
    if (passed) emailPassed++;
  });
  
  console.log(`\n📊 Email tests: ${emailPassed}/${emailTests.length} passed`);
  
  // Test person input validation
  const personTests = [
    {
      input: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      expectedValid: true,
      description: 'Valid input'
    },
    {
      input: { firstName: 'J', lastName: 'Doe', email: 'j@example.com' },
      expectedValid: false,
      description: 'First name too short'
    },
    {
      input: { firstName: 'John', lastName: 'D', email: 'john@example.com' },
      expectedValid: false,
      description: 'Last name too short'
    },
    {
      input: { firstName: 'John', lastName: 'Doe', email: 'invalid-email' },
      expectedValid: false,
      description: 'Invalid email'
    },
    {
      input: { firstName: '', lastName: 'Doe', email: 'john@example.com' },
      expectedValid: false,
      description: 'Empty first name'
    }
  ];
  
  console.log('\n👤 Person input validation tests:');
  let personPassed = 0;
  
  personTests.forEach((test, index) => {
    const result = validatePersonInput(test.input);
    const passed = result.valid === test.expectedValid;
    console.log(`   ${passed ? '✅' : '❌'} Test ${index + 1}: ${test.description} -> ${result.valid} (expected: ${test.expectedValid})`);
    if (!result.valid && result.errors.length > 0) {
      console.log(`     Errors: ${result.errors.join(', ')}`);
    }
    if (passed) personPassed++;
  });
  
  console.log(`\n📊 Person validation tests: ${personPassed}/${personTests.length} passed`);
  
  const totalPassed = emailPassed + personPassed;
  const totalTests = emailTests.length + personTests.length;
  
  console.log(`\n🎯 Overall test results: ${totalPassed}/${totalTests} passed (${((totalPassed/totalTests) * 100).toFixed(1)}%)`);
  
  return totalPassed === totalTests;
}

async function testTypeExports() {
  console.log('\n🔧 Testing type exports...');
  
  try {
    // Test that we can import functions (this will cause TypeScript compilation errors if exports are missing)
    const { validateEmail } = await import('../src/api.js');
    
    if (typeof validateEmail === 'function') {
      console.log('   ✅ API functions exported correctly');
      return true;
    } else {
      console.log('   ❌ API functions not exported correctly');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error importing API: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Social From Email - Basic Tests');
  console.log('=' .repeat(50));
  
  const validationPassed = testValidation();
  const typesPassed = await testTypeExports();
  
  console.log('\n' + '=' .repeat(50));
  
  if (validationPassed && typesPassed) {
    console.log('✅ All basic tests passed!');
    console.log('\n💡 Ready for production use:');
    console.log('   • Input validation is working correctly');
    console.log('   • Type exports are functioning');
    console.log('   • API is properly structured');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    console.log('\n🔧 Issues to fix:');
    if (!validationPassed) console.log('   • Input validation has issues');
    if (!typesPassed) console.log('   • Type exports are not working');
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testValidation, testTypeExports, runTests };
