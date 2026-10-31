.gitignore

# Kengo

### A calm, focused way to plan your day.

Kengo is a lightweight personal daily Kanban planner designed to make organizing your day feel simple and intentional. Add your tasks, set priorities, move work across the board, and keep an eye on your progress — all from a clean, distraction-free workspace.

No accounts. No backend. No complicated setup.  
Your tasks stay safely in your browser through `localStorage`.

---

## ✨ Features

- **Daily planning dashboard** with a friendly time-based greeting
- **Kanban workflow** with To Do, Doing, and Done columns
- **Drag-and-drop task movement** between workflow stages
- **Create and edit tasks** with optional descriptions
- **Priority labels** for Low, Medium, and High priority tasks
- **Daily progress overview** showing:
  - Total tasks
  - Completed tasks
  - Remaining tasks
  - Completion percentage
- **Persistent local storage** so tasks remain after refreshing or reopening the browser
- **Delete confirmation** to prevent accidental task removal
- **Priority filtering** for quickly focusing on important work
- **Responsive design** for desktop, tablet, and mobile screens
- **Friendly empty states** for columns without tasks

## 🎨 Design philosophy

Kengo is built around a simple idea: productivity tools should reduce mental noise, not add to it.

The interface uses:

- Soft, comfortable colors
- Clear typography and visual hierarchy
- Spacious layouts
- Rounded cards and subtle shadows
- Gentle transitions
- A fixed navigation sidebar on larger screens
- A focused single-column experience on smaller screens

## 🚀 Getting started

### Run locally

Kengo is a frontend-only project and does not require a build step or server.

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/kengo.git
   ```

2. Open the project folder.

3. Open `index.html` in your browser.

That’s it — Kengo is ready to use.

### Optional local server

For the best browser experience, you can serve the project with any simple static server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## 🧭 How to use Kengo

1. Click **Add a task**.
2. Enter a task title.
3. Add an optional description.
4. Choose a priority.
5. Click **Add task**.
6. Drag the task between **To Do**, **Doing**, and **Done** as your day progresses.
7. Use **Edit** or the delete button on any task card when needed.
8. Use the filter button to view tasks by priority.

## 💾 Data and privacy

Kengo does not use a backend, database, authentication system, API, or cloud synchronization.

All tasks are saved locally in your browser using:

```text
localStorage
```

This means:

- Your tasks remain after refreshing the page.
- Your tasks remain when you close and reopen the browser.
- Your data is stored only on the current browser and device.
- Clearing browser storage will remove saved tasks.

## 🛠️ Built with

- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage API
- Native HTML drag-and-drop API

## 📁 Project structure

```text
.
├── index.html    # Application layout and modal markup
├── styles.css    # Responsive styling and visual design
├── app.js        # Task management, drag-and-drop, and persistence
└── README.md     # Project documentation
```

## 🌱 Possible future improvements

Kengo intentionally stays focused on daily planning. Potential enhancements could include:

- Keyboard shortcuts
- Task search
- Custom board themes
- Export and import of local tasks
- Optional daily task history

## 📄 License

This project is available for personal and educational use. Add your preferred license here before publishing if you plan to distribute or open-source the project.

---

Made for clearer mornings, calmer planning, and meaningful progress.
