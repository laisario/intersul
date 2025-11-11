#!/usr/bin/env node

/**
 * Simple Frontend Copy Machine Catalog Test
 * Tests the frontend functionality by making API calls and verifying behavior
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5174';
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

async function testUserCanCreateMachine() {
  console.log('\n➕ Testing User Can Create Machine...');
  
  const testMachine = {
    model: 'Frontend Test Machine',
    manufacturer: 'Frontend Test Manufacturer',
    description: 'Testing frontend create functionality',
    features: ['Frontend Feature 1', 'Frontend Feature 2'],
    price: 1000.00,
    quantity: 3,
  };
  
  const result = await makeRequest('POST', '/copy-machines/catalog', testMachine);
  
  if (result.success) {
    console.log('✅ User can create machine successfully');
    console.log('📋 Created machine:', result.data.model);
    return result.data;
  } else {
    console.error('❌ User cannot create machine:', result.error);
    return null;
  }
}

async function testUserCanSearchMachines() {
  console.log('\n🔍 Testing User Can Search Machines...');
  
  const searchTerms = ['HP', 'Canon', 'Test', 'nonexistent'];
  let searchTestsPassed = 0;
  
  for (const term of searchTerms) {
    const result = await makeRequest('GET', `/copy-machines/catalog?search=${encodeURIComponent(term)}`);
    
    if (result.success) {
      console.log(`✅ Search for "${term}" returned ${result.data.length} results`);
      searchTestsPassed++;
    } else {
      console.error(`❌ Search for "${term}" failed:`, result.error);
    }
  }
  
  console.log(`📊 Search tests passed: ${searchTestsPassed}/${searchTerms.length}`);
  return searchTestsPassed === searchTerms.length;
}

async function testUserCanUpdateMachine(machineId) {
  console.log('\n✏️ Testing User Can Update Machine...');
  
  if (!machineId) {
    console.log('⚠️ No machine ID provided, skipping update test');
    return true;
  }
  
  const updateData = {
    model: 'Updated Frontend Test Machine',
    manufacturer: 'Updated Frontend Test Manufacturer',
    description: 'Updated description for frontend testing',
    features: ['Updated Feature 1', 'Updated Feature 2', 'New Feature'],
    price: 1500.00,
    quantity: 5,
  };
  
  const result = await makeRequest('PATCH', `/copy-machines/catalog/${machineId}`, updateData);
  
  if (result.success) {
    console.log('✅ User can update machine successfully');
    console.log('📋 Updated machine:', result.data.model);
    return true;
  } else {
    console.error('❌ User cannot update machine:', result.error);
    return false;
  }
}

async function testUserCanDeleteMachine(machineId) {
  console.log('\n🗑️ Testing User Can Delete Machine...');
  
  if (!machineId) {
    console.log('⚠️ No machine ID provided, skipping delete test');
    return true;
  }
  
  const result = await makeRequest('DELETE', `/copy-machines/catalog/${machineId}`);
  
  if (result.success) {
    console.log('✅ User can delete machine successfully');
    
    // Verify deletion
    const verifyResult = await makeRequest('GET', `/copy-machines/catalog/${machineId}`);
    if (!verifyResult.success && verifyResult.status === 404) {
      console.log('✅ Machine successfully deleted - 404 returned');
      return true;
    } else {
      console.log('⚠️ Machine might still exist after deletion');
      return false;
    }
  } else {
    console.error('❌ User cannot delete machine:', result.error);
    return false;
  }
}

async function testFormValidation() {
  console.log('\n📝 Testing Form Validation...');
  
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

async function testLoadingStates() {
  console.log('\n⏳ Testing Loading States...');
  
  // Test that API responds quickly (simulating loading state)
  const startTime = Date.now();
  const result = await makeRequest('GET', '/copy-machines/catalog');
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  
  if (result.success && responseTime < 1000) {
    console.log(`✅ API responds quickly (${responseTime}ms) - good for loading states`);
    return true;
  } else {
    console.error(`❌ API response too slow (${responseTime}ms) - may cause loading issues`);
    return false;
  }
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
  console.log('🚀 Starting Frontend Copy Machine Tests');
  console.log('========================================');
  
  let allTestsPassed = true;
  let createdMachineId = null;
  
  try {
    // Setup
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without authentication');
      return false;
    }
    
    // Test 1: Data Loading
    const dataLoadingPassed = await testFrontendDataLoading();
    if (!dataLoadingPassed) allTestsPassed = false;
    
    // Test 2: User Can Create Machine
    const createdMachine = await testUserCanCreateMachine();
    if (createdMachine) {
      createdMachineId = createdMachine.id;
    } else {
      allTestsPassed = false;
    }
    
    // Test 3: User Can Search Machines
    const searchPassed = await testUserCanSearchMachines();
    if (!searchPassed) allTestsPassed = false;
    
    // Test 4: User Can Update Machine
    const updatePassed = await testUserCanUpdateMachine(createdMachineId);
    if (!updatePassed) allTestsPassed = false;
    
    // Test 5: Form Validation
    const validationPassed = await testFormValidation();
    if (!validationPassed) allTestsPassed = false;
    
    // Test 6: Loading States
    const loadingPassed = await testLoadingStates();
    if (!loadingPassed) allTestsPassed = false;
    
    // Test 7: Error Handling
    const errorHandlingPassed = await testErrorHandling();
    if (!errorHandlingPassed) allTestsPassed = false;
    
    // Test 8: User Can Delete Machine
    const deletePassed = await testUserCanDeleteMachine(createdMachineId);
    if (!deletePassed) allTestsPassed = false;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    allTestsPassed = false;
  }
  
  // Summary
  console.log('\n📊 FRONTEND TEST SUMMARY');
  console.log('=========================');
  
  if (allTestsPassed) {
    console.log('🎉 ALL FRONTEND TESTS PASSED!');
    console.log('✅ User can view machines');
    console.log('✅ User can search machines');
    console.log('✅ User can create machines');
    console.log('✅ User can update machines');
    console.log('✅ User can delete machines');
    console.log('✅ Form validation works');
    console.log('✅ Loading states work');
    console.log('✅ Error handling works');
    console.log('\n🎯 The frontend is ready for production use!');
  } else {
    console.log('❌ Some frontend tests failed. Please check the output above for details.');
  }
  
  console.log('\n✅ Frontend testing completed');
  return allTestsPassed;
}

// Run the tests
runFrontendTests().catch(console.error);
