$(document).ready(function () {
  initApp();
  initUsersPage();
});
function initApp() {
  // ========= USERS =========
  $(document)
    .off("submit", "#userFormTask")
    .on("submit", "#userFormTask", function (e) {
      e.preventDefault();
      createUserTask();
    });

  $(document)
    .off("click", "#userList .btn-delete")
    .on("click", "#userList .btn-delete", function () {
      const userId = $(this).data("id");
      deleteUser(userId);
    });

  $(document)
    .off("change", "#photoInput")
    .on("change", "#photoInput", function (e) {
      previewImage(e);
    });

  $(document)
    .off("click", "#btn-delete-all-users")
    .on("click", "#btn-delete-all-users", function (e) {
      deleteAllUsers();
    });

  $(document)
    .off("click", "#btn-reset-points")
    .on("click", "#btn-reset-points", function () {
      resetAllPoints();
    });

  $(document).ready(function () {
    initTheme();
    });
  
  $(document)
    .off("click", ".btn-reset")
    .on("click", ".btn-reset", function () {
      const userId = $(this).data("id");
      resetUserPoints(userId);
  });

  // ========= TASKS =========
  $(document)
    .off("submit", "#newTaskForm")
    .on("submit", "#newTaskForm", function (e) {
      e.preventDefault();
      createTask();
    });

  $(document)
    .off("change", "#taskList .task-checkbox")
    .on("change", "#taskList .task-checkbox", function () {
      const taskId = $(this).data("id");
      const isChecked = $(this).is(":checked");
      toggleTaskStatus(taskId, isChecked);
    });

  $(document)
    .off("click", "#taskList .task-delete")
    .on("click", "#taskList .task-delete", function () {
      const taskId = $(this).data("id");
      deleteTask(taskId);
    });

  $(document)
    .off("click", "#btnDeleteAllTasks")
    .on("click", "#btnDeleteAllTasks", function () {
      deleteAllTasks();
    });
  
  $(document)
  .off("click", "#taskList .task-desc")
  .on("click", "#taskList .task-desc", function () {
    toggleDescription(this);
  });

}

// Inicializar página de usuários
function initUsersPage() {
  loadUsers();
}

// Inicializar página de tarefas
function initTasksPage() {
  loadTasks();
  loadUsers();
}

// Inicializar página de criar tarefa
function initCreateTaskPage() {
  loadUsers();
}

// Inicializar página de ranking
function initRankingPage() {
  loadRanking();
}

//Carregar usuarios na tela
function loadUsers() {
  $.ajax({
    url: "/users",
    method: "GET",
    success: function (users) {
      $("#userList").empty(); // limpa usuarios ativos antes de carregar
      $("#taskUser").empty(); // limpa opcoes de usuario para task
      users.forEach(function (user) {
        // adiciona na lista de usuarios ativos
        $("#userList").append(`
          <li class="list-group-item d-flex align-items-around justify-content-between gap-3 py-3">
              <img
              src="${user.photo}" 
              class="rounded-circle"
              width="40"
              height="40"
              style="object-fit: cover"
            />

          <div class="flex-grow-1">
          <div class="fw-medium">${user.name}</div>
          <small class="text-muted">${user.points || 0} pontos</small>
          </div>

            <button class="btn fs-4 btn-reset" data-id="${user._id}" title="Zerar pontos">
              <i class="bi bi-arrow-counterclockwise text-warning"></i>
            </button>

            <button class="btn fs-4 btn-delete" data-id="${user._id}" title="Deletar usuário">
              <i class="bi bi-dash-circle text-danger"></i>
            </button>
          
          </li>
        `);

        // adiciona no select
        $("#taskUser").append(`
          <option value="${user._id}">
            ${user.name}
          </option>
        `);
      });
    },
    error: function (xhr) {
      console.error("Erro ao carregar usuários:", xhr.responseJSON);
    },
  });
}

//Deletar usuario
async function deleteUser(userId) {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja deletar este usuário?",
    showCancelButton: true,
    confirmButtonText: "Sim, deletar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#6d0a96",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: `/users/${userId}`,
    method: "DELETE",
    success: function (response) {
      Toastify({
        text: "✅ Usuário deletado com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();

      deleteAllTasksByUser(userId);
      loadUsers();
      loadRanking();
    },
    error: function (xhr) {
      Toastify({
        text: "❌ Erro ao deletar usuário!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao deletar usuário: ", xhr.responseJSON);
    },
  });
}

//Deletar todos os usuarios
async function deleteAllUsers() {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja deletar TODOS os usuários?",
    showCancelButton: true,
    confirmButtonText: "Sim, deletar todos",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#6d0a96",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: "/users",
    method: "DELETE",
    success: function (response) {
      Toastify({
        text: `✅ ${response.deletedCount} usuários deletados com sucesso!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();

      loadUsers();
      loadRanking();
    },
    error: function (xhr) {
      Toastify({
        text: "❌ Erro ao deletar usuários!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao deletar usuários: ", xhr.responseJSON);
    },
  });
}

// Criação de user
function createUserTask() {
  const name = $("#UserNameTask").val();
  const photo = $("#preview").attr("src");

  if (!name.trim()) {
    alert("Por favor, digite um nome");
    return;
  }

  $.ajax({
    url: "/users",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ name, photo }),
    success: function (response) {
      Toastify({
        text: `✅ Usuário criado com sucesso!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();

      localStorage.setItem("userId", response._id);
      $("#UserNameTask").val("");
      loadUsers();
      resetPreview();
    },
    error: function (error) {
      alert("Erro ao criar o usuário");
      console.log(error);
    },
  });
}

//Preview da imagem de perfil
function previewImage(event) {
  const input = event.target;
  const preview = document.getElementById("preview");

  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
    };

    reader.readAsDataURL(input.files[0]);
  }
}

