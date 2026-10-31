const STORAGE_KEY = "kengo-tasks-v1";
const columns = [
  { id: "todo", label: "To do", className: "todo", empty: "Your next step starts here." },
  { id: "doing", label: "Doing", className: "doing", empty: "Nothing in progress yet." },
  { id: "done", label: "Done", className: "done", empty: "Completed tasks will appear here." }
];

let tasks = loadTasks();
let activeFilter = "all";
let draggedTaskId = null;
let toastTimer;

const boardColumns = document.querySelector("#boardColumns");
const modal = document.querySelector("#taskModal");
const form = document.querySelector("#taskForm");

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

function formatHeaderDate() {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
}

function setGreeting() {
  const hour = new Date().getHours();
  document.querySelector("#greeting").textContent =
    hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  document.querySelector("#headerDate").textContent = formatHeaderDate();
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function render() {
  const visibleTasks = activeFilter === "all" ? tasks : tasks.filter((task) => task.priority === activeFilter);
  boardColumns.innerHTML = columns.map((column) => {
    const columnTasks = visibleTasks.filter((task) => task.status === column.id);
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

function taskCard(task) {
  return `
    <div class="task-card" draggable="true" data-task-id="${task.id}" tabindex="0">
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
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  document.querySelector("#taskTitle").focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  document.body.style.overflow = "";
}

function deleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || !window.confirm(`Delete "${task.title}"?`)) return;
  tasks = tasks.filter((item) => item.id !== taskId);
  saveTasks();
  render();
  showToast("Task deleted");
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
  closeModal();
});

document.querySelector("#addTaskButton").addEventListener("click", () => openModal());
document.querySelector("#closeModal").addEventListener("click", closeModal);
document.querySelector("#cancelModal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
document.querySelector("#filterButton").addEventListener("click", () => {
  const options = ["all", "high", "medium", "low"];
  activeFilter = options[(options.indexOf(activeFilter) + 1) % options.length];
  document.querySelector("#filterCount").textContent = activeFilter === "all" ? "All" : activeFilter[0].toUpperCase() + activeFilter.slice(1);
  render();
});

setGreeting();
render();
