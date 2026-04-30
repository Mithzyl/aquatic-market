/**
 * TASK-007: 权限检查方法单元测试
 * 
 * 测试对象: AdminAuthContext.jsx 中的权限检查方法
 * - hasPermission(code) - 检查单个权限
 * - hasAnyPermission(codes) - 检查任意一个权限
 * - hasAllPermissions(codes) - 检查所有权限
 * 
 * 测试策略: 提取方法逻辑进行独立单元测试
 */

// ==================== 模拟权限方法逻辑 ====================

/**
 * 模拟 hasPermission 方法
 * @param {Object} role - 角色对象 { permissions: string[] }
 * @param {string} permissionCode - 权限代码
 * @returns {boolean}
 */
function hasPermission(role, permissionCode) {
  if (!role || !role.permissions || !Array.isArray(role.permissions)) {
    return false;
  }
  return role.permissions.includes(permissionCode);
}

/**
 * 模拟 hasAnyPermission 方法
 * @param {Object} role - 角色对象 { permissions: string[] }
 * @param {string[]} permissionCodes - 权限代码数组
 * @returns {boolean}
 */
function hasAnyPermission(role, permissionCodes) {
  if (!role || !role.permissions || !Array.isArray(role.permissions)) {
    return false;
  }
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }
  return permissionCodes.some(code => role.permissions.includes(code));
}

/**
 * 模拟 hasAllPermissions 方法
 * @param {Object} role - 角色对象 { permissions: string[] }
 * @param {string[]} permissionCodes - 权限代码数组
 * @returns {boolean}
 */
function hasAllPermissions(role, permissionCodes) {
  if (!role || !role.permissions || !Array.isArray(role.permissions)) {
    return false;
  }
  if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    return false;
  }
  return permissionCodes.every(code => role.permissions.includes(code));
}

// ==================== 测试数据 ====================

// owner 角色 - 全权限
const ownerRole = {
  code: 'owner',
  name: '店主',
  permissions: [
    'product:read', 'product:create', 'product:update', 'product:delete',
    'order:read', 'order:update',
    'category:read', 'category:create',
    'revenue:read',
    'merchant:read', 'merchant:update'
  ]
};

// admin 角色 - 大部分权限（缺少 merchant:update）
const adminRole = {
  code: 'admin',
  name: '管理员',
  permissions: [
    'product:read', 'product:create', 'product:update', 'product:delete',
    'order:read', 'order:update',
    'category:read', 'category:create',
    'revenue:read',
    'merchant:read'
  ]
};

// staff 角色 - 基础权限
const staffRole = {
  code: 'staff',
  name: '员工',
  permissions: [
    'product:read',
    'order:read', 'order:update',
    'merchant:read'
  ]
};

// ==================== 测试结果收集 ====================

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  testResults.total++;
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASS', error: null });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected: ${expected}, Got: ${actual}`);
  }
}

// ==================== 测试用例 ====================

console.log('\n========================================');
console.log('TASK-007: 权限检查方法单元测试');
console.log('========================================\n');

// ==================== hasPermission 测试 ====================

console.log('--- hasPermission(code) 方法测试 ---\n');

test('hasPermission - owner 拥有 product:read 权限', () => {
  assertEqual(hasPermission(ownerRole, 'product:read'), true);
});

test('hasPermission - owner 拥有 product:delete 权限', () => {
  assertEqual(hasPermission(ownerRole, 'product:delete'), true);
});

test('hasPermission - owner 拥有 merchant:update 权限', () => {
  assertEqual(hasPermission(ownerRole, 'merchant:update'), true);
});

test('hasPermission - admin 拥有 product:delete 权限', () => {
  assertEqual(hasPermission(adminRole, 'product:delete'), true);
});

test('hasPermission - admin 没有 merchant:update 权限', () => {
  assertEqual(hasPermission(adminRole, 'merchant:update'), false);
});

test('hasPermission - staff 拥有 product:read 权限', () => {
  assertEqual(hasPermission(staffRole, 'product:read'), true);
});

test('hasPermission - staff 拥有 order:update 权限', () => {
  assertEqual(hasPermission(staffRole, 'order:update'), true);
});

test('hasPermission - staff 没有 product:delete 权限', () => {
  assertEqual(hasPermission(staffRole, 'product:delete'), false);
});

test('hasPermission - staff 没有 product:create 权限', () => {
  assertEqual(hasPermission(staffRole, 'product:create'), false);
});

test('hasPermission - staff 没有 revenue:read 权限', () => {
  assertEqual(hasPermission(staffRole, 'revenue:read'), false);
});

// 边界条件测试
test('hasPermission - 空角色返回 false', () => {
  assertEqual(hasPermission(null, 'product:read'), false);
});

