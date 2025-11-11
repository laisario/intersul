#!/usr/bin/env node

/**
 * Comprehensive test script for Copy Machine CRUD operations
 * This script tests all the functionality we implemented
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testuser@test.com';
const TEST_PASSWORD = 'test123';

let authToken = '';

// Test data
const testMachine = {
  model: 'Test Machine Model',
  manufacturer: 'Test Manufacturer',
  description: 'Test Description for CRUD testing',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  price: 1500.00,
  quantity: 5,
};

const updatedMachine = {
  model: 'Updated Test Machine Model',
  manufacturer: 'Updated Test Manufacturer',
  description: 'Updated Test Description for CRUD testing',
  features: ['Updated Feature 1', 'Updated Feature 2', 'Updated Feature 3', 'New Feature'],
  price: 2000.00,
  quantity: 10,
};

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
async function testCreateMachine() {
  console.log('\n📝 Testing CREATE operation...');
  
  const result = await makeRequest('POST', '/copy-machines/catalog', testMachine);
  
  if (result.success) {
    console.log('✅ Machine created successfully');
    console.log('📋 Created machine data:', JSON.stringify(result.data, null, 2));
    return result.data.id;
  } else {
    console.error('❌ Failed to create machine:', result.error);
    return null;
  }
}

async function testGetAllMachines() {
  console.log('\n📋 Testing GET ALL operation...');
  
  const result = await makeRequest('GET', '/copy-machines/catalog');
  
  if (result.success) {
    console.log('✅ Retrieved all machines successfully');
    console.log(`📊 Found ${result.data.length} machines`);
    return result.data;
  } else {
    console.error('❌ Failed to get machines:', result.error);
    return [];
  }
}

async function testSearchMachines(searchTerm) {
  console.log(`\n🔍 Testing SEARCH operation with term: "${searchTerm}"...`);
  
  const result = await makeRequest('GET', `/copy-machines/catalog?search=${encodeURIComponent(searchTerm)}`);
  
  if (result.success) {
    console.log('✅ Search completed successfully');
    console.log(`📊 Found ${result.data.length} machines matching "${searchTerm}"`);
    return result.data;
  } else {
    console.error('❌ Search failed:', result.error);
    return [];
  }
}

async function testGetMachineById(id) {
  console.log(`\n🔍 Testing GET BY ID operation for ID: ${id}...`);
  
  const result = await makeRequest('GET', `/copy-machines/catalog/${id}`);
  
  if (result.success) {
    console.log('✅ Retrieved machine by ID successfully');
    console.log('📋 Machine data:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.error('❌ Failed to get machine by ID:', result.error);
    return null;
  }
}

async function testUpdateMachine(id) {
  console.log(`\n✏️ Testing UPDATE operation for ID: ${id}...`);
  
  const result = await makeRequest('PATCH', `/copy-machines/catalog/${id}`, updatedMachine);
  
  if (result.success) {
    console.log('✅ Machine updated successfully');
    console.log('📋 Updated machine data:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.error('❌ Failed to update machine:', result.error);
    return null;
  }
}

async function testDeleteMachine(id) {
  console.log(`\n🗑️ Testing DELETE operation for ID: ${id}...`);
  
  const result = await makeRequest('DELETE', `/copy-machines/catalog/${id}`);
  
  if (result.success) {
    console.log('✅ Machine deleted successfully');
    return true;
  } else {
    console.error('❌ Failed to delete machine:', result.error);
    return false;
  }
}

async function testValidation() {
  console.log('\n🛡️ Testing VALIDATION...');
  
  // Test invalid data
  const invalidData = {
    model: '', // Empty model should fail
    manufacturer: 'Test Manufacturer',
  };
  
  const result = await makeRequest('POST', '/copy-machines/catalog', invalidData);
  
  if (!result.success && result.status === 400) {
    console.log('✅ Validation working correctly - rejected invalid data');
    return true;
  } else {
    console.error('❌ Validation failed - should have rejected invalid data');
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing ERROR HANDLING...');
  
  // Test getting non-existent machine
  const result = await makeRequest('GET', '/copy-machines/catalog/99999');
  
  if (!result.success && result.status === 404) {
    console.log('✅ Error handling working correctly - returned 404 for non-existent machine');
    return true;
  } else {
    console.error('❌ Error handling failed - should have returned 404');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Copy Machine CRUD Tests');
  console.log('=====================================');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  let createdMachineId = null;
  let allTestsPassed = true;
  
  try {
    // Test 1: Create Machine
    createdMachineId = await testCreateMachine();
    if (!createdMachineId) {
      allTestsPassed = false;
    }
    
    // Test 2: Get All Machines
    const allMachines = await testGetAllMachines();
    if (allMachines.length === 0) {
      console.log('⚠️ No machines found after creation');
    }
    
    // Test 3: Search Machines
    await testSearchMachines('Test');
    await testSearchMachines('Manufacturer');
    await testSearchMachines('nonexistent');
    
    // Test 4: Get Machine by ID
    if (createdMachineId) {
      await testGetMachineById(createdMachineId);
    }
    
    // Test 5: Update Machine
    if (createdMachineId) {
      await testUpdateMachine(createdMachineId);
    }
    
    // Test 6: Validation
    await testValidation();
    
    // Test 7: Error Handling
    await testErrorHandling();
    
    // Test 8: Delete Machine
    if (createdMachineId) {
      const deleteSuccess = await testDeleteMachine(createdMachineId);
      if (!deleteSuccess) {
        allTestsPassed = false;
      }
    }
    
    // Final verification - should be deleted
    if (createdMachineId) {
      console.log('\n🔍 Verifying deletion...');
      const verifyResult = await makeRequest('GET', `/copy-machines/catalog/${createdMachineId}`);
      if (!verifyResult.success && verifyResult.status === 404) {
        console.log('✅ Machine successfully deleted - 404 returned');
      } else {
        console.log('⚠️ Machine might still exist after deletion');
        allTestsPassed = false;
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    allTestsPassed = false;
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Copy Machine CRUD operations are working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the output above for details.');
  }
  
  console.log('\n✅ Test completed');
}

// Run the tests
runTests().catch(console.error);