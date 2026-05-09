// To-Do List Life Dashboard Application - Enhanced Version

// ============================================================================
// Storage Manager
// ============================================================================
// Provides a clean interface to Local Storage with error handling and data validation.

const StorageManager = {
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

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`StorageManager.remove error for key "${key}":`, error);
      return false;
    }
  },

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
  state: {
    todos: [],
    quickLinks: [],
    timerSeconds: 1500,
    timerRunning: false,
    // New state properties for enhancements
    theme: 'light',
    userName: '',
    timerDuration: 1500,
    taskSortOption: 'newest'
  },

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

  updateTodo(id, text) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.text = text;
      this.saveState();
    }
  },

  toggleTodo(id) {
    const todo = this.state.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveState();
    }
  },

  deleteTodo(id) {
    this.state.todos = this.state.todos.filter(t => t.id !== id);
    this.saveState();
  },

  // NEW: Check for duplicate tasks (case-insensitive)
  hasDuplicateTodo(text) {
    const normalizedText = text.trim().toLowerCase();
    return this.state.todos.some(todo => todo.text.toLowerCase() === normalizedText);
  },

  addQuickLink(name, url) {
    const quickLink = {
      id: Date.now(),
      name: name,
      url: url
    };
    this.state.quickLinks.push(quickLink);
    this.saveState();
  },

  deleteQuickLink(id) {
    this.state.quickLinks = this.state.quickLinks.filter(ql => ql.id !== id);
    this.saveState();
  },

  setTimerSeconds(seconds) {
    this.state.timerSeconds = seconds;
  },

  setTimerRunning(running) {
    this.state.timerRunning = running;
  },

  // NEW: Theme management
  setTheme(theme) {
    this.state.theme = theme;
    this.savePreferences();
  },

  // NEW: User name management
  setUserName(name) {
    this.state.userName = name;
    this.savePreferences();
  },

  // NEW: Timer duration management
  setTimerDuration(duration) {
    this.state.timerDuration = duration;
    this.savePreferences();
  },

  // NEW: Task sort option management
  setTaskSortOption(option) {
    this.state.taskSortOption = option;
    this.savePreferences();
  },

  saveState() {
    StorageManager.save('todos', this.state.todos);
    StorageManager.save('quickLinks', this.state.quickLinks);
  },

  // NEW: Save user preferences
  savePreferences() {
    const preferences = {
      theme: this.state.theme,
      userName: this.state.userName,
      timerDuration: this.state.timerDuration,
      taskSortOption: this.state.taskSortOption
    };
    StorageManager.save('preferences', preferences);
  },

  loadState() {
    const todos = StorageManager.load('todos');
    const quickLinks = StorageManager.load('quickLinks');
    const preferences = StorageManager.load('preferences');
    
    if (todos !== null) {
      this.state.todos = todos;
    }
    
    if (quickLinks !== null) {
      this.state.quickLinks = quickLinks;
    }

    // NEW: Load preferences
    if (preferences !== null) {
      this.state.theme = preferences.theme || 'light';
      this.state.userName = preferences.userName || '';
      this.state.timerDuration = preferences.timerDuration || 1500;
      this.state.taskSortOption = preferences.taskSortOption || 'newest';
    }
  }
};

// ============================================================================
// Theme Manager
// ============================================================================
// NEW: Manages light/dark theme switching

const ThemeManager = {
  init() {
    // Apply saved theme
    this.applyTheme(StateManager.state.theme);
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeIcon();
    }
  },

  toggleTheme() {
    const newTheme = StateManager.state.theme === 'light' ? 'dark' : 'light';
    StateManager.setTheme(newTheme);
    this.applyTheme(newTheme);
    this.updateThemeIcon();
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = StateManager.state.theme === 'light' ? '🌙' : '☀️';
    }
  }
};

// ============================================================================
// Greeting Component
// ============================================================================
// Displays current time, date, and time-based greeting message with custom name.

