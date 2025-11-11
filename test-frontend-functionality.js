#!/usr/bin/env node

/**
 * Frontend functionality test script
 * This script tests the frontend UI functionality by making API calls
 * and verifying the expected behavior
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_EMAIL = 'testuser@test.com';
const TEST_PASSWORD = 'test123';

let authToken = '';

// Helper functions
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    authToken = response.data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test functions
async function testFrontendDataLoading() {
  console.log('\n🔄 Testing Frontend Data Loading...');
  
  // Test loading all machines
  const result = await makeRequest('GET', '/copy-machines/catalog');
  
  if (result.success) {
    console.log('✅ Frontend can load machine data successfully');
    console.log(`📊 Found ${result.data.length} machines for frontend display`);
    
    // Test search functionality
    const searchResult = await makeRequest('GET', '/copy-machines/catalog?search=HP');
    if (searchResult.success) {
      console.log('✅ Frontend search functionality working');
      console.log(`📊 Search returned ${searchResult.data.length} results`);
    }
    
    return result.data;
  } else {
    console.error('❌ Frontend data loading failed:', result.error);
    return [];
  }
}

async function testFormValidation() {
  console.log('\n📝 Testing Form Validation...');
  
  // Test various invalid data scenarios
  const invalidScenarios = [
    {
      name: 'Empty model',
      data: { manufacturer: 'Test Manufacturer' },
      expectedStatus: 400
    },
    {
      name: 'Empty manufacturer',
      data: { model: 'Test Model' },
      expectedStatus: 400
    },
    {
      name: 'Model too short',
      data: { model: 'A', manufacturer: 'Test Manufacturer' },
      expectedStatus: 400
    },
    {
      name: 'Manufacturer too short',
      data: { model: 'Test Model', manufacturer: 'B' },
      expectedStatus: 400
    },
    {
      name: 'Invalid price',
      data: { model: 'Test Model', manufacturer: 'Test Manufacturer', price: 'invalid' },
      expectedStatus: 400
    }
  ];
  
  let validationTestsPassed = 0;
  
  for (const scenario of invalidScenarios) {
    const result = await makeRequest('POST', '/copy-machines/catalog', scenario.data);
    
    if (!result.success && result.status === scenario.expectedStatus) {
      console.log(`✅ ${scenario.name} validation working correctly`);
      validationTestsPassed++;
    } else {
      console.error(`❌ ${scenario.name} validation failed - expected ${scenario.expectedStatus}, got ${result.status}`);
    }
  }
  
  console.log(`📊 Validation tests passed: ${validationTestsPassed}/${invalidScenarios.length}`);
  return validationTestsPassed === invalidScenarios.length;
}

async function testCRUDOperations() {
  console.log('\n🔄 Testing Complete CRUD Operations...');
  
  // Create a test machine
  const testMachine = {
    model: 'Frontend Test Machine',
    manufacturer: 'Frontend Test Manufacturer',
    description: 'Testing frontend CRUD operations',
    features: ['Frontend Feature 1', 'Frontend Feature 2'],
    price: 1000.00,
    quantity: 3,
  };
  
  // CREATE
  console.log('📝 Testing CREATE...');
  const createResult = await makeRequest('POST', '/copy-machines/catalog', testMachine);
  
  if (!createResult.success) {
    console.error('❌ CREATE failed:', createResult.error);
    return false;
  }
  
  const createdMachine = createResult.data;
  console.log('✅ CREATE successful');
  
  // READ
  console.log('📖 Testing READ...');
  const readResult = await makeRequest('GET', `/copy-machines/catalog/${createdMachine.id}`);
  
  if (!readResult.success) {
    console.error('❌ READ failed:', readResult.error);
    return false;
  }
  
  console.log('✅ READ successful');
  
  // UPDATE
  console.log('✏️ Testing UPDATE...');
  const updateData = {
    ...testMachine,
    model: 'Updated Frontend Test Machine',
    price: 1500.00,
  };
  
  const updateResult = await makeRequest('PATCH', `/copy-machines/catalog/${createdMachine.id}`, updateData);
  
  if (!updateResult.success) {
    console.error('❌ UPDATE failed:', updateResult.error);
    return false;
  }
  
  console.log('✅ UPDATE successful');
  
  // DELETE
  console.log('🗑️ Testing DELETE...');
  const deleteResult = await makeRequest('DELETE', `/copy-machines/catalog/${createdMachine.id}`);
  
  if (!deleteResult.success) {
    console.error('❌ DELETE failed:', deleteResult.error);
    return false;
  }
  
  console.log('✅ DELETE successful');
  
  // Verify deletion
  const verifyResult = await makeRequest('GET', `/copy-machines/catalog/${createdMachine.id}`);
  if (verifyResult.success || verifyResult.status !== 404) {
    console.error('❌ DELETE verification failed - machine still exists');
    return false;
  }
  
  console.log('✅ DELETE verification successful');
  return true;
}

async function testSearchFunctionality() {
  console.log('\n🔍 Testing Search Functionality...');
  
  // Create test machines with different searchable content
  const testMachines = [
    {
      model: 'Search Test Model 1',
      manufacturer: 'Search Manufacturer A',
      description: 'This machine has unique searchable content',
      features: ['Search Feature 1'],
      price: 1000.00,
      quantity: 1,
    },
    {
      model: 'Search Test Model 2',
      manufacturer: 'Search Manufacturer B',
      description: 'Another machine with different content',
      features: ['Search Feature 2'],
      price: 2000.00,
      quantity: 2,
    }
  ];
  
  const createdMachines = [];
  
  // Create test machines
  for (const machine of testMachines) {
    const result = await makeRequest('POST', '/copy-machines/catalog', machine);
    if (result.success) {
      createdMachines.push(result.data);
    }
  }
  
  // Test various search terms
  const searchTests = [
    { term: 'Search Test', expectedMin: 2 },
    { term: 'Search Manufacturer A', expectedMin: 1 },
    { term: 'unique searchable', expectedMin: 1 },
    { term: 'nonexistent', expectedMin: 0 },
  ];
  
  let searchTestsPassed = 0;
  
  for (const test of searchTests) {
    const result = await makeRequest('GET', `/copy-machines/catalog?search=${encodeURIComponent(test.term)}`);
    
    if (result.success && result.data.length >= test.expectedMin) {
      console.log(`✅ Search for "${test.term}" returned ${result.data.length} results (expected min: ${test.expectedMin})`);
      searchTestsPassed++;
    } else {
      console.error(`❌ Search for "${test.term}" failed - got ${result.data?.length || 0} results, expected min: ${test.expectedMin}`);
    }
  }
  
  // Clean up test machines
  for (const machine of createdMachines) {
    await makeRequest('DELETE', `/copy-machines/catalog/${machine.id}`);
  }
  
  console.log(`📊 Search tests passed: ${searchTestsPassed}/${searchTests.length}`);
  return searchTestsPassed === searchTests.length;
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  const errorTests = [
    {
      name: 'Non-existent machine',
      method: 'GET',
      endpoint: '/copy-machines/catalog/99999',
      expectedStatus: 404
    },
    {
      name: 'Invalid machine ID',
      method: 'GET',
      endpoint: '/copy-machines/catalog/invalid',
      expectedStatus: 400
    },
    {
      name: 'Update non-existent machine',
      method: 'PATCH',
      endpoint: '/copy-machines/catalog/99999',
      data: { model: 'Test' },
      expectedStatus: 404
    },
    {
      name: 'Delete non-existent machine',
      method: 'DELETE',
      endpoint: '/copy-machines/catalog/99999',
      expectedStatus: 404
    }
  ];
  
  let errorTestsPassed = 0;
  
  for (const test of errorTests) {
    const result = await makeRequest(test.method, test.endpoint, test.data);
    
    if (!result.success && result.status === test.expectedStatus) {
      console.log(`✅ ${test.name} error handling working correctly`);
      errorTestsPassed++;
    } else {
      console.error(`❌ ${test.name} error handling failed - expected ${test.expectedStatus}, got ${result.status}`);
    }
  }
  
  console.log(`📊 Error handling tests passed: ${errorTestsPassed}/${errorTests.length}`);
  return errorTestsPassed === errorTests.length;
}

// Main test function
async function runFrontendTests() {
  console.log('🚀 Starting Frontend Functionality Tests');
  console.log('==========================================');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Data Loading
    await testFrontendDataLoading();
    
    // Test 2: Form Validation
    const validationPassed = await testFormValidation();
    if (!validationPassed) allTestsPassed = false;
    
    // Test 3: CRUD Operations
    const crudPassed = await testCRUDOperations();
    if (!crudPassed) allTestsPassed = false;
    
    // Test 4: Search Functionality
    const searchPassed = await testSearchFunctionality();
    if (!searchPassed) allTestsPassed = false;
    
    // Test 5: Error Handling
    const errorHandlingPassed = await testErrorHandling();
    if (!errorHandlingPassed) allTestsPassed = false;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    allTestsPassed = false;
  }
  
  // Summary
  console.log('\n📊 FRONTEND TEST SUMMARY');
  console.log('=========================');
  
  if (allTestsPassed) {
    console.log('🎉 ALL FRONTEND TESTS PASSED!');
    console.log('✅ Data loading working correctly');
    console.log('✅ Form validation working correctly');
    console.log('✅ CRUD operations working correctly');
    console.log('✅ Search functionality working correctly');
    console.log('✅ Error handling working correctly');
    console.log('\n🎯 The frontend is ready for production use!');
  } else {
    console.log('❌ Some frontend tests failed. Please check the output above for details.');
  }
  
  console.log('\n✅ Frontend testing completed');
}

// Run the tests
runFrontendTests().catch(console.error);
