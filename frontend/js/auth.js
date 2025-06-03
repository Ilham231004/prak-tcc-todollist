$(document).ready(function() {
    // Check if user is already logged in
    if (getAuthToken()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Toggle between login and register forms
    $('#showRegister').click(function(e) {
        e.preventDefault();
        $('#loginForm').hide();
        $('#registerForm').show();
    });

    $('#showLogin').click(function(e) {
        e.preventDefault();
        $('#registerForm').hide();
        $('#loginForm').show();
    });

    // Handle login form submission
    $('#loginFormElement').submit(function(e) {
        e.preventDefault();
        
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();

        $.ajax({
            url: API_ENDPOINTS.auth.login,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function(response) {
                if (response.success) {
                    setAuthToken(response.data.token);
                    showAlert('Welcome back! Redirecting to dashboard...', 'success', 'Login Successful');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showAlert(response.message, 'danger', 'Login Failed');
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                const errorMessage = response?.message || 'Login failed. Please check your credentials and try again.';
                showAlert(errorMessage, 'danger', 'Login Failed');
            }
        });
    });

    // Handle register form submission
    $('#registerFormElement').submit(function(e) {
        e.preventDefault();
        
        const name = $('#registerName').val();
        const email = $('#registerEmail').val();
        const password = $('#registerPassword').val();

        $.ajax({
            url: API_ENDPOINTS.auth.register,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name, email, password }),
            success: function(response) {
                if (response.success) {
                    setAuthToken(response.data.token);
                    showAlert(`Welcome ${name}! Your account has been created successfully.`, 'success', 'Registration Successful');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showAlert(response.message, 'danger', 'Registration Failed');
                }
            },
            error: function(xhr) {
                const response = xhr.responseJSON;
                const errorMessage = response?.message || 'Registration failed. Please try again.';
                showAlert(errorMessage, 'danger', 'Registration Failed');
            }
        });
    });
});

// Semua endpoint dan payload sudah sesuai backend