const GreetingComponent = {
  containerElement: null,
  greetingDisplay: null,
  timeDisplay: null,
  dateDisplay: null,
  nameInput: null,
  intervalId: null,

  init(containerElement) {
    this.containerElement = containerElement;
    
    this.greetingDisplay = containerElement.querySelector('#greeting-display');
    this.timeDisplay = containerElement.querySelector('#time-display');
    this.dateDisplay = containerElement.querySelector('#date-display');
    this.nameInput = containerElement.querySelector('#name-input');
    
    // NEW: Set up name input
    if (this.nameInput) {
      this.nameInput.value = StateManager.state.userName;
      this.nameInput.addEventListener('input', (e) => {
        StateManager.setUserName(e.target.value);
        this.update();
      });
    }
    
    this.update();
    
    this.intervalId = setInterval(() => {
      this.update();
    }, 1000);
  },

  update() {
    const now = new Date();
    
    // Update greeting with optional name
    const greeting = this.getGreeting(now.getHours());
    if (this.greetingDisplay) {
      const userName = StateManager.state.userName.trim();
      this.greetingDisplay.textContent = userName ? `${greeting}, ${userName}` : greeting;
    }
    
    const timeStr = this.formatTime(now);
    if (this.timeDisplay) {
      this.timeDisplay.textContent = timeStr;
    }
    
    const dateStr = this.formatDate(now);
    if (this.dateDisplay) {
      this.dateDisplay.textContent = dateStr;
    }
  },

  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');
    
    return `${hours}:${minutesStr}:${secondsStr} ${period}`;
  },

  formatDate(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    
    return `${dayOfWeek}, ${month} ${day}`;
  },

  getGreeting(hour) {
    if (hour >= 5 && hour <= 11) {
      return 'Good Morning';
    } else if (hour >= 12 && hour <= 16) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour <= 20) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  },

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
// Implements customizable focus timer with start/stop/reset controls.

const TimerComponent = {
  containerElement: null,
  displayElement: null,
  startButton: null,
  stopButton: null,
  resetButton: null,
  durationSelect: null,
  intervalId: null,
  seconds: 1500,

  init(containerElement) {
    this.containerElement = containerElement;
    
    this.displayElement = containerElement.querySelector('#timer-display');
    this.startButton = containerElement.querySelector('#timer-start');
    this.stopButton = containerElement.querySelector('#timer-stop');
    this.resetButton = containerElement.querySelector('#timer-reset');
    this.durationSelect = containerElement.querySelector('#timer-duration');
    
    // NEW: Set up duration selector
    if (this.durationSelect) {
      this.durationSelect.value = StateManager.state.timerDuration;
      this.durationSelect.addEventListener('change', (e) => {
        const newDuration = parseInt(e.target.value, 10);
        StateManager.setTimerDuration(newDuration);
        this.seconds = newDuration;
        StateManager.setTimerSeconds(this.seconds);
        this.updateDisplay();
      });
    }
    
    this.seconds = StateManager.state.timerDuration;
    
    if (this.startButton) {
      this.startButton.addEventListener('click', () => this.start());
    }
    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => this.stop());
    }
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => this.reset());
    }
    
    this.updateDisplay();
  },

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');
    
    return `${minutesStr}:${secondsStr}`;
  },

  start() {
    if (this.intervalId !== null) {
      return;
    }
    
    StateManager.setTimerRunning(true);
    
    this.intervalId = setInterval(() => {
      if (this.seconds > 0) {
        this.seconds--;
        StateManager.setTimerSeconds(this.seconds);
        this.updateDisplay();
      } else {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  },

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    StateManager.setTimerRunning(false);
  },

  reset() {
    this.stop();
    
    // NEW: Reset to currently selected duration
    this.seconds = StateManager.state.timerDuration;
    StateManager.setTimerSeconds(this.seconds);
    
    this.updateDisplay();
  },

  updateDisplay() {
    if (this.displayElement) {
      this.displayElement.textContent = this.formatTime(this.seconds);
    }
  },

  onComplete() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete', {
        body: 'Your focus session is complete!',
        icon: null
      });
    } else {
      alert('Timer Complete! Your focus session is complete!');
    }
  },

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
// Manages task list with create, edit, complete, delete, sort, and duplicate prevention.

