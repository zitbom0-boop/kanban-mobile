// ==================== //
// State Management
// ==================== //

let tasks = [];
let editingTaskId = null;

// Load tasks from localStorage on init
function loadTasks() {
    const savedTasks = localStorage.getItem('kanbanTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    } else {
        // Add some demo tasks
        tasks = [
            {
                id: generateId(),
                title: 'Design mobile UI mockups',
                description: 'Create high-fidelity mockups for the mobile app interface',
                priority: 'high',
                status: 'inprogress',
                dueDate: '2025-11-30',
                tags: ['design', 'ui', 'urgent']
            },
            {
                id: generateId(),
                title: 'Set up project repository',
                description: 'Initialize Git repository and configure CI/CD pipeline',
                priority: 'medium',
                status: 'done',
                dueDate: '2025-11-25',
                tags: ['devops', 'setup']
            },
            {
                id: generateId(),
                title: 'Research competitor apps',
                description: 'Analyze top 5 competitor apps and document findings',
                priority: 'low',
                status: 'todo',
                dueDate: '2025-12-05',
                tags: ['research', 'analysis']
            }
        ];
        saveTasks();
    }
    renderAllTasks();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== //
// DOM Elements
// ==================== //

const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');

const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskPriorityInput = document.getElementById('taskPriority');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskTagsInput = document.getElementById('taskTags');
const taskStatusInput = document.getElementById('taskStatus');

const todoContainer = document.getElementById('todoTasks');
const inprogressContainer = document.getElementById('inprogressTasks');
const doneContainer = document.getElementById('doneTasks');

// ==================== //
// Modal Functions
// ==================== //

function openModal(taskId = null) {
    editingTaskId = taskId;

    if (taskId) {
        // Edit mode
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            modalTitle.textContent = 'Edit Task';
            submitBtn.textContent = 'Save Changes';
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description || '';
            taskPriorityInput.value = task.priority;
            taskDueDateInput.value = task.dueDate || '';
            taskTagsInput.value = task.tags ? task.tags.join(', ') : '';
            taskStatusInput.value = task.status;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Task';
        submitBtn.textContent = 'Add Task';
        taskForm.reset();
    }

    taskModal.classList.add('active');
    taskTitleInput.focus();
}

function closeModal() {
    taskModal.classList.remove('active');
    taskForm.reset();
    editingTaskId = null;
}

// ==================== //
// Task CRUD Operations
// ==================== //

function addTask(taskData) {
    const newTask = {
        id: generateId(),
        ...taskData
    };
    tasks.push(newTask);
    saveTasks();
    renderTask(newTask);
    updateTaskCounts();
}

function updateTask(taskId, taskData) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
        saveTasks();
        renderAllTasks();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderAllTasks();
}

function moveTask(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        saveTasks();
        renderAllTasks();
    }
}

// ==================== //
// Rendering Functions
// ==================== //

function renderTask(task) {
    const taskCard = createTaskCard(task);
    const container = getContainerByStatus(task.status);
    container.appendChild(taskCard);
}

function renderAllTasks() {
    // Clear all containers
    todoContainer.innerHTML = '';
    inprogressContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    // Render all tasks
    tasks.forEach(task => renderTask(task));

    // Update counts
    updateTaskCounts();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.taskId = task.id;

    // Generate tags HTML
    let tagsHTML = '';
    if (task.tags && task.tags.length > 0) {
        tagsHTML = `
            <div class="task-tags">
                ${task.tags.map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
            </div>
        `;
    }

    // Generate due date HTML with status
    let dueDateHTML = '';
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dueDateClass = '';
        if (diffDays < 0) {
            dueDateClass = 'overdue';
        } else if (diffDays <= 2) {
            dueDateClass = 'due-soon';
        }

        const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        dueDateHTML = `
            <div class="task-meta">
                <span class="due-date ${dueDateClass}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    ${formattedDate}
                </span>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <div class="task-actions">
                <button class="btn-icon btn-edit" aria-label="Edit task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" aria-label="Delete task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        ${tagsHTML}
        ${dueDateHTML}
        <div class="task-footer">
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
        </div>
    `;

    // Add event listeners
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');

    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(task.id);
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Enhanced delete confirmation
        const confirmDelete = confirm(`Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`);
        if (confirmDelete) {
            // Add visual feedback
            card.style.opacity = '0.5';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                deleteTask(task.id);
            }, 200);
        }
    });

    // Add drag event listeners
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

function updateTaskCounts() {
    const counts = {
        todo: tasks.filter(t => t.status === 'todo').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        done: tasks.filter(t => t.status === 'done').length
    };

    document.querySelector('[data-column="todo"]').textContent = counts.todo;
    document.querySelector('[data-column="inprogress"]').textContent = counts.inprogress;
    document.querySelector('[data-column="done"]').textContent = counts.done;
}

function getContainerByStatus(status) {
    switch (status) {
        case 'todo': return todoContainer;
        case 'inprogress': return inprogressContainer;
        case 'done': return doneContainer;
        default: return todoContainer;
    }
}

// ==================== //
// Drag and Drop
// ==================== //

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');

    // Remove drag-over class from all containers
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    if (draggedElement) {
        const taskId = draggedElement.dataset.taskId;
        const newStatus = this.dataset.status;
        moveTask(taskId, newStatus);
    }

    return false;
}

// ==================== //
// Event Listeners
// ==================== //

// Modal controls
addTaskBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Form submission
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Parse tags from comma-separated input
    const tagsInput = taskTagsInput.value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const taskData = {
        title: taskTitleInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        priority: taskPriorityInput.value,
        dueDate: taskDueDateInput.value || null,
        tags: tags,
        status: taskStatusInput.value
    };

    if (editingTaskId) {
        updateTask(editingTaskId, taskData);
    } else {
        addTask(taskData);
    }

    closeModal();
});

// Drag and drop for all containers
const containers = [todoContainer, inprogressContainer, doneContainer];
containers.forEach(container => {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && taskModal.classList.contains('active')) {
        closeModal();
    }

    // Ctrl/Cmd + K to open add task modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openModal();
    }
});

// ==================== //
// Utility Functions
// ==================== //

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== //
// Initialize App
// ==================== //

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});
