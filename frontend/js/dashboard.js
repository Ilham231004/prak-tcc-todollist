let currentPage = 1;
let currentCategory = '';
let currentStatus = '';

$(document).ready(function() {
    // Check authentication
    if (!getAuthToken()) {
        window.location.href = 'index.html';
        return;
    }

    // Load user profile
    loadUserProfile();
    
    // Load initial data
    loadCategories();
    loadTasks();
    loadTaskStats();

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

    // Status filter
    $('#statusFilter').change(function() {
        currentStatus = $(this).val();
        currentPage = 1;
        loadTasks();
    });

    // Category selection
    $(document).on('click', '.category-item', function(e) {
        e.preventDefault();
        $('.category-item').removeClass('active');
        $(this).addClass('active');
        currentCategory = $(this).data('category');
        currentPage = 1;
        loadTasks();
    });

    // Task form submission
    $('#taskForm').submit(function(e) {
        e.preventDefault();
        saveTask();
    });

    // Category form submission
    $('#categoryForm').submit(function(e) {
        e.preventDefault();
        saveCategory();
    });

    // Task actions
    $(document).on('click', '.toggle-task', function() {
        const taskId = $(this).data('id');
        const currentStatus = $(this).data('status');
        toggleTaskStatus(taskId, !currentStatus);
    });

    $(document).on('click', '.edit-task', function() {
        const taskId = $(this).data('id');
        editTask(taskId);
    });

    $(document).on('click', '.delete-task', function() {
        const taskId = $(this).data('id');
        if (confirmDelete('Are you sure you want to delete this task?')) {
            deleteTask(taskId);
        }
    });

    // Category actions
    $(document).on('click', '.edit-category', function(e) {
        e.stopPropagation();
        const categoryId = $(this).data('id');
        editCategory(categoryId);
    });

    $(document).on('click', '.delete-category', function(e) {
        e.stopPropagation();
        const categoryId = $(this).data('id');
        const categoryName = $(this).data('name');
        const taskCount = $(this).data('task-count');
        
        let confirmMessage;
        if (taskCount > 0) {
            confirmMessage = `Are you sure you want to delete "${categoryName}"?\n\nThis category contains ${taskCount} task${taskCount > 1 ? 's' : ''}. You need to move or delete these tasks first before deleting the category.`;
        } else {
            confirmMessage = `Are you sure you want to delete "${categoryName}"?`;
        }
        
        if (confirmDelete(confirmMessage)) {
            deleteCategory(categoryId);
        }
    });

    // Reset forms when modals are closed
    $('#taskModal').on('hidden.bs.modal', function() {
        resetTaskForm();
    });

    $('#categoryModal').on('hidden.bs.modal', function() {
        resetCategoryForm();
    });
}

function loadTaskStats() {
    $.ajax({
        url: API_ENDPOINTS.tasks.stats,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                $('#totalTasks').text(response.data.total);
                $('#completedTasks').text(response.data.completed);
                $('#pendingTasks').text(response.data.pending);
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            console.error('Failed to load task statistics:', response?.message);
        }
    });
}

function loadUserProfile() {
    $.ajax({
        url: API_ENDPOINTS.auth.profile,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                const user = response.data.user;
                console.log('User profile loaded:', user);
                
                // Update all user display elements
                $('#userName').text(user.name);
                $('#dropdownUserName').text(user.name);
                $('#dropdownUserEmail').text(user.email);
                
                // Update profile images
                updateProfileImages(user.image);
            }
        },
        error: function(xhr) {
            console.error('Failed to load user profile:', xhr);
            removeAuthToken();
            window.location.href = 'index.html';
        }
    });
}

function updateProfileImages(imageUrl) {
    console.log('Updating profile images with URL:', imageUrl);
    
    if (imageUrl) {
        // Navigation image
        $('#navProfileImage').attr('src', imageUrl).show();
        $('#navProfilePlaceholder').hide();
        
        // Dropdown image
        $('#dropdownProfileImage').attr('src', imageUrl).show();
        $('#dropdownProfilePlaceholder').hide();
    } else {
        // Show placeholders
        $('#navProfileImage').hide();
        $('#navProfilePlaceholder').show();
        
        $('#dropdownProfileImage').hide();
        $('#dropdownProfilePlaceholder').show();
    }
}

// Make this function globally accessible for settings page
window.updateProfileImages = updateProfileImages;

function loadCategories() {
    $.ajax({
        url: API_ENDPOINTS.categories.base,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                renderCategories(response.data.categories);
                populateCategoryDropdown(response.data.categories);
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to load categories', 'danger');
        }
    });
}

