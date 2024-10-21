function login() {
    // Get the values entered in the input fields
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Check if the username is "admin" and the password is "admin"
    if (username === 'admin' && password === 'admin') {
      // Redirect to the dashboard page
      window.location.href = 'attendance.html'; // Change this to the actual path of your dashboard page
    } else {
      // Show an alert if the login credentials are incorrect
      alert('Invalid username or password');
    }
  }