// Admin Configuration
// Single admin email for V1 - only this user can access the dashboard

export const ADMIN_EMAIL = 'admin@coinsight.app';

// Helper function to check if email is admin
export const isAdminEmail = (email) => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};