function renderCategories(categories) {
    const categoriesHtml = categories.map(category => {
        const taskCount = category.tasks ? category.tasks.length : 0;
        const completedCount = category.tasks ? category.tasks.filter(task => task.is_done).length : 0;
        
        return `
        <a href="#" class="list-group-item list-group-item-action category-item d-flex justify-content-between align-items-center" 
           data-category="${category.id}">
            <div class="d-flex flex-column">
                <span><i class="bi bi-folder me-2"></i>${category.name}</span>
                ${taskCount > 0 ? `<small class="text-muted">${completedCount}/${taskCount} completed</small>` : '<small class="text-muted">No tasks</small>'}
            </div>
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-secondary btn-sm edit-category" data-id="${category.id}" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm delete-category" data-id="${category.id}" data-name="${category.name}" data-task-count="${taskCount}" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </a>
    `;
    }).join('');

    // Preserve the current active category selection
    const currentActiveCategory = $('.category-item.active').data('category') || '';

    $('#categoriesList').html(`
        <a href="#" class="list-group-item list-group-item-action category-item ${currentActiveCategory === '' ? 'active' : ''}" data-category="">
            <span><i class="bi bi-list-ul me-2"></i>All Tasks</span>
        </a>
        ${categoriesHtml}
    `);

    // Restore active state for selected category
    if (currentActiveCategory !== '') {
        $(`.category-item[data-category="${currentActiveCategory}"]`).addClass('active');
    }
}

function populateCategoryDropdown(categories) {
    const optionsHtml = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
    
    $('#taskCategory').html(`
        <option value="">No Category</option>
        ${optionsHtml}
    `);
}