const TodoComponent = {
  containerElement: null,
  formElement: null,
  inputElement: null,
  listElement: null,
  sortSelect: null,
  validationMessage: null,
  emptyState: null,

  init(containerElement) {
    this.containerElement = containerElement;
    
    this.formElement = containerElement.querySelector('#todo-form');
    this.inputElement = containerElement.querySelector('#todo-input');
    this.listElement = containerElement.querySelector('#todo-list');
    this.sortSelect = containerElement.querySelector('#todo-sort');
    this.validationMessage = containerElement.querySelector('#todo-validation-message');
    this.emptyState = containerElement.querySelector('#todo-empty-state');
    
    // NEW: Set up sort selector
    if (this.sortSelect) {
      this.sortSelect.value = StateManager.state.taskSortOption;
      this.sortSelect.addEventListener('change', (e) => {
        StateManager.setTaskSortOption(e.target.value);
        this.render();
      });
    }
    
    if (this.formElement) {
      this.formElement.addEventListener('submit', (event) => this.handleAdd(event));
    }
    
    if (this.listElement) {
      this.listElement.addEventListener('click', (event) => {
        const target = event.target;
        
        if (target.classList.contains('todo-edit-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleEdit(id);
        }
        
        if (target.classList.contains('todo-toggle-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleToggle(id);
        }
        
        if (target.classList.contains('todo-delete-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleDelete(id);
        }
      });
    }
    
    this.render();
  },

  validateInput(text) {
    return text.trim().length > 0;
  },

  // NEW: Show validation message
  showValidationMessage(message) {
    if (this.validationMessage) {
      this.validationMessage.textContent = message;
      this.validationMessage.classList.add('show');
      
      setTimeout(() => {
        this.validationMessage.classList.remove('show');
      }, 3000);
    }
  },

  // NEW: Sort todos based on selected option
  getSortedTodos() {
    const todos = [...StateManager.state.todos];
    const sortOption = StateManager.state.taskSortOption;
    
    switch (sortOption) {
      case 'newest':
        return todos.sort((a, b) => b.createdAt - a.createdAt);
      case 'oldest':
        return todos.sort((a, b) => a.createdAt - b.createdAt);
      case 'completed':
        return todos.sort((a, b) => b.completed - a.completed);
      case 'incomplete':
        return todos.sort((a, b) => a.completed - b.completed);
      case 'alphabetical':
        return todos.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
      default:
        return todos;
    }
  },

  render() {
    if (!this.listElement) {
      return;
    }
    
    this.listElement.innerHTML = '';
    
    const todos = this.getSortedTodos();
    
    // NEW: Show/hide empty state
    if (this.emptyState) {
      if (todos.length === 0) {
        this.emptyState.classList.add('show');
      } else {
        this.emptyState.classList.remove('show');
      }
    }
    
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      
      if (todo.completed) {
        li.classList.add('todo-completed');
      }
      
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = todo.text;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'todo-buttons';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-small todo-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.dataset.id = todo.id;
      
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-small todo-toggle-btn';
      toggleBtn.textContent = todo.completed ? 'Undo' : 'Done';
      toggleBtn.dataset.id = todo.id;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small todo-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.id = todo.id;
      
      buttonContainer.appendChild(editBtn);
      buttonContainer.appendChild(toggleBtn);
      buttonContainer.appendChild(deleteBtn);
      
      li.appendChild(textSpan);
      li.appendChild(buttonContainer);
      
      this.listElement.appendChild(li);
    });
  },

  handleAdd(event) {
    event.preventDefault();
    
    if (!this.inputElement) {
      return;
    }
    
    const text = this.inputElement.value;
    
    if (!this.validateInput(text)) {
      return;
    }
    
    // NEW: Check for duplicates
    if (StateManager.hasDuplicateTodo(text)) {
      this.showValidationMessage('⚠️ This task already exists!');
      return;
    }
    
    StateManager.addTodo(text.trim());
    
    this.inputElement.value = '';
    
    this.render();
  },

  handleEdit(id) {
    const todo = StateManager.state.todos.find(t => t.id === id);
    if (!todo) {
      return;
    }
    
    const listItem = Array.from(this.listElement.children).find(li => {
      const editBtn = li.querySelector('.todo-edit-btn');
      return editBtn && parseInt(editBtn.dataset.id, 10) === id;
    });
    
    if (!listItem) {
      return;
    }
    
    const textSpan = listItem.querySelector('.todo-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = todo.text;
    
    textSpan.replaceWith(input);
    input.focus();
    
    const saveEdit = () => {
      const newText = input.value;
      
      if (this.validateInput(newText)) {
        StateManager.updateTodo(id, newText.trim());
      }
      
      this.render();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      }
    });
  },

  handleToggle(id) {
    StateManager.toggleTodo(id);
    this.render();
  },

  handleDelete(id) {
    StateManager.deleteTodo(id);
    this.render();
  }
};

// ============================================================================
// Quick Links Component
// ============================================================================
// Manages customizable website shortcuts with URL normalization.

