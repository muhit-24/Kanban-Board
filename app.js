const STORAGE_KEY = "kengo-tasks-v1";
const THEME_STORAGE_KEY = "kengo-theme";
const columns = [
  { id: "todo", label: "To do", className: "todo", empty: "Your next step starts here." },
  { id: "doing", label: "Doing", className: "doing", empty: "Nothing in progress yet." },
  { id: "done", label: "Done", className: "done", empty: "Completed tasks will appear here." }
];

let tasks = loadTasks();
let activeFilter = "all";
let sortMode = "last-added";
let draggedTaskId = null;
let toastTimer;
let selectMode = false;
const selectedTaskIds = new Set();
let previewTaskId = null;
let returnToPreviewTaskId = null;
let modalFormSnapshot = null;

const boardColumns = document.querySelector("#boardColumns");
const modal = document.querySelector("#taskModal");
const previewModal = document.querySelector("#previewModal");
const form = document.querySelector("#taskForm");
const moreButton = document.querySelector("#moreButton");
const profileMenu = document.querySelector("#profileMenu");
const deleteModeButton = document.querySelector("#deleteModeButton");
const bulkDeleteButton = document.querySelector("#bulkDeleteButton");
const selectAllButton = document.querySelector("#selectAllButton");
const cancelDeleteButton = document.querySelector("#cancelDeleteButton");
const selectedTaskCount = document.querySelector("#selectedTaskCount");
const boardMenuButton = document.querySelector("#boardMenuButton");
const boardMenu = document.querySelector("#boardMenu");
const mobileProfileButton = document.querySelector("#mobileProfileButton");
const mobileProfileMenu = document.querySelector("#mobileProfileMenu");
const mobileAppearanceButton = document.querySelector("#mobileAppearanceButton");
const mobileThemeOptions = document.querySelector("#mobileThemeOptions");

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function setTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = selectedTheme;
  localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  document.querySelectorAll(".theme-option").forEach((option) => {
    const isSelected = option.dataset.themeChoice === selectedTheme;
    option.classList.toggle("selected", isSelected);
    option.setAttribute("aria-checked", isSelected);
  });
}

function toggleProfileMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : profileMenu.hidden;
  profileMenu.hidden = !shouldOpen;
  moreButton.setAttribute("aria-expanded", shouldOpen);
}

function toggleBoardMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : boardMenu.hidden;
  boardMenu.hidden = !shouldOpen;
  boardMenuButton.setAttribute("aria-expanded", shouldOpen);
}

function toggleMobileProfileMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : mobileProfileMenu.hidden;
  mobileProfileMenu.hidden = !shouldOpen;
  mobileProfileButton.setAttribute("aria-expanded", shouldOpen);
  if (!shouldOpen) {
    mobileThemeOptions.hidden = true;
    mobileAppearanceButton.setAttribute("aria-expanded", "false");
  }
}

function formatHeaderDate() {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
}