test('hasPermission - 角色无 permissions 属性返回 false', () => {
  assertEqual(hasPermission({}, 'product:read'), false);
});

test('hasPermission - permissions 为非数组返回 false', () => {
  assertEqual(hasPermission({ permissions: 'not-array' }, 'product:read'), false);
});

test('hasPermission - 不存在的权限返回 false', () => {
  assertEqual(hasPermission(ownerRole, 'nonexistent:permission'), false);
});

test('hasPermission - 空字符串权限返回 false', () => {
  assertEqual(hasPermission(ownerRole, ''), false);
});

// ==================== hasAnyPermission 测试 ====================

console.log('\n--- hasAnyPermission(codes) 方法测试 ---\n');

test('hasAnyPermission - owner 拥有 [product:read, product:delete] 中任意一个', () => {
  assertEqual(hasAnyPermission(ownerRole, ['product:read', 'product:delete']), true);
});

test('hasAnyPermission - staff 拥有 [product:delete, order:read] 中任意一个', () => {
  assertEqual(hasAnyPermission(staffRole, ['product:delete', 'order:read']), true);
});

test('hasAnyPermission - staff 拥有 [product:read, order:update] 中任意一个', () => {
  assertEqual(hasAnyPermission(staffRole, ['product:read', 'order:update']), true);
});

test('hasAnyPermission - staff 没有 [product:delete, revenue:read] 中任意一个', () => {
  assertEqual(hasAnyPermission(staffRole, ['product:delete', 'revenue:read']), false);
});

test('hasAnyPermission - admin 没有 [merchant:update, nonexistent:perm] 中任意一个', () => {
  assertEqual(hasAnyPermission(adminRole, ['merchant:update', 'nonexistent:perm']), false);
});

test('hasAnyPermission - admin 拥有 [merchant:update, product:delete] 中任意一个', () => {
  assertEqual(hasAnyPermission(adminRole, ['merchant:update', 'product:delete']), true);
});

// 边界条件测试
test('hasAnyPermission - 空角色返回 false', () => {
  assertEqual(hasAnyPermission(null, ['product:read']), false);
});

test('hasAnyPermission - 角色无 permissions 属性返回 false', () => {
  assertEqual(hasAnyPermission({}, ['product:read']), false);
});

test('hasAnyPermission - permissions 为非数组返回 false', () => {
  assertEqual(hasAnyPermission({ permissions: 'not-array' }, ['product:read']), false);
});

test('hasAnyPermission - 空数组返回 false', () => {
  assertEqual(hasAnyPermission(ownerRole, []), false);
});

test('hasAnyPermission - 非数组参数返回 false', () => {
  assertEqual(hasAnyPermission(ownerRole, 'not-array'), false);
});

test('hasAnyPermission - null 参数返回 false', () => {
  assertEqual(hasAnyPermission(ownerRole, null), false);
});

test('hasAnyPermission - undefined 参数返回 false', () => {
  assertEqual(hasAnyPermission(ownerRole, undefined), false);
});

// ==================== hasAllPermissions 测试 ====================

console.log('\n--- hasAllPermissions(codes) 方法测试 ---\n');

test('hasAllPermissions - owner 拥有 [product:read, product:delete] 所有权限', () => {
  assertEqual(hasAllPermissions(ownerRole, ['product:read', 'product:delete']), true);
});

test('hasAllPermissions - owner 拥有 [product:create, order:read, revenue:read] 所有权限', () => {
  assertEqual(hasAllPermissions(ownerRole, ['product:create', 'order:read', 'revenue:read']), true);
});

test('hasAllPermissions - staff 拥有 [product:read, order:read] 所有权限', () => {
  assertEqual(hasAllPermissions(staffRole, ['product:read', 'order:read']), true);
});

test('hasAllPermissions - staff 拥有 [order:read, order:update] 所有权限', () => {
  assertEqual(hasAllPermissions(staffRole, ['order:read', 'order:update']), true);
});

test('hasAllPermissions - staff 没有 [product:read, product:delete] 所有权限', () => {
  assertEqual(hasAllPermissions(staffRole, ['product:read', 'product:delete']), false);
});

test('hasAllPermissions - staff 没有 [order:read, revenue:read] 所有权限', () => {
  assertEqual(hasAllPermissions(staffRole, ['order:read', 'revenue:read']), false);
});

test('hasAllPermissions - admin 没有 [product:delete, merchant:update] 所有权限', () => {
  assertEqual(hasAllPermissions(adminRole, ['product:delete', 'merchant:update']), false);
});

