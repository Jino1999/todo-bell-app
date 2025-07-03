let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";
let isMuted = JSON.parse(localStorage.getItem("isMuted")) || false;

//// Request browser notification permission ////
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  const due = document.getElementById("dueDateTime").value;
  if (text === "") return;

  tasks.push({ text, due, done: false, notified: false, finalNotified: false });
  document.getElementById("taskInput").value = "";
  document.getElementById("dueDateTime").value = "";
  saveAndRender();
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  const now = new Date();

  tasks.forEach((task, index) => {
    if ((filter === "done" && !task.done) || (filter === "notDone" && task.done)) return;

    const dueTime = new Date(task.due);
    const diff = dueTime - now;

    if (diff <= 0 && !task.notified && !task.done) {
      task.notified = true;
      alert(`🔔 Time's up for: "${task.text}"`);
      showNotification(`⏰ "${task.text}" is due now!`);
      playSound(1);
    }

    const twoMinutesLater = new Date(dueTime.getTime() + 2 * 60000);
    if (now >= twoMinutesLater && !task.finalNotified && !task.done) {
      task.finalNotified = true;
      alert(`⏰ Final Reminder: "${task.text}" is still not done.`);
      showNotification(`🔔 Final Reminder: "${task.text}"`);
      playSound(30);
    }

    let countdown = "";
    if (diff > 0 && !task.done) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      countdown = `⏳ ${h}h ${m}m ${s}s`;
    }

    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.setAttribute("data-index", index);
    li.ondragstart = dragStart;
    li.ondragover = allowDrop;
    li.ondrop = drop;

    li.innerHTML = `
      <span onclick="toggleDone(${index})" class="${task.done ? 'done' : ''}">
        ${task.text}
        <small>${task.due ? '(' + new Date(task.due).toLocaleString() + ')' : ''}</small>
        <div class="countdown">${countdown}</div>
      </span>
      <button onclick="removeTask(${index})">❌</button>
    `;
    taskList.appendChild(li);
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  saveAndRender();
}

function removeTask(index) {
  tasks.splice(index, 1);
  saveAndRender();
}

function clearAll() {
  tasks = [];
  saveAndRender();
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

function setFilter(type) {
  filter = type;
  renderTasks();
}

function saveAndRender() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

function playSound(seconds = 1) {
  if (isMuted) return;
  let bellAudio = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
  bellAudio.loop = true;
  bellAudio.play().then(() => {
    setTimeout(() => {
      bellAudio.pause();
      bellAudio.currentTime = 0;
    }, seconds * 1000);
  }).catch(e => {
    console.warn("🔇 Sound blocked:", e.message);
  });
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem("isMuted", JSON.stringify(isMuted));
  document.getElementById("muteToggle").textContent = isMuted ? "🔇 Sound Off" : "🔔 Sound On";
}

function showNotification(message) {
  if (Notification.permission === "granted") {
    new Notification(message);
  }
}

//// Drag & Drop handlers ////
let draggedIndex = null;

function dragStart(event) {
  draggedIndex = event.target.getAttribute("data-index");
}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const targetIndex = event.target.closest("li").getAttribute("data-index");
  if (draggedIndex === null || targetIndex === null) return;
  const draggedItem = tasks.splice(draggedIndex, 1)[0];
  tasks.splice(targetIndex, 0, draggedItem);
  saveAndRender();
}

window.onload = () => {
  renderTasks();
  setInterval(renderTasks, 1000);
  document.getElementById("muteToggle").textContent = isMuted ? "🔇 Sound Off" : "🔔 Sound On";
};
