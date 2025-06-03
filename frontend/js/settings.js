let originalUserData = {};

$(document).ready(function() {
    // Check authentication
    if (!getAuthToken()) {
        window.location.href = 'index.html';
        return;
    }

    // Load user settings
    loadUserSettings();

    // Event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Logout
    $('#logoutBtn').click(function() {
        if (confirm('Are you sure you want to logout?')) {
            removeAuthToken();
            window.location.href = 'index.html';
        }
    });

    // Settings form submission
    $('#settingsForm').submit(function(e) {
        e.preventDefault();
        updateUserSettings();
    });

    // Cancel changes
    $('#cancelBtn').click(function() {
        resetForm();
    });

    // Image upload buttons
    $('#uploadImageBtn, #changeImageBtn').click(function() {
        $('#imageInput').click();
    });

    // Image input change
    $('#imageInput').change(function() {
        const file = this.files[0];
        if (file) {
            uploadProfileImage(file);
        }
    });

    // Delete image
    $('#deleteImageBtn').click(function() {
        if (confirm('Are you sure you want to remove your profile image?')) {
            deleteProfileImage();
        }
    });
}

function loadUserSettings() {
    $.ajax({
        url: API_ENDPOINTS.users.settings,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                console.log('User settings loaded:', response.data.user);
                populateForm(response.data.user);
                originalUserData = { ...response.data.user };
            } else {
                showAlert('Failed to load user settings: ' + response.message, 'danger');
            }
        },
        error: function(xhr) {
            console.error('Settings load error:', xhr);
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to load user settings', 'danger');
            
            if (xhr.status === 401) {
                removeAuthToken();
                window.location.href = 'index.html';
            }
        }
    });
}

function populateForm(user) {
    console.log('Populating form with user data:', user);
    
    // Populate form fields
    $('#userName').val(user.name || '');
    $('#userEmail').val(user.email || '');
    $('#userId').val(user.id || '');
    
    // Format member since date
    if (user.created_at) {
        const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        $('#memberSince').val(memberSince);
    }

    // Set profile image
    console.log('Setting profile image:', user.image);
    updateProfileImage(user.image);
}

function updateProfileImage(imageUrl) {
    console.log('Updating profile image with URL:', imageUrl);
    
    if (imageUrl) {
        // Add cache buster to force reload
        const cacheBuster = '?t=' + new Date().getTime();
        const fullUrl = imageUrl + cacheBuster;
        
        console.log('Setting image src to:', fullUrl);
        $('#profileImage').attr('src', fullUrl).show();
        $('#profileImagePlaceholder').hide();
        $('#deleteImageBtn').show();
    } else {
        console.log('No image URL, showing placeholder');
        $('#profileImage').hide();
        $('#profileImagePlaceholder').show();
        $('#deleteImageBtn').hide();
    }
}

function updateUserSettings() {
    const formData = {
        name: $('#userName').val(),
        email: $('#userEmail').val()
    };

    // Check if data has changed
    if (formData.name === originalUserData.name && formData.email === originalUserData.email) {
        showAlert('No changes to save.', 'info');
        return;
    }

    $.ajax({
        url: API_ENDPOINTS.users.settings,
        method: 'PUT',
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            if (response.success) {
                showAlert('Settings updated successfully!', 'success');
                originalUserData = { ...response.data.user };
                populateForm(response.data.user);
            } else {
                showAlert(response.message, 'danger');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to update settings', 'danger');
        }
    });
}

function uploadProfileImage(file) {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'warning');
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please select a valid image file (JPG, PNG, GIF)', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    // Show loading state
    const uploadBtn = $('#uploadImageBtn');
    const changeBtn = $('#changeImageBtn');
    const originalUploadText = uploadBtn.html();
    const originalChangeText = changeBtn.html();
    
    uploadBtn.html('<i class="bi bi-hourglass-split"></i> Uploading...').prop('disabled', true);
    changeBtn.prop('disabled', true);

    $.ajax({
        url: API_ENDPOINTS.users.uploadImage,
        method: 'POST',
        headers: getAuthHeaders(),
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (response.success) {
                showAlert('Profile image updated successfully!', 'success');
                updateProfileImage(response.data.user.image);
                originalUserData.image = response.data.user.image;
                
                // Update dashboard profile images if function exists
                if (window.updateProfileImages) {
                    window.updateProfileImages(response.data.user.image);
                }
                
                // Store updated image URL for potential dashboard refresh
                localStorage.setItem('userProfileImage', response.data.user.image);
            } else {
                showAlert(response.message, 'danger');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            console.error('Upload error:', response);
            showAlert(response?.message || 'Failed to upload image. Please try again.', 'danger');
        },
        complete: function() {
            uploadBtn.html(originalUploadText).prop('disabled', false);
            changeBtn.html(originalChangeText).prop('disabled', false);
            $('#imageInput').val(''); // Reset file input
        }
    });
}

function deleteProfileImage() {
    $.ajax({
        url: API_ENDPOINTS.users.deleteImage,
        method: 'DELETE',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                showAlert('Profile image removed successfully!', 'success');
                updateProfileImage(null);
                originalUserData.image = null;
                
                // Update dashboard profile images if function exists
                if (window.updateProfileImages) {
                    window.updateProfileImages(null);
                }
                
                // Remove from localStorage
                localStorage.removeItem('userProfileImage');
            } else {
                showAlert(response.message, 'danger');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to delete image', 'danger');
        }
    });
}

function resetForm() {
    populateForm(originalUserData);
    showAlert('Changes cancelled', 'info');
}