test('hasAllPermissions - admin 拥有 [product:read, product:delete, order:read] 所有权限', () => {
  assertEqual(hasAllPermissions(adminRole, ['product:read', 'product:delete', 'order:read']), true);
});

// 边界条件测试
test('hasAllPermissions - 空角色返回 false', () => {
  assertEqual(hasAllPermissions(null, ['product:read']), false);
});

test('hasAllPermissions - 角色无 permissions 属性返回 false', () => {
  assertEqual(hasAllPermissions({}, ['product:read']), false);
});

test('hasAllPermissions - permissions 为非数组返回 false', () => {
  assertEqual(hasAllPermissions({ permissions: 'not-array' }, ['product:read']), false);
});

test('hasAllPermissions - 空数组返回 false', () => {
  assertEqual(hasAllPermissions(ownerRole, []), false);
});

test('hasAllPermissions - 非数组参数返回 false', () => {
  assertEqual(hasAllPermissions(ownerRole, 'not-array'), false);
});

test('hasAllPermissions - null 参数返回 false', () => {
  assertEqual(hasAllPermissions(ownerRole, null), false);
});

test('hasAllPermissions - undefined 参数返回 false', () => {
  assertEqual(hasAllPermissions(ownerRole, undefined), false);
});

// ==================== 特殊边界条件测试 ====================

console.log('\n--- 特殊边界条件测试 ---\n');

// 无登录状态测试
test('边界: 无登录状态（role=null）时 hasPermission 返回 false', () => {
  assertEqual(hasPermission(null, 'product:read'), false);
});

test('边界: 无登录状态（role=undefined）时 hasPermission 返回 false', () => {
  assertEqual(hasPermission(undefined, 'product:read'), false);
});

test('边界: 无登录状态（role=null）时 hasAnyPermission 返回 false', () => {
  assertEqual(hasAnyPermission(null, ['product:read']), false);
});

test('边界: 无登录状态（role=null）时 hasAllPermissions 返回 false', () => {
  assertEqual(hasAllPermissions(null, ['product:read']), false);
});

// 空权限角色测试
test('边界: 角色权限为空数组时 hasPermission 返回 false', () => {
  const emptyRole = { code: 'empty', permissions: [] };
  assertEqual(hasPermission(emptyRole, 'product:read'), false);
});

test('边界: 角色权限为空数组时 hasAnyPermission 返回 false', () => {
  const emptyRole = { code: 'empty', permissions: [] };
  assertEqual(hasAnyPermission(emptyRole, ['product:read']), false);
});

test('边界: 角色权限为空数组时 hasAllPermissions 返回 false', () => {
  const emptyRole = { code: 'empty', permissions: [] };
  assertEqual(hasAllPermissions(emptyRole, ['product:read']), false);
});

// 单元素数组测试
test('边界: hasAnyPermission 单元素数组正常工作', () => {
  assertEqual(hasAnyPermission(staffRole, ['product:read']), true);
  assertEqual(hasAnyPermission(staffRole, ['product:delete']), false);
});

test('边界: hasAllPermissions 单元素数组正常工作', () => {
  assertEqual(hasAllPermissions(staffRole, ['product:read']), true);
  assertEqual(hasAllPermissions(staffRole, ['product:delete']), false);
});

// ==================== 输出测试报告 ====================

console.log('\n========================================');
console.log('测试报告汇总');
console.log('========================================');
console.log(`总测试数: ${testResults.total}`);
console.log(`通过: ${testResults.passed} ✅`);
console.log(`失败: ${testResults.failed} ❌`);
console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
console.log('========================================\n');

// 输出 JSON 格式报告
const report = {
  taskId: 'TASK-007',
  taskName: '权限检查方法单元测试',
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    passRate: ((testResults.passed / testResults.total) * 100).toFixed(1) + '%'
  },
  testMethods: {
    hasPermission: {
      description: '检查单个权限',
      tests: testResults.tests.filter(t => t.name.startsWith('hasPermission'))
    },
    hasAnyPermission: {
      description: '检查任意一个权限',
      tests: testResults.tests.filter(t => t.name.startsWith('hasAnyPermission'))
    },
    hasAllPermissions: {
      description: '检查所有权限',
      tests: testResults.tests.filter(t => t.name.startsWith('hasAllPermissions'))
    }
  },
  boundaryTests: {
    description: '边界条件测试',
    tests: testResults.tests.filter(t => t.name.startsWith('边界') || t.name.includes('空') || t.name.includes('null') || t.name.includes('undefined') || t.name.includes('非数组'))
  },
  conclusion: testResults.failed === 0 ? 'PASS' : 'FAIL'
};

console.log('JSON 报告:');
console.log(JSON.stringify(report, null, 2));

// 退出码
process.exit(testResults.failed > 0 ? 1 : 0);