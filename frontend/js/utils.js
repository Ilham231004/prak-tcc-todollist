function showAlert(message, type = 'info', title = null) {
    // Remove existing alerts first
    $('.alert').alert('close');
    
    // Set default titles based on type
    const defaultTitles = {
        'success': 'Success!',
        'danger': 'Error!',
        'warning': 'Warning!',
        'info': 'Information'
    };
    
    const alertTitle = title || defaultTitles[type] || 'Notification';
    
    // Create icon based on type
    const icons = {
        'success': 'bi-check-circle-fill',
        'danger': 'bi-exclamation-triangle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    };
    
    const icon = icons[type] || 'bi-info-circle-fill';
    
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show modern-alert" role="alert">
            <div class="d-flex align-items-start">
                <i class="bi ${icon} me-3" style="font-size: 1.25rem; margin-top: 2px;"></i>
                <div class="flex-grow-1">
                    <div class="fw-semibold mb-1">${alertTitle}</div>
                    <div class="alert-message">${message}</div>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    $('#alertContainer').append(alertHtml);
    
    // Auto remove alert after 4 seconds for success, 6 seconds for others
    const timeout = type === 'success' ? 4000 : 6000;
    setTimeout(() => {
        $('.modern-alert').alert('close');
    }, timeout);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isOverdue(dueDateString) {
    if (!dueDateString) return false;
    const dueDate = new Date(dueDateString);
    const now = new Date();
    return dueDate < now;
}

function confirmDelete(message = 'Are you sure you want to delete this item?') {
    return confirm(message);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
