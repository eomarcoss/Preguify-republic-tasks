const Task = require("../models/task");
const User = require("../models/user");

// Criar task
async function createTask(req, res) {
  try {
    const { title, description, points, assignedTo, expiresAt } = req.body;

    console.log(req.body);
    if (!title || !assignedTo || !expiresAt) {
      return res
        .status(400)
        .json({ error: "Título, usuario e data são obrigatorios" });
    }

    if (new Date(expiresAt) <= new Date()) {
      return res.status(400).json({
        error: "A data precisa ser futura",
      });
    }

    const task = await Task.create({
      title,
      description,
      points: Number(points),
      assignedTo,
      expiresAt: new Date(expiresAt),
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Erro real: ", error);
    return res.status(500).json({ error: "Error ao criar a task" });
  }
}

// Listar tasks
async function readTask(req, res) {
  try {
    const now = new Date();

    const expiredTasks = await Task.find({
      expiresAt: { $lte: now },
    });

    for (let task of expiredTasks) {
      await Task.findByIdAndDelete(task._id);
    }

    const tasks = await Task.find({
      expiresAt: { $gt: now },
    })
      .populate("assignedTo", "name points photo")
      .sort({ expiresAt: 1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar tasks" });
  }
}

// Atualizar task
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(400).json({ error: "Task não encontrada" });
    }

    if (status === "done" && task.status !== "done") {
      await User.findByIdAndUpdate(task.assignedTo, {
        $inc: { points: task.points },
      });
    }

    task.status = status || task.status;
    await task.save();

    return res.json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error ao atualizar task" });
  }
}

// Deletar task única
async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task não encontrada" });
    }
    await Task.findByIdAndDelete(id);

    res.json({ message: "Task removida com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover task" });
  }
}

// Deletar todos tasks por usuario
async function deleteTasksByUser(req, res) {
  try {
    const { userId } = req.params;

    await Task.deleteMany({ assignedTo: userId });

    res.json({ message: "Tasks do usuario removidas" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remvoer tasks do usuário" });
  }
}

// Marcar complete na task
async function toggleTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { done } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task não encontrada" });
    }

    // Se já está no mesmo estado, não faz nada
    if ((task.status === "done") === done) {
      return res.json({ message: "Nenhuma alteração necessária" });
    }

    task.status = done ? "done" : "pending";
    await task.save();

    // Atualiza pontos de usuario
    const pointsChange = done ? task.points : -task.points;

    await User.findByIdAndUpdate(task.assignedTo, {
      $inc: { points: pointsChange },
    });

    res.json({ message: "Status atualizado com sucesso" });
  } catch (error) {
    console.error("ERRO REAL:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Apagar todas as tasks
async function deleteAllTasks(req, res) {
  try {
    const tasks = await Task.find();

    // Agrupa total de pontos a remover por usuário
    const pointsToRemove = {};
    for (const task of tasks) {
      if (task.status === "done") {
        const id = task.assignedTo.toString();
        pointsToRemove[id] = (pointsToRemove[id] || 0) + task.points;
      }
    }

    // Desconta uma vez só por usuário, sem deixar negativo
    for (const [userId, points] of Object.entries(pointsToRemove)) {
      const user = await User.findById(userId);
      if (user) {
        const finalPoints = Math.max(0, user.points - points);
        await User.findByIdAndUpdate(userId, { $set: { points: finalPoints } });
      }
    }

    await Task.deleteMany({});

    res.json({ message: "Todas as tasks removidas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover todas as tasks" });
  }
}

module.exports = {
  createTask,
  readTask,
  updateTask,
  deleteTask,
  deleteTasksByUser,
  toggleTaskStatus,
  deleteAllTasks,
};