//Resete do preview
function resetPreview() {
  const preview = document.getElementById("preview");
  const input = document.getElementById("photoInput"); // ajuste o id

  preview.src = "/pages/adicionar_user.jpg"; // ajuste o caminho
  input.value = "";
}

// Criação de tasks
function createTask() {
  const title = $("#taskTitle").val();
  const description = $("#taskDescription").val();
  const points = $("#taskPoints").val();
  const assignedTo = $("#taskUser").val();
  const expiresAt = $("#expiresAt").val();
  const expiresAtDate = new Date(expiresAt);

  if (!assignedTo) {
    Toastify({
      text: "Selecione um usuário!",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "#f59e0b" },
    }).showToast();
    return;
  }

  if (expiresAtDate <= new Date()) {
    Toastify({
      text: "Escolha uma data futura!",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "#f59e0b" },
    }).showToast();
    return;
  }

  $.ajax({
    url: "/tasks",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ title, description, points, assignedTo, expiresAt }),
    success: function (response) {
      Toastify({
        text: "✅ Task criada com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#9902c7" },
      }).showToast();

      $("#newTaskForm")[0].reset();
      loadTasks();
    },
    error: function (xhr) {
      Toastify({
        text: "Erro ao criar task!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao criar task:", xhr.responseJSON);
    },
  });
}

//Mostrar na tela tasks
function loadTasks() {
  loadUsers();
  $.ajax({
    url: "/tasks",
    method: "GET",
    success: function (tasks) {
      $("#taskList").empty();

      if (tasks.length === 0) {
        $("#taskList").append(`
                <li class="list-group-item text-muted">
                Nenhuma task cadastrada
                </li>
            `);
        return;
      }

      tasks.forEach(function (task) {
        $("#taskList").append(`
          <li class="task-item ">
            <div class="task-content">
              <div class="task-left">
                <input class="me-3 form-check-input task-checkbox" type="checkbox" data-id="${task._id}" ${task.status === "done" ? "checked" : ""} />
                <div>
                    <div class="task-title w-100 ${task.status === "done" ? "task-through" : ""} ">
                        <strong> ${task.title}</strong>
                    </div>

                  <div class="task-desc ${task.status === "done" ? "task-through" : ""}" data-expanded="false">
                      ${task.description || ""}
                  </div>

                  <div class="task-meta">
                    <img
                      src="${task.assignedTo?.photo ? task.assignedTo.photo : "/pages/adicionar_user.png"}"
                      class="rounded-circle border"
                      width="40"
                      height="40"
                      alt="Foto de perfil"
                    />
                    <span>${task.assignedTo?.name || "Sem usuário"}</span>
                    <span class="task-points">${task.points}pts</span>
                  </div>
                </div>
              </div>

              <div class="task-right">
                <span class="badge rounded-pill text-bg-warning d-flex align-items-center gap-1 px-3 py-2 task-timer" data-expires="${task.expiresAt}">
                  <i class="bi bi-clock" style="color: black;"></i>
                </span>
                
                <button class="task-delete mt-4" data-id="${task._id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </li>
        `);
      });
      startTimers();
    },
    error: function (xhr) {
      console.error("Error ao carregar tasks", xhr.responseJSON);
    },
  });
}

// Marca e desmarcar task
function toggleDescription(el) {
  const isExpanded = el.dataset.expanded === "true";
  el.dataset.expanded = !isExpanded;
  el.classList.toggle("task-desc-expanded", !isExpanded);
}

//Apagar todas as tasks de um usuario
function deleteAllTasksByUser(userId) {
  $.ajax({
    url: `/tasks/user/${userId}`, //Conferir url
    method: "DELETE",

    success: function (response) {
      console.log("Tasks do usuário removidas: ", response);
      loadTasks();
    },

    error: function (xhr) {
      console.error("Error ao remover tasks do usuário", xhr.responseJSON);
    },
  });
}

//Marcar/desmarcar a task (feita e nao feita)
function toggleTaskStatus(taskId, done) {
  $.ajax({
    url: `/tasks/${taskId}/toggle`,
    method: "PATCH",
    contentType: "application/json",
    data: JSON.stringify({ done }),

    success: function () {
      loadTasks();
      loadUsers();
      loadRanking();
    },

    error: function (xhr) {
      console.error("Erro ao atualizar task: ", xhr.responseJSON);
    },
  });
}