function loadTasks() {
    const params = new URLSearchParams({
        page: currentPage,
        limit: 10
    });

    if (currentCategory) params.append('category_id', currentCategory);
    if (currentStatus !== '') params.append('is_done', currentStatus);

    $.ajax({
        url: `${API_ENDPOINTS.tasks.base}?${params.toString()}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                renderTasks(response.data.tasks);
                renderPagination(response.data.pagination);
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to load tasks', 'danger');
        }
    });
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        $('#tasksList').html(`
            <div class="empty-state">
                <i class="bi bi-clipboard-x"></i>
                <h5>No tasks found</h5>
                <p>Start by creating your first task!</p>
            </div>
        `);
        return;
    }

    const tasksHtml = tasks.map(task => {
        const dueDate = formatDate(task.due_date);
        const isOverdueTask = isOverdue(task.due_date);
        
        return `
            <div class="card task-card mb-3 ${task.is_done ? 'completed' : ''}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <button class="btn btn-sm ${task.is_done ? 'btn-success' : 'btn-outline-secondary'} me-3 toggle-task" 
                                        data-id="${task.id}" data-status="${task.is_done}">
                                    <i class="bi ${task.is_done ? 'bi-check-square' : 'bi-square'}"></i>
                                </button>
                                <h5 class="task-title mb-0">${task.title}</h5>
                                ${task.category ? `<span class="badge bg-primary ms-2">${task.category.name}</span>` : ''}
                            </div>
                            ${task.description ? `<p class="text-muted mb-2">${task.description}</p>` : ''}
                            ${dueDate ? `<small class="task-due-date ${isOverdueTask ? 'overdue' : ''}">
                                <i class="bi bi-calendar"></i> ${dueDate}
                                ${isOverdueTask ? '<i class="bi bi-exclamation-circle ms-1"></i>' : ''}
                            </small>` : ''}
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group task-actions" role="group">
                                <button class="btn btn-outline-primary btn-sm edit-task" data-id="${task.id}" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm delete-task" data-id="${task.id}" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    $('#tasksList').html(tasksHtml);
}

function renderPagination(pagination) {
    if (pagination.totalPages <= 1) {
        $('#pagination').empty();
        return;
    }

    let paginationHtml = '';

    // Previous button
    if (pagination.page > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page - 1}">Previous</a>
            </li>
        `;
    }

    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.page) {
            paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
    }

    // Next button
    if (pagination.page < pagination.totalPages) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="${pagination.page + 1}">Next</a>
            </li>
        `;
    }

    $('#pagination').html(paginationHtml);

    // Handle pagination clicks
    $('#pagination').off('click', 'a').on('click', 'a', function(e) {
        e.preventDefault();
        currentPage = parseInt($(this).data('page'));
        loadTasks();
    });
}

function saveTask() {
    const taskId = $('#taskId').val();
    const taskData = {
        title: $('#taskTitle').val(),
        description: $('#taskDescription').val(),
        category_id: $('#taskCategory').val() || null,
        due_date: $('#taskDueDate').val() || null
    };

    const url = taskId ? API_ENDPOINTS.tasks.update(taskId) : API_ENDPOINTS.tasks.base;
    const method = taskId ? 'PUT' : 'POST';
    const isEditing = !!taskId;

    $.ajax({
        url: url,
        method: method,
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify(taskData),
        success: function(response) {
            if (response.success) {
                const message = isEditing 
                    ? `Task "${taskData.title}" has been updated successfully.`
                    : `Task "${taskData.title}" has been created successfully.`;
                
                showAlert(message, 'success');
                $('#taskModal').modal('hide');
                loadTasks();
                loadTaskStats();
                loadCategories(); // Refresh categories to update task counts
            } else {
                showAlert(response.message, 'danger', 'Task Error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            const errorMessage = response?.message || `Failed to ${isEditing ? 'update' : 'create'} task. Please try again.`;
            showAlert(errorMessage, 'danger', 'Task Error');
        }
    });
}

function editTask(taskId) {
    $.ajax({
        url: API_ENDPOINTS.tasks.get(taskId),
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                const task = response.data.task;
                $('#taskId').val(task.id);
                $('#taskTitle').val(task.title);
                $('#taskDescription').val(task.description);
                $('#taskCategory').val(task.category_id || '');
                
                if (task.due_date) {
                    const dueDate = new Date(task.due_date);
                    const formattedDate = dueDate.toISOString().slice(0, 16);
                    $('#taskDueDate').val(formattedDate);
                }
                
                $('#taskModalTitle').text('Edit Task');
                $('#taskModal').modal('show');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to load task', 'danger');
        }
    });
}

function deleteTask(taskId) {
    $.ajax({
        url: API_ENDPOINTS.tasks.delete(taskId),
        method: 'DELETE',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                showAlert('Task has been deleted successfully.', 'success');
                loadTasks();
                loadTaskStats();
                loadCategories(); // Refresh categories to update task counts
            } else {
                showAlert(response.message, 'danger', 'Delete Error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            const errorMessage = response?.message || 'Failed to delete task. Please try again.';
            showAlert(errorMessage, 'danger', 'Delete Error');
        }
    });
}

function toggleTaskStatus(taskId, isDone) {
    $.ajax({
        url: API_ENDPOINTS.tasks.update(taskId),
        method: 'PUT',
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify({ is_done: isDone }),
        success: function(response) {
            if (response.success) {
                const statusMessage = isDone 
                    ? 'Task marked as completed!' 
                    : 'Task marked as pending.';
                showAlert(statusMessage, 'success');
                loadTasks();
                loadTaskStats();
                loadCategories(); // Refresh categories to update completion counts
            } else {
                showAlert(response.message, 'danger', 'Update Error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            const errorMessage = response?.message || 'Failed to update task status. Please try again.';
            showAlert(errorMessage, 'danger', 'Update Error');
        }
    });
}

function saveCategory() {
    const categoryId = $('#categoryId').val();
    const categoryData = {
        name: $('#categoryName').val()
    };

    const url = categoryId ? API_ENDPOINTS.categories.update(categoryId) : API_ENDPOINTS.categories.base;
    const method = categoryId ? 'PUT' : 'POST';
    const isEditing = !!categoryId;

    $.ajax({
        url: url,
        method: method,
        headers: getAuthHeaders(),
        contentType: 'application/json',
        data: JSON.stringify(categoryData),
        success: function(response) {
            if (response.success) {
                const message = isEditing 
                    ? `Category "${categoryData.name}" has been updated successfully.`
                    : `Category "${categoryData.name}" has been created successfully.`;
                
                showAlert(message, 'success');
                $('#categoryModal').modal('hide');
                loadCategories();
            } else {
                showAlert(response.message, 'danger', 'Category Error');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            const errorMessage = response?.message || `Failed to ${isEditing ? 'update' : 'create'} category. Please try again.`;
            showAlert(errorMessage, 'danger', 'Category Error');
        }
    });
}

function editCategory(categoryId) {
    $.ajax({
        url: `${API_ENDPOINTS.categories.base}`,
        method: 'GET',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                const category = response.data.categories.find(cat => cat.id == categoryId);
                if (category) {
                    $('#categoryId').val(category.id);
                    $('#categoryName').val(category.name);
                    $('#categoryModalTitle').text('Edit Category');
                    $('#categoryModal').modal('show');
                }
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            showAlert(response?.message || 'Failed to load category', 'danger');
        }
    });
}

function deleteCategory(categoryId) {
    $.ajax({
        url: API_ENDPOINTS.categories.delete(categoryId),
        method: 'DELETE',
        headers: getAuthHeaders(),
        success: function(response) {
            if (response.success) {
                showAlert('Category has been deleted successfully.', 'success');
                loadCategories();
                loadTasks();
            } else {
                showAlert(response.message, 'warning', 'Cannot Delete Category');
            }
        },
        error: function(xhr) {
            const response = xhr.responseJSON;
            
            if (xhr.status === 400) {
                // Show specific error message for categories with tasks
                showAlert(response?.message || 'Cannot delete category that contains tasks.', 'warning', 'Cannot Delete Category');
            } else {
                const errorMessage = response?.message || 'Failed to delete category. Please try again.';
                showAlert(errorMessage, 'danger', 'Delete Error');
            }
        }
    });
}

function resetTaskForm() {
    $('#taskForm')[0].reset();
    $('#taskId').val('');
    $('#taskModalTitle').text('Add New Task');
}

function resetCategoryForm() {
    $('#categoryForm')[0].reset();
    $('#categoryId').val('');
    $('#categoryModalTitle').text('Add New Category');
}

// Semua endpoint, payload, dan response sudah sesuai backend
