// js/auth.js – Helper functions for authentication

// Get stored JWT token
function getToken() {
    return localStorage.getItem('token');
}

// Get current user object from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated; redirect to login if not
function checkAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

// Check if the current user has admin/owner role
function isAdmin() {
    const user = getCurrentUser();
    return user && (user.roleName === 'Admin' || user.roleName === 'Owner');
}