function setGreeting() {
  const hour = new Date().getHours();
  document.querySelector("#greeting").textContent =
    hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  document.querySelectorAll("[data-header-date]").forEach((dateElement) => {
    dateElement.textContent = formatHeaderDate();
  });
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function render() {
  const visibleTasks = activeFilter === "all" ? tasks : tasks.filter((task) => task.priority === activeFilter);
  boardColumns.innerHTML = columns.map((column) => {
    const columnTasks = sortTasks(visibleTasks.filter((task) => task.status === column.id));
    return `
      <article class="column ${column.className}" data-status="${column.id}">
        <div class="column-header">
          <div class="column-label"><span class="column-dot"></span>${column.label}</div>
          <span class="column-count">${columnTasks.length}</span>
        </div>
        <div class="task-list" data-status="${column.id}">
          ${columnTasks.length ? columnTasks.map(taskCard).join("") : `<div class="empty-state">${column.empty}</div>`}
        </div>
      </article>`;
  }).join("");
  bindBoardEvents();
  updateSummary();
}

function sortTasks(columnTasks) {
  if (sortMode === "priority-desc" || sortMode === "priority-asc") {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const direction = sortMode === "priority-desc" ? -1 : 1;
    return [...columnTasks].sort((a, b) => direction * (priorityOrder[a.priority] - priorityOrder[b.priority]));
  }
  return columnTasks;
}

function updateSortControls() {
  document.querySelectorAll(".sort-option").forEach((option) => {
    const isSelected = option.dataset.sortMode === sortMode;
    option.classList.toggle("selected", isSelected);
    option.setAttribute("aria-checked", isSelected);
  });
}

function taskCard(task) {
  return `
    <div class="task-card" draggable="true" data-task-id="${task.id}" tabindex="0">
      ${selectMode ? `<label class="task-select"><input type="checkbox" class="task-checkbox" aria-label="Select ${escapeHtml(task.title)}" ${selectedTaskIds.has(task.id) ? "checked" : ""}><span></span></label>` : ""}
      <div class="task-top">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <span class="priority ${task.priority}">${task.priority}</span>
      </div>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
      <div class="task-footer">
        <span class="task-date">${task.status === "done" ? "Completed today" : "Added today"}</span>
        <div class="task-actions">
          <button class="task-action edit-task" type="button" aria-label="Edit ${escapeHtml(task.title)}">Edit</button>
          <button class="task-action delete-task" type="button" aria-label="Delete ${escapeHtml(task.title)}">×</button>
        </div>
      </div>
      <button class="task-preview-button" type="button" aria-label="Preview ${escapeHtml(task.title)}">
        <span>View details</span><span aria-hidden="true">↗</span>
      </button>
    </div>`;
}

function bindBoardEvents() {
  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedTaskId = card.dataset.taskId;
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      draggedTaskId = null;
      card.classList.remove("dragging");
      document.querySelectorAll(".column").forEach((column) => column.classList.remove("drag-over"));
    });
    card.querySelector(".edit-task").addEventListener("click", () => openModal(card.dataset.taskId));
    card.querySelector(".delete-task").addEventListener("click", () => deleteTask(card.dataset.taskId));
    const previewButton = card.querySelector(".task-preview-button");
    previewButton.addEventListener("mousedown", (event) => event.stopPropagation());
    previewButton.addEventListener("dragstart", (event) => event.preventDefault());
    previewButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openPreview(card.dataset.taskId);
    });
    const checkbox = card.querySelector(".task-checkbox");
    if (checkbox) {
      checkbox.addEventListener("click", (event) => event.stopPropagation());
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedTaskIds.add(card.dataset.taskId);
        else selectedTaskIds.delete(card.dataset.taskId);
        updateDeleteControls();
      });
    }
  });
  document.querySelectorAll(".column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("drag-over");
    });
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggedTaskId) return;
      const task = tasks.find((item) => item.id === draggedTaskId);
      if (task && task.status !== column.dataset.status) {
        task.status = column.dataset.status;
        saveTasks();
        render();
        showToast(`Moved to ${columns.find((item) => item.id === task.status).label}`);
      }
    });
  });
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  document.querySelector("#totalTasks").textContent = total;
  document.querySelector("#completedTasks").textContent = completed;
  document.querySelector("#remainingTasks").textContent = total - completed;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector("#ringValue").textContent = `${percent}%`;
  document.querySelector("#progressRing").style.setProperty("--progress", `${percent}%`);
  document.querySelector("#progressRing").setAttribute("aria-label", `${percent} percent complete`);
  document.querySelector("#completedTrend").textContent = completed ? `${percent}%` : "—";
}

function openModal(taskId = null) {
  const task = tasks.find((item) => item.id === taskId);
  document.querySelector("#modalTitle").textContent = task ? "Edit task" : "Add a new task";
  document.querySelector("#saveTask").textContent = task ? "Save changes" : "Add task";
  document.querySelector("#taskId").value = task?.id || "";
  document.querySelector("#taskTitle").value = task?.title || "";
  document.querySelector("#taskDescription").value = task?.description || "";
  document.querySelector(`input[name="priority"][value="${task?.priority || "medium"}"]`).checked = true;
  modalFormSnapshot = getModalFormValues();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#taskTitle").focus();
}

