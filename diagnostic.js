// Quick diagnostic script to check what's loaded
console.log('=== DIAGNOSTIC CHECK ===');
console.log('1. TimesheetManager exists:', typeof window.timesheetManager);
console.log('2. Modal functions exist:', typeof window.openModal);
console.log('3. Current user:', localStorage.getItem('currentUser'));
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('4. User role:', currentUser.role);
console.log('5. User ID:', currentUser.id);
console.log('6. Add Employee Button:', document.getElementById('addEmployeeBtn'));
console.log('7. Logout Button:', document.getElementById('logoutBtn'));
console.log('8. Date Input:', document.getElementById('dateInput'));
console.log('9. Activity Modal:', document.getElementById('activityModal'));
console.log('10. Employee Action Modal:', document.getElementById('employeeActionModal'));
console.log('11. Can click activities:', typeof window.timesheetManager?.openActivityModal);
console.log('12. Can request leave:', typeof window.timesheetManager?.openEmployeeActionModal);
console.log('========================');
