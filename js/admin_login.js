function adminLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === "admin" && password === "admin123") {
        localStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'admin_portal.html';
    } else {
        alert("Invalid admin credentials!");
    }
}