const QuickLinksComponent = {
  containerElement: null,
  formElement: null,
  nameInputElement: null,
  urlInputElement: null,
  listElement: null,
  emptyState: null,

  init(containerElement) {
    this.containerElement = containerElement;
    
    this.formElement = containerElement.querySelector('#quicklinks-form');
    this.nameInputElement = containerElement.querySelector('#quicklink-name');
    this.urlInputElement = containerElement.querySelector('#quicklink-url');
    this.listElement = containerElement.querySelector('#quicklinks-list');
    this.emptyState = containerElement.querySelector('#quicklinks-empty-state');
    
    if (this.formElement) {
      this.formElement.addEventListener('submit', (event) => this.handleAdd(event));
    }
    
    if (this.listElement) {
      this.listElement.addEventListener('click', (event) => {
        const target = event.target;
        
        if (target.classList.contains('quicklink-btn')) {
          const url = target.dataset.url;
          this.handleClick(url);
        }
        
        if (target.classList.contains('quicklink-delete-btn')) {
          const id = parseInt(target.dataset.id, 10);
          this.handleDelete(id);
        }
      });
    }
    
    this.render();
  },

  validateInput(name, url) {
    return name.trim().length > 0 && url.trim().length > 0;
  },

  normalizeUrl(url) {
    const protocolPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
    
    if (protocolPattern.test(url)) {
      return url;
    } else {
      return 'https://' + url;
    }
  },

  render() {
    if (!this.listElement) {
      return;
    }
    
    this.listElement.innerHTML = '';
    
    const quickLinks = StateManager.state.quickLinks;
    
    // NEW: Show/hide empty state
    if (this.emptyState) {
      if (quickLinks.length === 0) {
        this.emptyState.classList.add('show');
      } else {
        this.emptyState.classList.remove('show');
      }
    }
    
    quickLinks.forEach(link => {
      const linkContainer = document.createElement('div');
      linkContainer.className = 'quicklink-item';
      
      const linkBtn = document.createElement('button');
      linkBtn.className = 'btn quicklink-btn';
      linkBtn.textContent = link.name;
      linkBtn.dataset.url = link.url;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-small quicklink-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.dataset.id = link.id;
      deleteBtn.setAttribute('aria-label', `Delete ${link.name}`);
      
      linkContainer.appendChild(linkBtn);
      linkContainer.appendChild(deleteBtn);
      
      this.listElement.appendChild(linkContainer);
    });
  },

  handleAdd(event) {
    event.preventDefault();
    
    if (!this.nameInputElement || !this.urlInputElement) {
      return;
    }
    
    const name = this.nameInputElement.value;
    const url = this.urlInputElement.value;
    
    if (!this.validateInput(name, url)) {
      return;
    }
    
    const normalizedUrl = this.normalizeUrl(url.trim());
    
    StateManager.addQuickLink(name.trim(), normalizedUrl);
    
    this.nameInputElement.value = '';
    this.urlInputElement.value = '';
    
    this.render();
  },

  handleClick(url) {
    window.open(url, '_blank');
  },

  handleDelete(id) {
    StateManager.deleteQuickLink(id);
    this.render();
  }
};

// ============================================================================
// Application Initialization
// ============================================================================
// Bootstrap the application and coordinate all components.

const App = {
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

  init() {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn('Local Storage is not available. Data will not be persisted across sessions.');
        const warningDiv = document.createElement('div');
        warningDiv.className = 'storage-warning';
        warningDiv.textContent = 'Warning: Local Storage is unavailable. Your data will not be saved.';
        warningDiv.style.cssText = 'background-color: rgba(255, 243, 205, 0.9); color: #856404; padding: 10px; text-align: center; border-bottom: 1px solid #ffeaa7; backdrop-filter: blur(10px);';
        document.body.insertBefore(warningDiv, document.body.firstChild);
      }

      StateManager.loadState();
      
      // NEW: Initialize Theme Manager
      ThemeManager.init();
      
      const greetingSection = document.getElementById('greeting-section');
      if (greetingSection) {
        GreetingComponent.init(greetingSection);
      } else {
        console.error('Greeting section not found');
      }
      
      const timerSection = document.getElementById('timer-section');
      if (timerSection) {
        TimerComponent.init(timerSection);
      } else {
        console.error('Timer section not found');
      }
      
      const todoSection = document.getElementById('todo-section');
      if (todoSection) {
        TodoComponent.init(todoSection);
      } else {
        console.error('Todo section not found');
      }
      
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

  handleError(error) {
    console.error('Application error:', error);
  },

  cleanup() {
    try {
      if (GreetingComponent && GreetingComponent.destroy) {
        GreetingComponent.destroy();
      }
      
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

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// ============================================================================
// Page Lifecycle Management
// ============================================================================

window.addEventListener('beforeunload', () => {
  App.cleanup();
});

window.addEventListener('pagehide', () => {
  App.cleanup();
});

// ============================================================================
// Application Bootstrap
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}