function openPreview(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  previewTaskId = taskId;
  const statusLabel = columns.find((column) => column.id === task.status)?.label || task.status;
  document.querySelector("#previewTitle").textContent = task.title;
  document.querySelector("#previewPriority").textContent = task.priority;
  document.querySelector("#previewPriority").className = `preview-priority ${task.priority}`;
  document.querySelector("#previewStatus").textContent = statusLabel;
  document.querySelector("#previewDescription").textContent = task.description || "No description added for this task.";
  document.querySelector("#previewDate").textContent = task.status === "done" ? "Completed today" : "Added today";
  previewModal.hidden = false;
  document.querySelector("#closePreview").focus();
}

function closePreview() {
  previewModal.hidden = true;
  previewTaskId = null;
}

function getModalFormValues() {
  return {
    title: document.querySelector("#taskTitle").value,
    description: document.querySelector("#taskDescription").value,
    priority: document.querySelector('input[name="priority"]:checked')?.value || "medium"
  };
}

function isModalFormDirty() {
  return JSON.stringify(getModalFormValues()) !== JSON.stringify(modalFormSnapshot);
}

function requestCloseModal() {
  if (isModalFormDirty() && !window.confirm("You have unsaved changes. Discard them?")) return;
  closeModal();
}

function closeModal() {
  const taskIdToPreview = returnToPreviewTaskId;
  returnToPreviewTaskId = null;
  modalFormSnapshot = null;
  modal.hidden = true;
  form.reset();
  document.body.style.overflow = "";
  if (taskIdToPreview) openPreview(taskIdToPreview);
}

function deleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || !window.confirm(`Delete "${task.title}"?`)) return;
  tasks = tasks.filter((item) => item.id !== taskId);
  saveTasks();
  render();
  showToast("Task deleted");
}

function updateDeleteControls() {
  const count = selectedTaskIds.size;
  selectedTaskCount.textContent = count;
  bulkDeleteButton.hidden = !selectMode;
  selectAllButton.hidden = !selectMode;
  cancelDeleteButton.hidden = !selectMode;
  deleteModeButton.hidden = selectMode;
  bulkDeleteButton.disabled = count === 0;
  const allTasksSelected = tasks.length > 0 && count === tasks.length;
  selectAllButton.textContent = allTasksSelected ? "Deselect all" : "Select all";
  selectAllButton.setAttribute("aria-label", allTasksSelected ? "Deselect all tasks" : "Select all tasks");
  bulkDeleteButton.setAttribute("aria-label", `Delete ${count} selected tasks`);
}

function setSelectMode(enabled) {
  selectMode = enabled;
  selectedTaskIds.clear();
  render();
  updateDeleteControls();
}

function deleteSelectedTasks() {
  const count = selectedTaskIds.size;
  if (!count) {
    showToast("Select at least one task");
    return;
  }
  const warning = `Delete ${count} selected task${count === 1 ? "" : "s"}? This action cannot be undone.`;
  if (!window.confirm(warning)) return;
  tasks = tasks.filter((task) => !selectedTaskIds.has(task.id));
  saveTasks();
  setSelectMode(false);
  showToast(`${count} task${count === 1 ? "" : "s"} deleted`);
}

function toggleSelectAll() {
  if (selectedTaskIds.size === tasks.length) {
    selectedTaskIds.clear();
  } else {
    tasks.forEach((task) => selectedTaskIds.add(task.id));
  }
  render();
  updateDeleteControls();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.querySelector("#taskId").value;
  const title = document.querySelector("#taskTitle").value.trim();
  if (!title) return;
  const description = document.querySelector("#taskDescription").value.trim();
  const priority = document.querySelector('input[name="priority"]:checked').value;
  if (id) {
    const task = tasks.find((item) => item.id === id);
    Object.assign(task, { title, description, priority });
    showToast("Task updated");
  } else {
    tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, description, priority, status: "todo" });
    showToast("Task added");
  }
  saveTasks();
  render();
  modalFormSnapshot = null;
  closeModal();
});