// Apagar task individual
async function deleteTask(taskId) {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja apagar essa task?",
    showCancelButton: true,
    confirmButtonText: "Sim, apagar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#6d0a96",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: `/tasks/${taskId}`,
    method: "DELETE",
    success: function () {
      Toastify({
        text: "✅ Task apagada com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();
      loadTasks();
      loadUsers();
    },
    error: function (xhr) {
      Toastify({
        text: "Erro ao apagar task!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao deletar task:", xhr.responseJSON);
    },
  });
}

// Apaga todas as tasks
async function deleteAllTasks() {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja apagar TODAS as tasks?",
    showCancelButton: true,
    confirmButtonText: "Sim, apagar tudo",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: "/tasks",
    method: "DELETE",
    success: function () {
      Toastify({
        text: "✅ Todas as tasks apagadas!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();
      loadTasks();
      loadUsers();
    },
    error: function (xhr) {
      Toastify({
        text: "Erro ao apagar todas as tasks!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao apagar todas as tasks:", xhr.responseJSON);
    },
  });
}

//Ranking de usuarios
function loadRanking() {
  $.ajax({
    url: "/users/ranking",
    method: "GET",

    success: function (users) {
      $("#rankingList").empty();

      users.forEach(function (user, index) {
        $("#rankingList").append(`
          <li class="list-group-item d-flex justify-content-between">

            <div>
              <strong class="me-2">${index + 1}</strong>    

              <img
              src="${user.photo}" 
              class="rounded-circle me-2 perfil-img"
              width="60"
              height="60"
              style="object-fit: cover"
            /> <strong> ${user.name} </strong>
            
            </div>
<span class="badge rounded-pill text-bg-success d-inline-flex align-items-center gap-1 px-3 py-2">
   ${user.points} pts
</span>

          </li>
        `);
      });
    },

    error: function (xhr) {
      console.error("Erro ao carregar ranking:", xhr.responseJSON);
    },
  });
}
//Reseta os pontos de um usuario
async function resetUserPoints(userId) {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja zerar os pontos deste usuário?",
    showCancelButton: true,
    confirmButtonText: "Sim, zerar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#6d0a96",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: `/users/${userId}`,  
    method: "PUT",            
    contentType: "application/json",
    data: JSON.stringify({ points: 0 }),  
    success: function (response) {
      Toastify({
        text: "✅ Pontos zerados com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#22c55e" },
      }).showToast();

      loadUsers();
      loadRanking();
    },
    error: function (xhr) {
      Toastify({
        text: "❌ Erro ao zerar pontos!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#ef4444" },
      }).showToast();
      console.error("Erro ao zerar pontos: ", xhr.responseJSON);
    },
  });
}

//Reseta todos os pontos de todos os usuarios
async function resetAllPoints() {
  const result = await Swal.fire({
    icon: "warning",
    title: "Atenção!",
    text: "Tem certeza que deseja zerar os pontos de todos os usuários?",
    showCancelButton: true,
    confirmButtonText: "Sim, zerar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#6d0a96",
    cancelButtonColor: "#aaa",
  });

  if (!result.isConfirmed) return;

  $.ajax({
    url: "/users/reset-points",
    method: "PATCH",
    success: function (response) {
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: response.message,
        timer: 2000,
        showConfirmButton: false,
      });
      loadUsers();
      loadRanking();
    },
    error: function (xhr) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Não foi possível zerar os pontos.",
      });
      console.error("Erro ao resetar pontos:", xhr.responseJSON);
    },
  });
}

//Mudança de thema dark/light
function initTheme() {
  const html = document.documentElement;
  const themeToggle = $("#themeToggle");
  const themeIcon = $("#themeIcon");

  function updateThemeIcon(theme) {
    themeIcon.attr("class", theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars");
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-bs-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.on("click", function (e) {
    e.preventDefault();
    const newTheme = html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
}

let timerInterval = null;

function startTimers() {
  // Se já existe um timer rodando, para ele
  if (timerInterval) clearInterval(timerInterval);

  // Cria um novo intervalo que roda a cada 1 segundo
  timerInterval = setInterval(() => {
    // Para cada elemento com classe .task-timer
    $(".task-timer").each(function () {
      // Pega a data de expiração que está no data-expires
      const expiresAt = new Date($(this).data("expires"));

      // Pega a data atual
      const now = new Date();

      // Calcula a diferença em milissegundos
      const diff = expiresAt - now;

      // Se já expirou
      if (diff < 0) {
        $(this).text("Expirada");
        loadTasks();
        return;
      }

      // Converte milissegundos em tempo legível
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      // Atualiza o texto do elemento

      let timeString = "";

      if (days > 0) {
        timeString += `${days}d `;
      }

      if (hours > 0) {
        timeString += `${hours}h `;
      }

      if (minutes > 0) {
        timeString += `${minutes}m `;
      }

      if (minutes == 0) {
        timeString += `${seconds}s`;
      }

      $(this).html(`<i class="bi bi-clock" style="color: black;"></i> ${timeString.trim()}`);
    });
  }, 1000);
}
