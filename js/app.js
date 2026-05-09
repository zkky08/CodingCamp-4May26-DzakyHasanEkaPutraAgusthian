// To-Do List Life Dashboard Application

// ============================================================================
// Storage Manager
// ============================================================================
// Provides a clean interface to Local Storage with error handling and data validation.

const StorageManager = {
  /**
   * Save data to Local Storage
   * @param {string} key - Storage key
   * @param {any} data - Data to store (will be JSON serialized)
   * @returns {boolean} - True if save successful, false otherwise
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`StorageManager.save error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Load data from Local Storage
   * @param {string} key - Storage key
   * @returns {any|null} - Parsed data or null if not found/error
   */
  load(key) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized);
    } catch (error) {
      console.error(`StorageManager.load error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Remove data from Local Storage
   * @param {string} key - Storage key
   * @returns {boolean} - True if remove successful, false otherwise
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageManager.remove error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Check if key exists in Local Storage
   * @param {string} key - Storage key
   * @returns {boolean} - True if key exists, false otherwise
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`StorageManager.has error for key "${key}":`, error);
      return false;
    }
  }
};

// ============================================================================
// State Manager
// ============================================================================
// Maintains application state and provides mutation methods with automatic persistence.

const StateManager = {
  // Application state structure
  state: {
    todos: [],           // Array of todo items: { id, text, completed, createdAt }
    quickLinks: [],      // Array of quick links: { id, name, url }
    timerSeconds: 1500,  // Timer duration in seconds (25 minutes default)
    timerRunning: false  // Timer running state
  },

  /**
   * Add a new todo item
   * @param {string} text - Todo text description
   */
  addTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: Date.now()
    };
    this.state.todos.push(todo);
    this.saveState();
  },

  /**
   * Update an existing todo's text
   * @param {number} id - Todo ID
   * @param {string} text - New text description
   */
  updateTodo(id, text) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.text = text;
      this.saveState();
    }
  },

  /**
   * Toggle a todo's completion status
   * @param {number} id - Todo ID
   */
  toggleTodo(id) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveState();
    }
  },

  /**
   * Delete a todo item
   * @param {number} id - Todo ID
   */
  deleteTodo(id) {
    this.state.todos = this.state.todos.filter(t => t.id !== id);
    this.saveState();
  },

  /**
   * Add a new quick link
   * @param {string} name - Link display name
   * @param {string} url - Link URL
   */
  addQuickLink(name, url) {
    const quickLink = {
      id: Date.now(),
      name: name,
      url: url
    };
    this.state.quickLinks.push(quickLink);
    this.saveState();
  },

  /**
   * Delete a quick link
   * @param {number} id - Quick link ID
   */
  deleteQuickLink(id) {
    this.state.quickLinks = this.state.quickLinks.filter(ql => ql.id !== id);
    this.saveState();
  },

  /**
   * Set timer seconds
   * @param {number} seconds - Timer duration in seconds
   */
  setTimerSeconds(seconds) {
    this.state.timerSeconds = seconds;
    // Note: Timer state is not persisted to Local Storage per design
  },

  /**
   * Set timer running state
   * @param {boolean} running - Whether timer is running
   */
  setTimerRunning(running) {
    this.state.timerRunning = running;
    // Note: Timer state is not persisted to Local Storage per design
  },

  /**
   * Save current state to Local Storage
   * Persists todos and quickLinks only (timer state is session-only)
   */
  saveState() {
    StorageManager.save('todos', this.state.todos);
    StorageManager.save('quickLinks', this.state.quickLinks);
  },

  /**
   * Load state from Local Storage
   * Restores todos and quickLinks if available
   */
  loadState() {
    const todos = StorageManager.load('todos');
    const quickLinks = StorageManager.load('quickLinks');
    
    if (todos !== null) {
      this.state.todos = todos;
    }
    
    if (quickLinks !== null) {
      this.state.quickLinks = quickLinks;
    }
  }
};

// ============================================================================
// Greeting Component
// ============================================================================
// Displays current time, date, and time-based greeting message.

const GreetingComponent = {
  // DOM element references
  containerElement: null,
  greetingDisplay: null,
  timeDisplay: null,
  dateDisplay: null,
  
  // Interval ID for cleanup
  intervalId: null,

  /**
   * Initialize the Greeting Component
   * @param {HTMLElement} containerElement - Container element for the greeting component
   */
  init(containerElement) {
    this.containerElement = containerElement;
    
    // Get references to display elements
    this.greetingDisplay = containerElement.querySelector('#greeting-display');
    this.timeDisplay = containerElement.querySelector('#time-display');
    this.dateDisplay = containerElement.querySelector('#date-display');
    
    // Initial update
    this.update();
    
    // Set up interval to update every second (1000ms)
    this.intervalId = setInterval(() => {
      this.update();
    }, 1000);
  },

  /**
   * Update the greeting, time, and date display
   */
  update() {
    const now = new Date();
    
    // Update greeting
    const greeting = this.getGreeting(now.getHours());
    if (this.greetingDisplay) {
      this.greetingDisplay.textContent = greeting;
    }
    
    // Update time
    const timeStr = this.formatTime(now);
    if (this.timeDisplay) {
      this.timeDisplay.textContent = timeStr;
    }
    
    // Update date
    const dateStr = this.formatDate(now);
    if (this.dateDisplay) {
      this.dateDisplay.textContent = dateStr;
    }
  },

  /**
   * Format time in 12-hour format with AM/PM
   * @param {Date} date - Date object to format
   * @returns {string} - Time string in format "h:mm:ss AM/PM"
   */
  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // Determine AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // 0 should be 12
    
    // Pad minutes and seconds with leading zeros
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    return `${hours}:${minutesStr}:${secondsStr} ${period}`;
  },

  /**
   * Format date as "DayOfWeek, Month Day"
   * @param {Date} date - Date object to format
   * @returns {string} - Date string in format "Monday, January 15"
   */
  formatDate(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    
    return `${dayOfWeek}, ${month} ${day}`;
  },

  /**
   * Get time-based greeting message
   * @param {number} hour - Hour in 24-hour format (0-23)
   * @returns {string} - Greeting message
   */
  getGreeting(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'Good Morning';
    } else if (hour >= 12 && hour <= 16) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour <= 20) {
      return 'Good Evening';
    } else {
      // 21-23 or 0-4
      return 'Good Night';
    }
  },

  /**
   * Cleanup method to clear interval
   * Should be called when component is destroyed or page unloads
   */
  destroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};
// ============================================================================
// Timer Component
// ============================================================================
// Implements 25-minute focus timer with start/stop/reset controls.

const TimerComponent = {
  // DOM element references
  containerElement: null,
  displayElement: null,
  startButton: null,
  stopButton: null,
  resetButton: null,
  
  // Interval ID for cleanup
  intervalId: null,
  
  // Current timer state (seconds remaining)
  seconds: 1500, // 25 minutes default

  /**
   * Initialize the Timer Component
   * @param {HTMLElement} containerElement - Container element for the timer component
   */
  init(containerElement) {
    this.containerElement = containerElement;
    
    // Get references to display and control elements
    this.displayElement = containerElement.querySelector('#timer-display');
    this.startButton = containerElement.querySelector('#timer-start');
    this.stopButton = containerElement.querySelector('#timer-stop');
    this.resetButton = containerElement.querySelector('#timer-reset');
    
    // Initialize timer state from StateManager
    this.seconds = StateManager.state.timerSeconds;
    
    // Bind button event listeners
    if (this.startButton) {
      this.startButton.addEventListener('click', () => this.start());
    }
    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => this.stop());
    }
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => this.reset());
    }
    
    // Initial display update
    this.updateDisplay();
  },

  /**
   * Format seconds as MM:SS
   * @param {number} seconds - Total seconds
   * @returns {string} - Time string in format "MM:SS"
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // Pad with leading zeros
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');
    
    return `${minutesStr}:${secondsStr}`;
  },

  /**
   * Start the countdown timer
   */
  start() {
    // Don't start if already running
    if (this.intervalId !== null) {
      return;
    }
    
    // Update state manager
    StateManager.setTimerRunning(true);
    
    // Set up interval to countdown every second (1000ms)
    this.intervalId = setInterval(() => {
      if (this.seconds > 0) {
        this.seconds--;
        StateManager.setTimerSeconds(this.seconds);
        this.updateDisplay();
      } else {
        // Timer reached zero
        this.stop();
        this.onComplete();
      }
    }, 1000);
  },

  /**
   * Stop/pause the countdown timer
   */
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Update state manager
    StateManager.setTimerRunning(false);
  },

  /**
   * Reset timer to 25 minutes (1500 seconds)
   */
  reset() {
    // Stop the timer if running
    this.stop();
    
    // Reset to 1500 seconds (25 minutes)
    this.seconds = 1500;
    StateManager.setTimerSeconds(this.seconds);
    
    // Update display
    this.updateDisplay();
  },

  /**
   * Update the timer display
   */
  updateDisplay() {
    if (this.displayElement) {
      this.displayElement.textContent = this.formatTime(this.seconds);
    }
  },

  /**
   * Handle timer completion (reached zero)
   * Displays a notification to the user
   */
  onComplete() {
    // Display browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete', {
        body: 'Your 25-minute focus session is complete!',
        icon: null
      });
    } else {
      // Fallback to alert if notifications not available or not permitted
      alert('Timer Complete! Your 25-minute focus session is complete!');
    }
  },

  /**
   * Cleanup method to clear interval
   * Should be called when component is destroyed or page unloads
   */
  destroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};

// ============================================================================
// Todo Component
// ============================================================================
// Manages task list with create, edit, complete, and delete operations.

const TodoComponent = {
  // DOM element references
  containerElement: null,
  formElement: null,
  inputElement: null,
  listElement: null,

  /**
   * Initialize the Todo Component
   * @param {HTMLElement} containerElement - Container element for the todo component
   */
  init(containerElement) {
    this.containerElement = containerElement;
    
    // Get references to form and list elements
    this.formElement = containerElement.querySelector('#todo-form');
    this.inputElement = containerElement.querySelector('#todo-input');
    this.listElement = containerElement.querySelector('#todo-list');
    
    // Bind form submission event
    if (this.formElement) {
      this.formElement.addEventListener('submit', (event) => this.handleAdd(event));
    }
    
    // Set up event delegation for button clicks on dynamically rendered tasks
    if (this.listElement) {
      this.listElement.addEventListener('click', (event) => {
        const target = event.target;
        
        // Handle edit button click
        if (target.classList.contains('todo-edit-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleEdit(id);
        }
        
        // Handle toggle (done) button click
        if (target.classList.contains('todo-toggle-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleToggle(id);
        }
        
        // Handle delete button click
        if (target.classList.contains('todo-delete-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleDelete(id);
        }
      });
    }
    
    // Initial render of todos from state
    this.render();
  },

  /**
   * Validate input text
   * @param {string} text - Text to validate
   * @returns {boolean} - True if valid, false if empty or whitespace-only
   */
  validateInput(text) {
    // Reject empty or whitespace-only strings
    return text.trim().length > 0;
  },

  /**
   * Render all todos from state
   * Displays todos in creation order with visual distinction for completed tasks
   */
  render() {
    if (!this.listElement) {
      return;
    }
    
    // Clear current list
    this.listElement.innerHTML = '';
    
    // Get todos from state (already in creation order)
    const todos = StateManager.state.todos;
    
    // Render each todo
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      
      // Add completed class for visual distinction
      if (todo.completed) {
        li.classList.add('todo-completed');
      }
      
      // Create todo text span
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = todo.text;
      
      // Create button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'todo-buttons';
      
      // Create edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-small todo-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.dataset.id = todo.id;
      
      // Create toggle (done) button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-small todo-toggle-btn';
      toggleBtn.textContent = todo.completed ? 'Undo' : 'Done';
      toggleBtn.dataset.id = todo.id;
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small todo-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.id = todo.id;
      
      // Assemble the todo item
      buttonContainer.appendChild(editBtn);
      buttonContainer.appendChild(toggleBtn);
      buttonContainer.appendChild(deleteBtn);
      
      li.appendChild(textSpan);
      li.appendChild(buttonContainer);
      
      this.listElement.appendChild(li);
    });
  },

  /**
   * Handle form submission to add new task
   * @param {Event} event - Form submit event
   */
  handleAdd(event) {
    event.preventDefault();
    
    if (!this.inputElement) {
      return;
    }
    
    const text = this.inputElement.value;
    
    // Validate input
    if (!this.validateInput(text)) {
      // Could add visual feedback here
      return;
    }
    
    // Add task to state (trimmed)
    StateManager.addTodo(text.trim());
    
    // Clear input field
    this.inputElement.value = '';
    
    // Re-render list
    this.render();
  },

  /**
   * Handle edit button click
   * Replaces task text with input field for editing
   * @param {number} id - Todo ID
   */
  handleEdit(id) {
    // Find the todo in state
    const todo = StateManager.state.todos.find(t => t.id === id);
    if (!todo) {
      return;
    }
    
    // Find the list item in DOM
    const listItem = Array.from(this.listElement.children).find(li => {
      const editBtn = li.querySelector('.todo-edit-btn');
      return editBtn && parseInt(editBtn.dataset.id, 10) === id;
    });
    
    if (!listItem) {
      return;
    }
    
    // Replace text span with input field
    const textSpan = listItem.querySelector('.todo-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = todo.text;
    
    // Replace the text span with input
    textSpan.replaceWith(input);
    input.focus();
    
    // Handle save on blur or enter key
    const saveEdit = () => {
      const newText = input.value;
      
      // Validate input
      if (this.validateInput(newText)) {
        // Update state
        StateManager.updateTodo(id, newText.trim());
      }
      
      // Re-render to restore normal view
      this.render();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      }
    });
  },

  /**
   * Handle toggle completion button click
   * @param {number} id - Todo ID
   */
  handleToggle(id) {
    // Toggle completion status in state
    StateManager.toggleTodo(id);
    
    // Re-render list
    this.render();
  },

  /**
   * Handle delete button click
   * @param {number} id - Todo ID
   */
  handleDelete(id) {
    // Delete from state
    StateManager.deleteTodo(id);
    
    // Re-render list
    this.render();
  }
};

// ============================================================================
// Quick Links Component
// ============================================================================
// Manages customizable website shortcuts with URL normalization.

const QuickLinksComponent = {
  // DOM element references
  containerElement: null,
  formElement: null,
  nameInputElement: null,
  urlInputElement: null,
  listElement: null,

  /**
   * Initialize the Quick Links Component
   * @param {HTMLElement} containerElement - Container element for the quick links component
   */
  init(containerElement) {
    this.containerElement = containerElement;
    
    // Get references to form and list elements
    this.formElement = containerElement.querySelector('#quicklinks-form');
    this.nameInputElement = containerElement.querySelector('#quicklink-name');
    this.urlInputElement = containerElement.querySelector('#quicklink-url');
    this.listElement = containerElement.querySelector('#quicklinks-list');
    
    // Bind form submission event
    if (this.formElement) {
      this.formElement.addEventListener('submit', (event) => this.handleAdd(event));
    }
    
    // Set up event delegation for button clicks on dynamically rendered links
    if (this.listElement) {
      this.listElement.addEventListener('click', (event) => {
        const target = event.target;
        
        // Handle link button click
        if (target.classList.contains('quicklink-btn')) {
          const url = target.dataset.url;
          this.handleClick(url);
        }
        
        // Handle delete button click
        if (target.classList.contains('quicklink-delete-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleDelete(id);
        }
      });
    }
    
    // Initial render of quick links from state
    this.render();
  },

  /**
   * Validate input fields
   * @param {string} name - Link name to validate
   * @param {string} url - Link URL to validate
   * @returns {boolean} - True if valid, false if either field is empty or whitespace-only
   */
  validateInput(name, url) {
    // Reject empty or whitespace-only strings for both name and URL
    return name.trim().length > 0 && url.trim().length > 0;
  },

  /**
   * Normalize URL by prepending "https://" if no protocol present
   * @param {string} url - URL to normalize
   * @returns {string} - Normalized URL with protocol
   */
  normalizeUrl(url) {
    // Check if URL already has a protocol (http://, https://, ftp://, etc.)
    // Protocol pattern: starts with letters followed by ://
    const protocolPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
    
    if (protocolPattern.test(url)) {
      // URL already has a protocol, return as-is
      return url;
    } else {
      // No protocol present, prepend "https://"
      return 'https://' + url;
    }
  },

  /**
   * Render all quick links from state
   * Displays quick links as clickable buttons with delete icons
   */
  render() {
    if (!this.listElement) {
      return;
    }
    
    // Clear current list
    this.listElement.innerHTML = '';
    
    // Get quick links from state
    const quickLinks = StateManager.state.quickLinks;
    
    // Render each quick link
    quickLinks.forEach(link => {
      // Create link button container
      const linkContainer = document.createElement('div');
      linkContainer.className = 'quicklink-item';
      
      // Create clickable link button
      const linkBtn = document.createElement('button');
      linkBtn.className = 'btn quicklink-btn';
      linkBtn.textContent = link.name;
      linkBtn.dataset.url = link.url;
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small quicklink-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.dataset.id = link.id;
      deleteBtn.setAttribute('aria-label', `Delete ${link.name}`);
      
      // Assemble the quick link item
      linkContainer.appendChild(linkBtn);
      linkContainer.appendChild(deleteBtn);
      
      this.listElement.appendChild(linkContainer);
    });
  },

  /**
   * Handle form submission to add new quick link
   * @param {Event} event - Form submit event
   */
  handleAdd(event) {
    event.preventDefault();
    
    if (!this.nameInputElement || !this.urlInputElement) {
      return;
    }
    
    const name = this.nameInputElement.value;
    const url = this.urlInputElement.value;
    
    // Validate input
    if (!this.validateInput(name, url)) {
      // Could add visual feedback here
      return;
    }
    
    // Normalize URL (add https:// if no protocol)
    const normalizedUrl = this.normalizeUrl(url.trim());
    
    // Add quick link to state (trimmed name and normalized URL)
    StateManager.addQuickLink(name.trim(), normalizedUrl);
    
    // Clear input fields
    this.nameInputElement.value = '';
    this.urlInputElement.value = '';
    
    // Re-render list
    this.render();
  },

  /**
   * Handle link button click
   * Opens URL in new browser tab
   * @param {string} url - URL to open
   */
  handleClick(url) {
    // Open URL in new tab
    window.open(url, '_blank');
  },

  /**
   * Handle delete button click
   * @param {number} id - Quick link ID
   */
  handleDelete(id) {
    // Delete from state
    StateManager.deleteQuickLink(id);
    
    // Re-render list
    this.render();
  }
};
// ============================================================================
// Application Initialization
// ============================================================================
// Bootstrap the application and coordinate all components.

const App = {
  /**
   * Check if Local Storage is available
   * @returns {boolean} - True if Local Storage is available, false otherwise
   */
  isLocalStorageAvailable() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Initialize the application
   * Loads state from Local Storage and initializes all components
   */
  init() {
    try {
      // Check Local Storage availability (private browsing mode detection)
      if (!this.isLocalStorageAvailable()) {
        console.warn('Local Storage is not available. Data will not be persisted across sessions.');
        // Display warning to user
        const warningDiv = document.createElement('div');
        warningDiv.className = 'storage-warning';
        warningDiv.textContent = 'Warning: Local Storage is unavailable. Your data will not be saved.';
        warningDiv.style.cssText = 'background-color: #fff3cd; color: #856404; padding: 10px; text-align: center; border-bottom: 1px solid #ffeaa7;';
        document.body.insertBefore(warningDiv, document.body.firstChild);
      }

      // Load state from Local Storage
      StateManager.loadState();
      
      // Initialize all components in order
      
      // 1. Initialize Greeting Component
      const greetingSection = document.getElementById('greeting-section');
      if (greetingSection) {
        GreetingComponent.init(greetingSection);
      } else {
        console.error('Greeting section not found');
      }
      
      // 2. Initialize Timer Component
      const timerSection = document.getElementById('timer-section');
      if (timerSection) {
        TimerComponent.init(timerSection);
      } else {
        console.error('Timer section not found');
      }
      
      // 3. Initialize Todo Component
      const todoSection = document.getElementById('todo-section');
      if (todoSection) {
        TodoComponent.init(todoSection);
      } else {
        console.error('Todo section not found');
      }
      
      // 4. Initialize Quick Links Component
      const quicklinksSection = document.getElementById('quicklinks-section');
      if (quicklinksSection) {
        QuickLinksComponent.init(quicklinksSection);
      } else {
        console.error('Quick links section not found');
      }
      
      console.log('To-Do List Life Dashboard initialized successfully');
    } catch (error) {
      this.handleError(error);
    }
  },

  /**
   * Handle application errors
   * Logs errors to console without crashing the application
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Application error:', error);
    // Application continues to function - error is logged but not thrown
  },

  /**
   * Cleanup method called on page unload
   * Clears all timer intervals to prevent memory leaks
   */
  cleanup() {
    try {
      // Clear Greeting Component interval
      if (GreetingComponent && GreetingComponent.destroy) {
        GreetingComponent.destroy();
      }
      
      // Clear Timer Component interval
      if (TimerComponent && TimerComponent.destroy) {
        TimerComponent.destroy();
      }
      
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
};

// ============================================================================
// Global Error Handler
// ============================================================================
// Catch uncaught errors and log them without crashing the application

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // Prevent default error handling (which would display error in console as uncaught)
  // Application continues to run
  event.preventDefault();
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default handling
  event.preventDefault();
});

// ============================================================================
// Page Lifecycle Management
// ============================================================================
// Clean up resources when page is unloaded

window.addEventListener('beforeunload', () => {
  App.cleanup();
});

// Alternative cleanup event for better browser compatibility
window.addEventListener('pagehide', () => {
  App.cleanup();
});

// ============================================================================
// Application Bootstrap
// ============================================================================
// Wait for DOM to be ready before initializing the application

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  // DOM is already ready
  App.init();
}
