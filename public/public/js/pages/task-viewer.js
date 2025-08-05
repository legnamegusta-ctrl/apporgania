// js/pages/task-viewer.js

import { db } from "../config/firebase.js"
import { showToast, showSpinner, hideSpinner } from "../services/ui.js"
// CORREÇÃO: Adicionado 'collectionGroup' ao import do firebase/firestore
import {
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  collectionGroup,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js"

export function initTaskViewer(userId, userRole) {
  const params = new URLSearchParams(window.location.search)
  const taskId = params.get("taskId")
  const agronomistId = params.get("agronomistId")
  const clientId = params.get("clientId")
  const status = params.get("status")
  const isEditMode = params.get("edit") === "true"

  // Elementos da página
  const taskViewerContainer = document.getElementById("taskViewerContainer")
  const backBtn = document.getElementById("backBtn")
  const filterAgronomist = document.getElementById("filterAgronomist")
  const filterClient = document.getElementById("filterClient")
  const filterStatus = document.getElementById("filterStatus")

  // Configurar botão de voltar
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      history.back()
    })
  }

  // Se um taskId específico foi fornecido, mostrar apenas essa tarefa
  if (taskId) {
    loadSingleTask(taskId)
  } else {
    // Caso contrário, mostrar lista de tarefas com filtros
    setupFilters()
    loadTasksList()
  }

  async function loadSingleTask(taskId) {
    if (!taskViewerContainer) return
    showSpinner(taskViewerContainer)

    try {
      // CORREÇÃO: Usar collectionGroup() para buscar em todas as subcoleções 'tasks'
      const tasksQuery = query(collectionGroup(db, "tasks"))
      const snapshot = await getDocs(tasksQuery)

      let taskDoc = null
      let clientId = null

      // Encontrar a tarefa específica
      snapshot.forEach((doc) => {
        if (doc.id === taskId) {
          taskDoc = doc
          // Extrair clientId do caminho do documento
          const pathParts = doc.ref.path.split("/")
          clientId = pathParts[pathParts.indexOf("clients") + 1]
        }
      })

      if (!taskDoc) {
        taskViewerContainer.innerHTML = '<p class="text-red-500 text-center p-4">Tarefa não encontrada.</p>'
        return
      }

      const taskData = { id: taskDoc.id, clientId, ...taskDoc.data() }

      // Buscar dados do cliente
      const clientDoc = await getDoc(doc(db, "clients", clientId))
      const clientData = clientDoc.exists() ? clientDoc.data() : { name: "Cliente não encontrado" }

      renderSingleTask(taskData, clientData)
    } catch (error) {
      console.error("Erro ao carregar tarefa:", error)
      taskViewerContainer.innerHTML = '<p class="text-red-500 text-center p-4">Erro ao carregar tarefa.</p>'
    } finally {
      hideSpinner(taskViewerContainer)
    }
  }

  function renderSingleTask(task, client) {
    if (!taskViewerContainer) return

    const dueDate = task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR") : "Não definida"
    const isOverdue = task.dueDate && new Date(task.dueDate + "T12:00:00") < new Date() && !task.isCompleted
    const statusClass = task.isCompleted
      ? "bg-green-100 text-green-800"
      : isOverdue
        ? "bg-red-100 text-red-800"
        : "bg-yellow-100 text-yellow-800"
    const statusText = task.isCompleted ? "Concluída" : isOverdue ? "Atrasada" : "Pendente"

    taskViewerContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">${task.title}</h2>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">${statusText}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-2">Detalhes da Tarefa</h3>
                        <p><strong>Cliente:</strong> ${client.name}</p>
                        <p><strong>Data de Vencimento:</strong> ${dueDate}</p>
                        <p><strong>Status:</strong> ${statusText}</p>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-2">Descrição</h3>
                        <p class="text-gray-600">${task.description || "Nenhuma descrição fornecida."}</p>
                    </div>
                </div>

                ${
                  !task.isCompleted
                    ? `
                    <div class="flex gap-4">
                        <button id="completeTaskBtn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Marcar como Concluída
                        </button>
                        <button id="editTaskBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Editar Tarefa
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        `

    // Adicionar event listeners para os botões
    const completeTaskBtn = document.getElementById("completeTaskBtn")
    const editTaskBtn = document.getElementById("editTaskBtn")

    if (completeTaskBtn) {
      completeTaskBtn.addEventListener("click", () => completeTask(task.id, task.clientId))
    }

    if (editTaskBtn) {
      editTaskBtn.addEventListener("click", () => {
        // Redirecionar para modo de edição (implementar conforme necessário)
        showToast("Funcionalidade de edição será implementada em breve.", "info")
      })
    }
  }

  async function completeTask(taskId, clientId) {
    try {
      const taskRef = doc(db, `clients/${clientId}/tasks`, taskId)
      await updateDoc(taskRef, {
        isCompleted: true,
        completedAt: new Date(),
      })

      showToast("Tarefa marcada como concluída!", "success")
      // Recarregar a tarefa para mostrar o novo status
      loadSingleTask(taskId)
    } catch (error) {
      console.error("Erro ao completar tarefa:", error)
      showToast("Erro ao completar tarefa: " + error.message, "error")
    }
  }

  async function setupFilters() {
    // Implementar setup dos filtros se necessário
    // Por enquanto, apenas carregar a lista de tarefas
  }

  async function loadTasksList() {
    if (!taskViewerContainer) return
    showSpinner(taskViewerContainer)

    try {
      let tasksQuery = query(collectionGroup(db, "tasks"), orderBy("dueDate", "desc"))

      // Aplicar filtros baseados nos parâmetros da URL
      if (agronomistId) {
        tasksQuery = query(tasksQuery, where("responsibleAgronomistId", "==", agronomistId))
      }

      if (status) {
        const isCompleted = status === "completed"
        tasksQuery = query(tasksQuery, where("isCompleted", "==", isCompleted))
      }

      const snapshot = await getDocs(tasksQuery)

      if (snapshot.empty) {
        taskViewerContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Nenhuma tarefa encontrada.</p>'
        return
      }

      // Processar tarefas e buscar dados dos clientes
      const tasks = []
      const clientIds = new Set()

      snapshot.forEach((doc) => {
        const pathParts = doc.ref.path.split("/")
        const clientId = pathParts[pathParts.indexOf("clients") + 1]
        clientIds.add(clientId)
        tasks.push({ id: doc.id, clientId, ...doc.data() })
      })

      // Buscar dados dos clientes
      const clientsData = {}
      for (const clientId of clientIds) {
        try {
          const clientDoc = await getDoc(doc(db, "clients", clientId))
          if (clientDoc.exists()) {
            clientsData[clientId] = clientDoc.data()
          }
        } catch (error) {
          console.error(`Erro ao buscar cliente ${clientId}:`, error)
          clientsData[clientId] = { name: "Cliente não encontrado" }
        }
      }

      renderTasksList(tasks, clientsData)
    } catch (error) {
      console.error("Erro ao carregar lista de tarefas:", error)
      taskViewerContainer.innerHTML = '<p class="text-red-500 text-center p-4">Erro ao carregar tarefas.</p>'
    } finally {
      hideSpinner(taskViewerContainer)
    }
  }

  function renderTasksList(tasks, clientsData) {
    if (!taskViewerContainer) return

    taskViewerContainer.innerHTML = `
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Lista de Tarefas</h2>
                <div id="tasksListContainer" class="space-y-4"></div>
            </div>
        `

    const tasksListContainer = document.getElementById("tasksListContainer")
    if (!tasksListContainer) return

    tasks.forEach((task) => {
      const client = clientsData[task.clientId] || { name: "Cliente não encontrado" }
      const dueDate = task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR") : "Não definida"
      const isOverdue = task.dueDate && new Date(task.dueDate + "T12:00:00") < new Date() && !task.isCompleted
      const statusClass = task.isCompleted
        ? "bg-green-100 text-green-800"
        : isOverdue
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800"
      const statusText = task.isCompleted ? "Concluída" : isOverdue ? "Atrasada" : "Pendente"

      const taskCard = `
                <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-lg text-gray-800">${task.title}</h3>
                            <p class="text-gray-600 text-sm">${client.name}</p>
                            <p class="text-gray-500 text-xs">Vencimento: ${dueDate}</p>
                            ${task.description ? `<p class="text-gray-600 text-sm mt-2">${task.description}</p>` : ""}
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${statusText}</span>
                            <a href="task-viewer.html?taskId=${task.id}" class="text-blue-600 hover:text-blue-800 text-sm">Ver Detalhes</a>
                        </div>
                    </div>
                </div>
            `

      tasksListContainer.innerHTML += taskCard
    })
  }
}
