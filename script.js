// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const taskContainer = document.getElementById('tasks-container');
    const notesContainer = document.getElementById('notes-container');
    const historyContainer = document.getElementById('history-container');
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    const themeSwitch = document.getElementById('theme-switch');
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const sections = document.querySelectorAll('.section');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addNoteBtn = document.getElementById('add-note-btn');
    const taskModal = document.getElementById('task-modal');
    const noteModal = document.getElementById('note-modal');
    const closeBtns = document.querySelectorAll('.close');
    const taskForm = document.getElementById('task-form');
    const noteForm = document.getElementById('note-form');
    const commandInput = document.getElementById('command-input');
    const sendCommand = document.getElementById('send-command');
    const assistantMessages = document.getElementById('assistant-messages');
    
    // Mobile navigation elements
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const assistantToggle = document.querySelector('.assistant-toggle');
    const closeSidebarBtn = document.querySelector('.close-sidebar-btn');
    const closeAssistantBtn = document.querySelector('.close-assistant-btn');
    const sidebar = document.querySelector('.sidebar');
    const taskAssistant = document.querySelector('.task-assistant');
    const overlay = document.querySelector('.overlay');

    // Data Storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let history = JSON.parse(localStorage.getItem('history')) || [];
    
    // Mobile navigation handling
    function setupMobileNavigation() {
        // Open sidebar on mobile
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', function() {
                sidebar.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }
        
        // Close sidebar
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', function() {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Open assistant on mobile
        if (assistantToggle) {
            assistantToggle.addEventListener('click', function() {
                taskAssistant.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Focus on the input field
                if (commandInput) {
                    setTimeout(() => commandInput.focus(), 300);
                }
            });
        }
        
        // Close assistant
        if (closeAssistantBtn) {
            closeAssistantBtn.addEventListener('click', function() {
                taskAssistant.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close all mobile panels when clicking overlay
        if (overlay) {
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                taskAssistant.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close mobile navigation when a nav item is clicked
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                // Reset everything when resizing to desktop
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                
                if (window.innerWidth > 992) {
                    taskAssistant.classList.remove('active');
                }
            }
        });
        
        // Auto-hide assistant on small screens after inactivity
        let assistantTimer;
        
        function setupAssistantAutoHide() {
            if (window.innerWidth <= 480) {
                clearTimeout(assistantTimer);
                assistantTimer = setTimeout(() => {
                    if (taskAssistant.classList.contains('active')) {
                        taskAssistant.classList.remove('active');
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }, 15000); // Auto-hide after 15 seconds of inactivity
            }
        }
        
        // Reset the timer when the user interacts with the assistant
        if (commandInput) {
            commandInput.addEventListener('focus', () => clearTimeout(assistantTimer));
            commandInput.addEventListener('input', () => clearTimeout(assistantTimer));
        }
        
        if (sendCommand) {
            sendCommand.addEventListener('mousedown', () => clearTimeout(assistantTimer));
        }
        
        // Reset timer when a message is sent or received
        const originalAddAssistantMessage = addAssistantMessage;
        addAssistantMessage = function(message) {
            originalAddAssistantMessage(message);
            clearTimeout(assistantTimer);
            setupAssistantAutoHide();
        };
        
        const originalAddUserMessage = addUserMessage;
        addUserMessage = function(message) {
            originalAddUserMessage(message);
            clearTimeout(assistantTimer);
        };
        
        // Touch events for the assistant area
        if (assistantMessages) {
            assistantMessages.addEventListener('touchstart', () => clearTimeout(assistantTimer));
            assistantMessages.addEventListener('touchmove', () => clearTimeout(assistantTimer));
            assistantMessages.addEventListener('touchend', () => setupAssistantAutoHide());
        }
    }

    // Initialize the app
    function init() {
        updateDateTime();
        renderTasks();
        renderNotes();
        renderHistory();
        initTheme();
        setupMobileNavigation(); // Setup responsive navigation
        setupQuickActions(); // Setup quick action buttons
        setupAIToolImages(); // Setup AI tool image error handling
        setupAIToolsButtons(); // Setup AI tools buttons
        setupClearHistoryButton(); // Setup clear history button
        setupConfirmDialog(); // Setup custom confirmation dialog
        setupMobileKeyboardHandling(); // Setup mobile keyboard handling
        
        // Set interval for date and time update
        setInterval(updateDateTime, 1000);
        
        // Check for day change to move completed tasks to history
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('lastDate');
        
        if (lastDate && lastDate !== today) {
            movePastTasksToHistory();
        }
        
        localStorage.setItem('lastDate', today);
    }

    // Update date and time
    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
        
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Theme initialization
    function initTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        if (currentTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
        }
        
        themeSwitch.addEventListener('change', () => {
            if (themeSwitch.checked) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Navigation handling
    navItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked item and corresponding section
            item.classList.add('active');
            sections[index].classList.add('active');
        });
    });

    // Task rendering
    function renderTasks() {
        if (!taskContainer) return;
        taskContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            taskContainer.innerHTML = `
                <div class="empty-state">
                    <p>No tasks for today. Add a task to get started!</p>
                </div>
            `;
            return;
        }
        
        tasks.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeA - dateTimeB;
        });
        
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('task-item');
            if (task.priority === 'high') {
                taskElement.style.borderLeft = '4px solid var(--danger-color)';
            } else if (task.priority === 'medium') {
                taskElement.style.borderLeft = '4px solid var(--warning-color)';
            } else {
                taskElement.style.borderLeft = '4px solid var(--success-color)';
            }
            
            // Format date and time for display
            const taskDate = new Date(`${task.date}T${task.time}`);
            let formattedDate, formattedTime;
            
            // Check if date is valid before formatting
            if (!isNaN(taskDate.getTime())) {
                formattedDate = taskDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                formattedTime = taskDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                formattedDate = task.date || 'Invalid date';
                formattedTime = task.time || 'Invalid time';
            }
            
            taskElement.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}">
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-time">${formattedDate} at ${formattedTime}</div>
                </div>
                <div class="task-actions">
                    <i class="fas fa-edit" data-id="${task.id}"></i>
                    <i class="fas fa-trash-alt" data-id="${task.id}"></i>
                </div>
            `;
            
            taskContainer.appendChild(taskElement);
            
            // Add event listeners to the checkbox
            const checkbox = taskElement.querySelector(`#task-${task.id}`);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    // Add task to history as completed
                    const historyItem = {
                        id: Date.now(),
                        title: task.title,
                        date: task.date,
                        time: task.time,
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    };
                    
                    history.push(historyItem);
                    localStorage.setItem('history', JSON.stringify(history));
                    
                    // Remove task from tasks array
                    tasks = tasks.filter(t => t.id !== task.id);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    
                    // Show success message in assistant
                    addAssistantMessage(`Great job! You've completed the task: "${task.title}" 🎉`);
                    
                    // Re-render tasks after a short delay
                    setTimeout(() => {
                        renderTasks();
                        renderHistory();
                    }, 500);
                }
            });
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.task-actions .fa-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.getAttribute('data-id'));
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.task-actions .fa-trash-alt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.getAttribute('data-id'));
                deleteTask(taskId);
            });
        });
    }

    // Edit task
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Fill the form
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-date').value = task.date;
        document.getElementById('task-time').value = task.time;
        document.getElementById('task-priority').value = task.priority;
        
        // Store the taskId for update
        taskForm.setAttribute('data-edit-id', taskId);
        
        // Change button text
        taskForm.querySelector('button[type="submit"]').textContent = 'Update Task';
        
        // Show modal
        taskModal.style.display = 'flex';
    }

    // Delete task
    function deleteTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Add to history as deleted
        const historyItem = {
            id: Date.now(),
            title: task.title,
            date: task.date,
            time: task.time,
            status: 'deleted',
            deletedAt: new Date().toISOString()
        };
        
        history.push(historyItem);
        localStorage.setItem('history', JSON.stringify(history));
        
        // Remove from tasks
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // Re-render
        renderTasks();
        renderHistory();
        
        // Show message in assistant
        addAssistantMessage(`Task "${task.title}" has been deleted.`);
    }

    // Note rendering
    function renderNotes() {
        if (!notesContainer) return;
        notesContainer.innerHTML = '';
        
        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No notes yet. Create one to get started!</p>
                </div>
            `;
            return;
        }
        
        notes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-item');
            
            noteElement.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${note.title}</div>
                    <div class="note-actions">
                        <i class="fas fa-edit" data-id="${note.id}"></i>
                        <i class="fas fa-trash-alt" data-id="${note.id}"></i>
                    </div>
                </div>
                <div class="note-content">
                    ${note.content}
                </div>
            `;
            
            notesContainer.appendChild(noteElement);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.note-actions .fa-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = parseInt(e.target.getAttribute('data-id'));
                editNote(noteId);
            });
        });
        
        document.querySelectorAll('.note-actions .fa-trash-alt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = parseInt(e.target.getAttribute('data-id'));
                deleteNote(noteId);
            });
        });
    }

    // Edit note
    function editNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        // Fill the form
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        
        // Store the noteId for update
        noteForm.setAttribute('data-edit-id', noteId);
        
        // Change button text
        noteForm.querySelector('button[type="submit"]').textContent = 'Update Note';
        
        // Show modal
        noteModal.style.display = 'flex';
    }

    // Delete note
    function deleteNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        notes = notes.filter(n => n.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Re-render
        renderNotes();
        
        // Show message in assistant
        addAssistantMessage(`Note "${note.title}" has been deleted.`);
    }

    // History rendering
    function renderHistory() {
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        
        if (history.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <p>No history yet. Complete or delete tasks to see them here.</p>
                </div>
            `;
            return;
        }
        
        // Sort history by date (newest first)
        history.sort((a, b) => {
            const dateA = a.completedAt || a.deletedAt;
            const dateB = b.completedAt || b.deletedAt;
            return new Date(dateB) - new Date(dateA);
        });
        
        history.forEach(item => {
            const historyElement = document.createElement('div');
            historyElement.classList.add('history-item');
            
            const itemDate = new Date(item.completedAt || item.deletedAt);
            const formattedDate = itemDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const formattedTime = itemDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            historyElement.innerHTML = `
                <div class="history-status ${item.status}">
                    <i class="fas ${item.status === 'completed' ? 'fa-check' : 'fa-times'}"></i>
                </div>
                <div class="history-content">
                    <div class="history-title">${item.title}</div>
                    <div class="history-date">
                        ${item.status === 'completed' ? 'Completed' : 'Deleted'} on ${formattedDate} at ${formattedTime}
                    </div>
                </div>
            `;
            
            historyContainer.appendChild(historyElement);
        });
    }

    // Move past tasks to history
    function movePastTasksToHistory() {
        const today = new Date().setHours(0, 0, 0, 0);
        const pastTasks = tasks.filter(task => {
            const taskDate = new Date(task.date).setHours(0, 0, 0, 0);
            return taskDate < today;
        });
        
        if (pastTasks.length > 0) {
            pastTasks.forEach(task => {
                // Add to history as expired
                const historyItem = {
                    id: Date.now() + Math.random(),
                    title: task.title,
                    date: task.date,
                    time: task.time,
                    status: 'deleted',
                    deletedAt: new Date().toISOString()
                };
                
                history.push(historyItem);
            });
            
            // Remove past tasks
            tasks = tasks.filter(task => {
                const taskDate = new Date(task.date).setHours(0, 0, 0, 0);
                return taskDate >= today;
            });
            
            // Save to localStorage
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('history', JSON.stringify(history));
        }
    }

    // Add assistant message
    function addAssistantMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', 'assistant');
        msgElement.innerHTML = `<p>${message}</p>`;
        
        assistantMessages.appendChild(msgElement);
        
        // Ensure smooth scrolling to the bottom
        setTimeout(() => {
            assistantMessages.scrollTo({
                top: assistantMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
        
        // Show assistant on mobile when a message is added
        if (window.innerWidth <= 992 && !taskAssistant.classList.contains('active')) {
            taskAssistant.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function addUserMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.classList.add('message', 'user');
        msgElement.innerHTML = `<p>${message}</p>`;
        
        assistantMessages.appendChild(msgElement);
        
        // Ensure smooth scrolling to the bottom
        setTimeout(() => {
            assistantMessages.scrollTo({
                top: assistantMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Process command from the assistant
    function processCommand(command) {
        command = command.trim().toLowerCase();
        
        // Add task command: add [task] [date] [time]
        if (command.startsWith('add ')) {
            // Check if there are multiple tasks separated by commas
            if (command.includes(',')) {
                const taskCommands = command.split(',');
                let allTasksAdded = true;
                let addedTasks = [];
                
                for (const taskCommand of taskCommands) {
                    const trimmedCommand = taskCommand.trim();
                    if (trimmedCommand.startsWith('add ')) {
                        const taskAdded = processAddCommand(trimmedCommand);
                        if (taskAdded && taskAdded.title) {
                            addedTasks.push(taskAdded.title);
                        } else {
                            allTasksAdded = false;
                        }
                    } else if (trimmedCommand) {
                        // If task doesn't start with "add", prepend it
                        const taskAdded = processAddCommand(`add ${trimmedCommand}`);
                        if (taskAdded && taskAdded.title) {
                            addedTasks.push(taskAdded.title);
                        } else {
                            allTasksAdded = false;
                        }
                    }
                }
                
                if (addedTasks.length > 0) {
                    const taskMessage = addedTasks.length === 1 
                        ? `Task added: "${addedTasks[0]}"`
                        : `Multiple tasks added: ${addedTasks.map(title => `"${title}"`).join(', ')}`;
                    addAssistantMessage(taskMessage);
                    return true;
                } else {
                    addAssistantMessage("Couldn't add any tasks. Make sure each task follows the format: add [task] [date] [time]");
                    return false;
                }
            } else {
                // Single task processing
                const taskAdded = processAddCommand(command);
                return !!taskAdded;
            }
        } 
        // List tasks command
        else if (command === 'list tasks' || command === 'show tasks') {
            if (tasks.length === 0) {
                addAssistantMessage("You don't have any tasks scheduled.");
            } else {
                let message = "Here are your current tasks:<br>";
                tasks.forEach((task, index) => {
                    const taskDate = new Date(`${task.date}T${task.time}`);
                    message += `${index + 1}. ${task.title} - ${taskDate.toLocaleString()}<br>`;
                });
                addAssistantMessage(message);
            }
            return true;
        }
        // Help command
        else if (command === 'help') {
            const helpMessage = `
                Here's what you can do:<br>
                - <strong>add [task] & [time]</strong> - Add a new task<br>
                - <strong>add [task1], [task2], [task3]</strong> - Add multiple tasks at once<br>
                - <strong>list tasks</strong> - Show all tasks<br>
                - <strong>delete task [number]</strong> - Delete a task by number<br>
                - <strong>clear history</strong> - Clear task history<br>
                - <strong>clear</strong> - Clear the chat
            `;
            addAssistantMessage(helpMessage);
            return true;
        }
        // Delete task command
        else if (command.startsWith('delete task ')) {
            const taskNumber = parseInt(command.replace('delete task ', '')) - 1;
            if (isNaN(taskNumber) || taskNumber < 0 || taskNumber >= tasks.length) {
                addAssistantMessage("Invalid task number. Please use 'list tasks' to see all tasks.");
            } else {
                const task = tasks[taskNumber];
                deleteTask(task.id);
            }
            return true;
        }
        // Clear history command
        else if (command === 'clear history') {
            if (history.length === 0) {
                addAssistantMessage("There is no history to clear.");
            } else {
                // Show custom confirmation dialog
                window.showConfirmDialog(
                    "Clear History",
                    "Are you sure you want to clear all history? This action cannot be undone.",
                    () => {
                        // Clear history array
                        history = [];
                        
                        // Save to localStorage
                        localStorage.setItem('history', JSON.stringify(history));
                        
                        // Re-render history
                        renderHistory();
                        
                        // Show message in assistant
                        addAssistantMessage("Your task history has been cleared successfully.");
                    }
                );
                
                // Also show message in the assistant
                addAssistantMessage("Please confirm if you want to clear all history.");
            }
            return true;
        }
        // Clear chat command
        else if (command === 'clear') {
            assistantMessages.innerHTML = '';
            addAssistantMessage("Chat cleared. What would you like to do now?");
            return true;
        }
        
        return false;
    }

    // Helper function to process add command
    function processAddCommand(command) {
        const regex = /add\s+(.+?)(?:\s+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\w+\s+\d{1,2}(?:st|nd|rd|th)?))?(?:\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?|\d{1,2}\s*[ap]m))?$/i;
        const match = command.match(regex);
        
        if (match) {
            let [, title, date, time] = match;
            
            // Default to today if no date provided
            if (!date) {
                const today = new Date();
                date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
                // Convert various date formats to YYYY-MM-DD
                if (date.match(/\d{4}-\d{2}-\d{2}/)) {
                    // Already in YYYY-MM-DD format
                } else if (date.match(/\d{2}\/\d{2}\/\d{4}/)) {
                    // MM/DD/YYYY format
                    const parts = date.split('/');
                    date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                } else {
                    // Try to parse other formats
                    const parsedDate = new Date(date);
                    if (!isNaN(parsedDate.getTime())) {
                        date = parsedDate.toISOString().split('T')[0];
                    } else {
                        date = new Date().toISOString().split('T')[0]; // Default to today
                    }
                }
            }
            
            // Default to current time + 1 hour if no time provided
            if (!time) {
                const now = new Date();
                now.setHours(now.getHours() + 1);
                time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            } else {
                // Convert time to 24-hour format (HH:MM)
                if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) {
                    // Parse 12-hour format with AM/PM
                    const isPM = time.toLowerCase().includes('pm');
                    time = time.toLowerCase().replace(/[^0-9:]/g, '').trim();
                    
                    let [hours, minutes] = time.split(':');
                    hours = parseInt(hours);
                    
                    if (isPM && hours < 12) hours += 12;
                    if (!isPM && hours === 12) hours = 0;
                    
                    time = `${hours.toString().padStart(2, '0')}:${minutes || '00'}`;
                }
            }
            
            // Create the task
            const newTask = {
                id: Date.now(),
                title,
                date,
                time,
                priority: 'medium'
            };
            
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            
            return newTask;
        }
        
        return null;
    }

    // Event listeners for modals
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            // Reset form
            taskForm.reset();
            taskForm.removeAttribute('data-edit-id');
            taskForm.querySelector('button[type="submit"]').textContent = 'Add Task';
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('task-date').value = today;
            
            taskModal.style.display = 'flex';
        });
    }

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            // Reset form
            noteForm.reset();
            noteForm.removeAttribute('data-edit-id');
            noteForm.querySelector('button[type="submit"]').textContent = 'Save Note';
            
            noteModal.style.display = 'flex';
        });
    }

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (taskModal) taskModal.style.display = 'none';
            if (noteModal) noteModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (taskModal && e.target === taskModal) {
            taskModal.style.display = 'none';
        }
        if (noteModal && e.target === noteModal) {
            noteModal.style.display = 'none';
        }
    });

    // Task form submission
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('task-title').value;
            const date = document.getElementById('task-date').value;
            const time = document.getElementById('task-time').value;
            const priority = document.getElementById('task-priority').value;
            
            const editId = taskForm.getAttribute('data-edit-id');
            
            if (editId) {
                // Update existing task
                const taskIndex = tasks.findIndex(t => t.id === parseInt(editId));
                if (taskIndex !== -1) {
                    tasks[taskIndex] = {
                        ...tasks[taskIndex],
                        title,
                        date,
                        time,
                        priority
                    };
                    
                    addAssistantMessage(`Task "${title}" has been updated.`);
                }
            } else {
                // Create new task
                const newTask = {
                    id: Date.now(),
                    title,
                    date,
                    time,
                    priority
                };
                
                tasks.push(newTask);
                addAssistantMessage(`New task added: "${title}"`);
            }
            
            // Save to localStorage and re-render
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            
            // Close modal
            taskModal.style.display = 'none';
        });
    }

    // Note form submission
    if (noteForm) {
        noteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('note-title').value;
            const content = document.getElementById('note-content').value;
            
            const editId = noteForm.getAttribute('data-edit-id');
            
            if (editId) {
                // Update existing note
                const noteIndex = notes.findIndex(n => n.id === parseInt(editId));
                if (noteIndex !== -1) {
                    notes[noteIndex] = {
                        ...notes[noteIndex],
                        title,
                        content
                    };
                    
                    addAssistantMessage(`Note "${title}" has been updated.`);
                }
            } else {
                // Create new note
                const newNote = {
                    id: Date.now(),
                    title,
                    content
                };
                
                notes.push(newNote);
                addAssistantMessage(`New note created: "${title}"`);
            }
            
            // Save to localStorage and re-render
            localStorage.setItem('notes', JSON.stringify(notes));
            renderNotes();
            
            // Close modal
            noteModal.style.display = 'none';
        });
    }

    // Command input handling
    function handleCommand() {
        if (!commandInput) return;
        
        const command = commandInput.value.trim()
        if (!command) return;
        
        // Add user message
        addUserMessage(command);
        
        // Process command
        const handled = processCommand(command);
        
        // If not a recognized command
        if (!handled) {
            addAssistantMessage("Sorry, I didn't understand that command. Try 'help' for available commands.");
        }
        
        // Clear input
        commandInput.value = '';
        
        // Focus the input field again
        setTimeout(() => commandInput.focus(), 100);
    }

    // Quick action buttons handling
    function setupQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.getAttribute('data-command');
                
                if (command === 'add') {
                    // For simple 'add' command, focus on input and pre-fill
                    commandInput.value = 'add ';
                    commandInput.focus();
                } else if (command.includes(',')) {
                    // For multiple tasks command
                    addUserMessage(command);
                    const handled = processCommand(command);
                    
                    if (!handled) {
                        addAssistantMessage("Sorry, I couldn't process these tasks. Try 'help' for available commands.");
                    }
                } else {
                    // For other commands, execute directly
                    addUserMessage(command);
                    const handled = processCommand(command);
                    
                    if (!handled) {
                        addAssistantMessage("Sorry, I didn't understand that command. Try 'help' for available commands.");
                    }
                }
            });
        });
    }

    if (commandInput) {
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCommand();
            }
        });
    }

    if (sendCommand) {
        sendCommand.addEventListener('click', handleCommand);
    }

    // Handle AI tool image loading errors
    function setupAIToolImages() {
        const aiLogoImages = document.querySelectorAll('.ai-logo img');
        
        aiLogoImages.forEach(img => {
            // Define fallback icons for each AI tool
            const fallbackIcons = {
                'ChatGPT Logo': '<i class="fas fa-comment-dots"></i>',
                'Claude Logo': '<i class="fas fa-robot"></i>',
                'DeepSeek Logo': '<i class="fas fa-brain"></i>',
                'Google Gemini Logo': '<i class="fas fa-gem"></i>',
                'Microsoft Copilot Logo': '<i class="fas fa-laptop-code"></i>',
                'Perplexity Logo': '<i class="fas fa-search"></i>'
            };
            
            img.addEventListener('error', function() {
                const altText = this.getAttribute('alt');
                const fallbackIcon = fallbackIcons[altText] || '<i class="fas fa-cog"></i>';
                
                // Replace the img element with the fallback icon
                const parent = this.parentNode;
                parent.innerHTML = fallbackIcon;
                parent.classList.add('fallback-icon');
                
                console.log(`Image failed to load: ${this.src}. Using fallback icon.`);
            });
        });
    }

    // Setup AI Tools buttons
    function setupAIToolsButtons() {
        const openAllButton = document.getElementById('open-all-ai-tools');
        if (openAllButton) {
            openAllButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                
                // Get all AI tool URLs
                const aiTools = document.querySelectorAll('.ai-tool');
                const urls = [];
                
                aiTools.forEach(tool => {
                    const url = tool.getAttribute('onclick');
                    if (url) {
                        // Extract URL from onclick attribute
                        const urlMatch = url.match(/window\.open\('([^']+)'/);
                        if (urlMatch && urlMatch[1]) {
                            urls.push(urlMatch[1]);
                        }
                    }
                });
                
                // Open all URLs in new tabs
                urls.forEach(url => {
                    window.open(url, '_blank');
                });
                
                // Show message in assistant
                addAssistantMessage("Opening all AI tools in new tabs. If some were blocked, check your popup blocker settings.");
            });
        }
    }

    // Setup Custom Confirmation Dialog
    function setupConfirmDialog() {
        const confirmDialog = document.getElementById('confirm-dialog');
        const confirmDialogTitle = document.getElementById('confirm-dialog-title');
        const confirmDialogMessage = document.getElementById('confirm-dialog-message');
        const confirmDialogConfirm = document.getElementById('confirm-dialog-confirm');
        const confirmDialogCancel = document.getElementById('confirm-dialog-cancel');
        const confirmDialogClose = document.getElementById('confirm-dialog-close');
        
        // Function to show the confirmation dialog
        window.showConfirmDialog = function(title, message, onConfirm) {
            confirmDialogTitle.textContent = title;
            confirmDialogMessage.textContent = message;
            
            // Reset event listeners to prevent duplicates
            const newConfirmBtn = confirmDialogConfirm.cloneNode(true);
            confirmDialogConfirm.parentNode.replaceChild(newConfirmBtn, confirmDialogConfirm);
            
            // Add event listener for confirm button
            newConfirmBtn.addEventListener('click', () => {
                confirmDialog.style.display = 'none';
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
            
            // Show the dialog
            confirmDialog.style.display = 'flex';
        };
        
        // Event listeners for cancel and close buttons
        confirmDialogCancel.addEventListener('click', () => {
            confirmDialog.style.display = 'none';
        });
        
        confirmDialogClose.addEventListener('click', () => {
            confirmDialog.style.display = 'none';
        });
        
        // Close when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.style.display = 'none';
            }
        });
    }

    // Setup Clear History Button
    function setupClearHistoryButton() {
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (history.length === 0) {
                    addAssistantMessage("There is no history to clear.");
                    return;
                }
                
                // Show custom confirmation dialog
                window.showConfirmDialog(
                    "Clear History",
                    "Are you sure you want to clear all history? This action cannot be undone.",
                    () => {
                        // Clear history array
                        history = [];
                        
                        // Save to localStorage
                        localStorage.setItem('history', JSON.stringify(history));
                        
                        // Re-render history
                        renderHistory();
                        
                        // Show message in assistant
                        addAssistantMessage("Your task history has been cleared successfully.");
                    }
                );
            });
        }
    }

    // Function to handle mobile keyboard and scrolling
    function setupMobileKeyboardHandling() {
        if (!commandInput) return;
        
        // Focus input and scroll to bottom when tapped
        commandInput.addEventListener('focus', () => {
            setTimeout(() => {
                assistantMessages.scrollTo({
                    top: assistantMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }, 300); // Wait for keyboard to appear
        });
        
        // Handle viewport resize when keyboard appears
        let originalWindowHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            // Only on mobile devices
            if (window.innerWidth <= 768) {
                // If the height decreases significantly, keyboard likely appeared
                if (window.innerHeight < originalWindowHeight * 0.75) {
                    setTimeout(() => {
                        assistantMessages.scrollTo({
                            top: assistantMessages.scrollHeight,
                            behavior: 'smooth'
                        });
                    }, 100);
                } else {
                    originalWindowHeight = window.innerHeight;
                }
            }
        });
    }

    // Initialize the app
    init();
});