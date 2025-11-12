const firebaseConfig = {
  apiKey: "AIzaSyDB40DNXp8S6bxXmPl0Ft-Y6E_qIRhUkgE",
  authDomain: "library-fb0b6.firebaseapp.com",
  projectId: "library-fb0b6",
  storageBucket: "library-fb0b6.firebasestorage.app",
  messagingSenderId: "374487333649",
  appId: "1:374487333649:web:83f5de2a3b05243242aab0"
};

firebase.initializeApp(firebaseConfig); 

document.addEventListener('DOMContentLoaded', function() {
    // Register
    document.getElementById('register_new').addEventListener('click', function(e) {
        e.preventDefault(); // Stops form from submitting/reloading page
        registerUser();
    });

    // Login
    document.getElementById('log_me_in').addEventListener('click', function(e) {
        e.preventDefault();
        loginUser();
    });
});

function registerUser() {
    const email = document.getElementById('user_email').value; 
    const password = document.getElementById('user_pass').value; 

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        alert('Registration Successful!');
        window.location.href = 'user_portal.html';
    })
    .catch((error) => {
        alert('Error: ' + error.message);
    });
}

function loginUser() {
    const email = document.getElementById('login_email').value;
    const password = document.getElementById('login_password').value;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        window.location.href = 'user_portal.html';
    })
    .catch((error) => {
        alert('Error: ' + error.message);
    });
}

// Form switching functionality 
document.addEventListener('DOMContentLoaded', function() {
    // Switch to login form when "Sign In" link is clicked
    document.querySelector('.register-form .message a').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.register-form').style.display = 'none';
        document.querySelector('.login-form').style.display = 'block';
    });

    // Switch to register form when "Create an account" link is clicked
    document.querySelector('.login-form .message a').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.login-form').style.display = 'none';
        document.querySelector('.register-form').style.display = 'block';
    });

    // Your existing register and login event listeners
    document.getElementById('register_new').addEventListener('click', function(e) {
        e.preventDefault();
        registerUser();
    });

    document.getElementById('log_me_in').addEventListener('click', function(e) {
        e.preventDefault();
        loginUser();
    });
});