document.querySelector("#addTaskButton").addEventListener("click", () => openModal());
document.querySelector("#boardAddTaskButton").addEventListener("click", () => openModal());
document.querySelector("#closeModal").addEventListener("click", requestCloseModal);
document.querySelector("#cancelModal").addEventListener("click", requestCloseModal);
modal.addEventListener("click", (event) => event.stopPropagation());
document.querySelector("#closePreview").addEventListener("click", closePreview);
previewModal.addEventListener("click", (event) => { if (event.target === previewModal) closePreview(); });
document.querySelector("#previewEdit").addEventListener("click", () => {
  const taskId = previewTaskId;
  returnToPreviewTaskId = taskId;
  closePreview();
  if (taskId) openModal(taskId);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) requestCloseModal();
  if (event.key === "Escape" && !previewModal.hidden) closePreview();
});
document.querySelector("#filterButton").addEventListener("click", () => {
  const options = ["all", "high", "medium", "low"];
  activeFilter = options[(options.indexOf(activeFilter) + 1) % options.length];
  document.querySelector("#filterCount").textContent = activeFilter === "all" ? "All" : activeFilter[0].toUpperCase() + activeFilter.slice(1);
  render();
});
document.querySelectorAll(".sort-option").forEach((option) => {
  option.addEventListener("click", () => {
    sortMode = option.dataset.sortMode;
    updateSortControls();
    render();
    toggleBoardMenu(false);
    showToast(`Sorted: ${option.textContent.trim()}`);
  });
});
deleteModeButton.addEventListener("click", () => {
  setSelectMode(true);
  toggleBoardMenu(false);
});
cancelDeleteButton.addEventListener("click", () => setSelectMode(false));
bulkDeleteButton.addEventListener("click", deleteSelectedTasks);
selectAllButton.addEventListener("click", toggleSelectAll);
boardMenuButton.addEventListener("click", () => toggleBoardMenu());

moreButton.addEventListener("click", () => toggleProfileMenu());
document.querySelectorAll(".theme-option").forEach((option) => {
  option.addEventListener("click", () => {
    setTheme(option.dataset.themeChoice);
    mobileThemeOptions.hidden = true;
    mobileAppearanceButton.setAttribute("aria-expanded", "false");
    toggleProfileMenu(false);
    toggleMobileProfileMenu(false);
    showToast(`${option.dataset.themeChoice === "dark" ? "Dark" : "Light"} theme enabled`);
  });
});
mobileProfileButton.addEventListener("click", () => toggleMobileProfileMenu());
mobileAppearanceButton.addEventListener("click", () => {
  const shouldOpen = mobileThemeOptions.hidden;
  mobileThemeOptions.hidden = !shouldOpen;
  mobileAppearanceButton.setAttribute("aria-expanded", shouldOpen);
});
document.querySelectorAll("[data-mobile-action]").forEach((option) => {
  option.addEventListener("click", () => {
    toggleMobileProfileMenu(false);
    showToast(`${option.dataset.mobileAction === "profile" ? "Profile" : "Settings"} is ready for a future update`);
  });
});
document.addEventListener("click", (event) => {
  if (!profileMenu.hidden && !profileMenu.parentElement.contains(event.target)) toggleProfileMenu(false);
  if (!boardMenu.hidden && !boardMenu.parentElement.contains(event.target)) toggleBoardMenu(false);
  if (!mobileProfileMenu.hidden && !mobileProfileMenu.parentElement.contains(event.target)) toggleMobileProfileMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") toggleProfileMenu(false);
  if (event.key === "Escape") toggleBoardMenu(false);
  if (event.key === "Escape") toggleMobileProfileMenu(false);
});

setTheme(localStorage.getItem(THEME_STORAGE_KEY) || "light");
updateSortControls();
setGreeting();
render();
