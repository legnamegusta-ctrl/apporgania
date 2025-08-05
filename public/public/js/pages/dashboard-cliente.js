// js/pages/dashboard-cliente.js

import { db } from "../config/firebase.js"
import { showSpinner, hideSpinner, showToast, openModal, closeModal } from "../services/ui.js"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js"

export function initClienteDashboard(userId, userRole) {
  const welcomeMessage = document.getElementById("welcomeMessage")
  const summaryMessage = document.getElementById("summaryMessage")
  const propertySelect = document.getElementById("propertySelect")
  const kpiCards = document.getElementById("kpiCards")
  const totalAreaStat = document.getElementById("totalAreaStat")
  const activitiesMonthStat = document.getElementById("activitiesMonthStat")
  const productivityStat = document.getElementById("productivityStat")
  const activePlotsStat = document.getElementById("activePlotsStat")
  const farmActivities = document.getElementById("farmActivities")
  const activitiesList = document.getElementById("activitiesList")
  const activityDetailsModal = document.getElementById("activityDetailsModal")
  const imageLightboxModal = document.getElementById("imageLightboxModal")
  const lightboxImage = document.getElementById("lightboxImage")
  const closeLightboxBtn = document.getElementById("closeLightboxBtn")
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")
  const generatePdfBtn = document.getElementById("generatePdfBtn")
  const dateFrom = document.getElementById("dateFrom")
  const dateTo = document.getElementById("dateTo")
  const pdfProgressModal = document.getElementById("pdfProgressModal")
  const pdfProgress = document.getElementById("pdfProgress")
  const pdfProgressText = document.getElementById("pdfProgressText")

  let allClientProperties = []
  let selectedPropertyId = null
  let currentClientId = null
  let currentClientData = null
  const allUsersCache = {}
  let allActivitiesCache = {}
  let filteredActivities = []

  // Set default date range (last 30 days)
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (dateTo) dateTo.value = today.toISOString().split("T")[0]
  if (dateFrom) dateFrom.value = thirtyDaysAgo.toISOString().split("T")[0]

  const loadClientDashboard = async () => {
    if (activitiesList) showSpinner(activitiesList)
    console.log("Cliente Dashboard: Iniciando carregamento do painel.")
    try {
      const clientQuery = query(collection(db, "clients"), where("clientAuthUid", "==", userId), limit(1))
      const clientSnapshot = await getDocs(clientQuery)
      if (clientSnapshot.empty) {
        console.log("Cliente Dashboard: Nenhum documento de cliente encontrado para o UID:", userId)
        if (activitiesList) hideSpinner(activitiesList)
        if (welcomeMessage) welcomeMessage.textContent = "Bem-vindo(a)!"
        if (summaryMessage) summaryMessage.textContent = "Nenhuma propriedade associada à sua conta foi encontrada."
        if (activitiesList)
          activitiesList.innerHTML =
            '<p class="text-gray-500 text-center col-span-full py-4">Nenhuma propriedade ativa encontrada.</p>'
        if (propertySelect) propertySelect.innerHTML = '<option value="">Nenhuma propriedade encontrada</option>'
        updateKpiCards(null, null, null)
        return
      }
      const clientDoc = clientSnapshot.docs[0]
      const clientData = clientDoc.data()
      currentClientId = clientDoc.id
      currentClientData = clientData
      console.log("Cliente Dashboard: Cliente encontrado. ID:", currentClientId, "Dados:", clientData)
      if (welcomeMessage) welcomeMessage.textContent = `Bem-vindo(a), ${clientData.name.split(" ")[0]}!`
      await loadAllUsersForCache()
      await fetchAndPopulateProperties(currentClientId)
      setupTabListeners()
      setupPdfGeneration()
      setupDateFilters()
    } catch (error) {
      console.error("Erro ao carregar o painel do cliente:", error)
      if (activitiesList) hideSpinner(activitiesList)
      if (welcomeMessage) welcomeMessage.textContent = "Erro ao carregar"
      if (summaryMessage) summaryMessage.textContent = "Não foi possível buscar seus dados."
    }
  }

  async function loadAllUsersForCache() {
    try {
      const agronomosQuery = query(collection(db, "users"), where("role", "==", "agronomo"))
      const agronomosSnapshot = await getDocs(agronomosQuery)
      agronomosSnapshot.forEach((docSnap) => {
        allUsersCache[docSnap.id] = docSnap.data().name || `Agrônomo ${docSnap.id.substring(0, 5)}`
      })
      const operadoresQuery = query(collection(db, "users"), where("role", "==", "operador"))
      const operadoresSnapshot = await getDocs(operadoresQuery)
      operadoresSnapshot.forEach((docSnap) => {
        allUsersCache[docSnap.id] = docSnap.data().name || `Operador ${docSnap.id.substring(0, 5)}`
      })
      console.log("Cliente Dashboard: Cache de usuários carregado:", allUsersCache)
    } catch (error) {
      console.error("Erro ao carregar cache de usuários:", error)
      showToast("Erro ao carregar dados de usuários.", "error")
    }
  }

  async function fetchAndPopulateProperties(clientId) {
    if (!propertySelect) return
    try {
      const propertiesQuery = query(
        collection(db, `clients/${clientId}/properties`),
        where("status", "==", "ativo"),
        orderBy("name"),
      )
      const propertiesSnapshot = await getDocs(propertiesQuery)
      allClientProperties = propertiesSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      if (propertySelect) propertySelect.innerHTML = '<option value="">-- Selecione uma propriedade --</option>'
      if (allClientProperties.length === 0) {
        if (propertySelect) propertySelect.innerHTML = '<option value="">Nenhuma propriedade ativa</option>'
        if (summaryMessage) summaryMessage.textContent = "Você não possui propriedades ativas associadas à sua conta."
        if (activitiesList)
          activitiesList.innerHTML =
            '<p class="text-gray-500 text-center col-span-full py-4">Nenhuma propriedade ativa encontrada.</p>'
        updateKpiCards(null, null, null)
        return
      }
      allClientProperties.forEach((prop) => {
        const option = document.createElement("option")
        option.value = prop.id
        option.textContent = prop.name
        if (propertySelect) propertySelect.appendChild(option)
      })
      if (allClientProperties.length > 0) {
        selectedPropertyId = allClientProperties[0].id
        if (propertySelect) propertySelect.value = selectedPropertyId
        await updateDashboardForSelectedProperty(clientId, selectedPropertyId)
      }
      if (propertySelect && !propertySelect._hasEventListener) {
        propertySelect.addEventListener("change", async (event) => {
          selectedPropertyId = event.target.value
          await updateDashboardForSelectedProperty(clientId, selectedPropertyId)
        })
        propertySelect._hasEventListener = true
      }
    } catch (error) {
      console.error("Erro ao carregar propriedades do cliente:", error)
      showToast("Erro ao carregar suas propriedades.", "error")
      if (propertySelect) propertySelect.innerHTML = '<option value="">Erro ao carregar propriedades</option>'
    }
  }

  async function updateDashboardForSelectedProperty(clientId, propertyId) {
    if (!propertyId) {
      if (summaryMessage) summaryMessage.textContent = "Selecione uma propriedade para ver os detalhes."
      if (activitiesList)
        activitiesList.innerHTML =
          '<p class="text-gray-500 text-center py-4">Selecione uma propriedade para ver as movimentações.</p>'
      updateKpiCards(null, null, null)
      return
    }
    if (activitiesList) showSpinner(activitiesList)
    try {
      const propertyDocRef = doc(collection(db, `clients/${clientId}/properties`), propertyId)
      const propertyDoc = await getDoc(propertyDocRef)
      if (!propertyDoc.exists()) {
        if (summaryMessage) summaryMessage.textContent = "Propriedade não encontrada."
        if (activitiesList)
          activitiesList.innerHTML = '<p class="text-red-500 text-center py-4">Propriedade não encontrada.</p>'
        updateKpiCards(null, null, null)
        return
      }
      const propertyData = propertyDoc.data()
      if (summaryMessage)
        summaryMessage.textContent = `Você está visualizando os dados da propriedade "${propertyData.name}".`
      await updateKpiCards(clientId, propertyId, propertyData)
      await fetchAndDisplayActivities(clientId, propertyId)
    } catch (error) {
      console.error("Erro ao atualizar dashboard para a propriedade selecionada:", error)
      showToast("Erro ao carregar dados da propriedade.", "error")
      if (summaryMessage) summaryMessage.textContent = "Erro ao carregar dados da propriedade."
      if (activitiesList)
        activitiesList.innerHTML = '<p class="text-red-500 text-center py-4">Erro ao carregar movimentações.</p>'
    } finally {
      if (activitiesList) hideSpinner(activitiesList)
    }
  }

  async function updateKpiCards(clientId, propertyId, propertyData) {
    if (!kpiCards) return
    showSpinner(kpiCards)
    if (totalAreaStat) totalAreaStat.textContent = "..."
    if (activePlotsStat) activePlotsStat.textContent = "..."
    if (activitiesMonthStat) activitiesMonthStat.textContent = "..."
    if (productivityStat) productivityStat.textContent = "..."
    if (!clientId || !propertyId || !propertyData) {
      if (totalAreaStat) totalAreaStat.textContent = "0 ha"
      if (activePlotsStat) activePlotsStat.textContent = "0"
      if (activitiesMonthStat) activitiesMonthStat.textContent = "0"
      if (productivityStat) productivityStat.textContent = "N/A"
      hideSpinner(kpiCards)
      return
    }
    try {
      let totalArea = 0
      const plotsQuery = query(
        collection(db, `clients/${clientId}/properties/${propertyId}/plots`),
        where("status", "==", "ativo"),
      )
      const plotsSnapshot = await getDocs(plotsQuery)
      const activePlotsCount = plotsSnapshot.size
      plotsSnapshot.forEach((docSnap) => {
        totalArea += docSnap.data().area || 0
      })
      if (totalAreaStat) totalAreaStat.textContent = `${totalArea.toFixed(2)} ha`
      if (activePlotsStat) activePlotsStat.textContent = activePlotsCount
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      let activitiesInMonthCount = 0
      for (const plotDocSnap of plotsSnapshot.docs) {
        const plotId = plotDocSnap.id
        const culturesQuery = query(
          collection(db, `clients/${clientId}/properties/${propertyId}/plots/${plotId}/culturas`),
          where("status", "==", "ativo"),
        )
        const culturesSnapshot = await getDocs(culturesQuery)
        for (const cultureDocSnap of culturesSnapshot.docs) {
          const cultureId = cultureDocSnap.id
          const culturePath = `clients/${clientId}/properties/${propertyId}/plots/${plotId}/culturas/${cultureId}`
          const managementsQuery = query(
            collection(db, `${culturePath}/managements`),
            where("date", ">=", startOfMonth.toISOString().split("T")[0]),
            where("date", "<=", endOfMonth.toISOString().split("T")[0]),
          )
          const managementsSnapshot = await getDocs(managementsQuery)
          activitiesInMonthCount += managementsSnapshot.size
          const analysesQuery = query(
            collection(db, `${culturePath}/analyses`),
            where("date", ">=", startOfMonth.toISOString().split("T")[0]),
            where("date", "<=", endOfMonth.toISOString().split("T")[0]),
          )
          const analysesSnapshot = await getDocs(analysesQuery)
          activitiesInMonthCount += analysesSnapshot.size
        }
      }
      const completedTasksQuery = query(
        collection(db, `clients/${clientId}/tasks`),
        where("isCompleted", "==", true),
        where("propertyId", "==", propertyId),
        where("dueDate", ">=", startOfMonth.toISOString().split("T")[0]),
        where("dueDate", "<=", endOfMonth.toISOString().split("T")[0]),
      )
      const completedTasksSnapshot = await getDocs(completedTasksQuery)
      activitiesInMonthCount += completedTasksSnapshot.size
      if (activitiesMonthStat) activitiesMonthStat.textContent = activitiesInMonthCount
      if (productivityStat) productivityStat.textContent = "N/A"
    } catch (error) {
      console.error("Erro ao atualizar KPIs:", error)
      if (totalAreaStat) totalAreaStat.textContent = "Erro"
      if (activePlotsStat) activePlotsStat.textContent = "Erro"
      if (activitiesMonthStat) activitiesMonthStat.textContent = "Erro"
      if (productivityStat) productivityStat.textContent = "Erro"
      showToast("Erro ao carregar os indicadores.", "error")
    } finally {
      hideSpinner(kpiCards)
    }
  }

  async function fetchAndDisplayActivities(clientId, propertyId) {
    if (!activitiesList) return
    activitiesList.innerHTML = ""
    showSpinner(activitiesList)
    const allActivities = []
    allActivitiesCache = {}
    console.log("Cliente Dashboard: Buscando e exibindo atividades para Propriedade:", propertyId)
    try {
      const plotsQuery = query(
        collection(db, `clients/${clientId}/properties/${propertyId}/plots`),
        where("status", "==", "ativo"),
      )
      const plotsSnapshot = await getDocs(plotsQuery)
      if (plotsSnapshot.empty) {
        console.log("Cliente Dashboard: Nenhuma talhão ativo encontrado para esta propriedade.")
      }
      const plotNamesMap = new Map()
      plotsSnapshot.docs.forEach((docSnap) => plotNamesMap.set(docSnap.id, docSnap.data().name))
      for (const plotDocSnap of plotsSnapshot.docs) {
        const plotName = plotDocSnap.data().name
        const plotId = plotDocSnap.id
        console.log("Cliente Dashboard: Processando talhão:", plotName, plotId)
        const culturesQuery = query(
          collection(db, `clients/${clientId}/properties/${propertyId}/plots/${plotId}/culturas`),
          where("status", "==", "ativo"),
        )
        const culturesSnapshot = await getDocs(culturesQuery)
        if (culturesSnapshot.empty) {
          console.log("Cliente Dashboard: Nenhuma cultura ativa encontrada para o talhão:", plotName)
        }
        for (const cultureDocSnap of culturesSnapshot.docs) {
          const cultureId = cultureDocSnap.id
          const cultureData = cultureDocSnap.data()
          const culturePath = `clients/${clientId}/properties/${propertyId}/plots/${plotId}/culturas/${cultureId}`
          console.log("Cliente Dashboard: Processando cultura para talhão:", cultureData.cropName, cultureId)
          const analysesQuery = query(collection(db, `${culturePath}/analyses`), orderBy("date", "desc"))
          const analysesSnapshot = await getDocs(analysesQuery)
          if (analysesSnapshot.empty) {
            console.log("Cliente Dashboard: Nenhuma análise encontrada para cultura:", cultureId)
          }
          analysesSnapshot.forEach((docSnap) => {
            const analysisData = docSnap.data()
            const responsibleName =
              allUsersCache[analysisData.registeredById] || analysisData.registeredBy || "Desconhecido"
            const activity = {
              id: docSnap.id,
              type: "Análise de Solo",
              status: "Concluída",
              local: plotName,
              date: analysisData.date,
              description: analysisData.agronomistInterpretation || "Análise de solo realizada.",
              imageUrls: [],
              responsible: responsibleName,
              dataSource: "analysis",
              clientId: clientId,
              propertyId: propertyId,
              plotId: plotId,
              cultureId: cultureId,
              cultureName: cultureData.cropName || "Cultura não identificada",
              originalData: analysisData,
            }
            allActivities.push(activity)
            allActivitiesCache[activity.id] = activity
          })
          const managementsQuery = query(collection(db, `${culturePath}/managements`), orderBy("date", "desc"))
          const managementsSnapshot = await getDocs(managementsQuery)
          if (managementsSnapshot.empty) {
            console.log("Cliente Dashboard: Nenhuma manejo encontrado para cultura:", cultureId)
          }
          managementsSnapshot.forEach((docSnap) => {
            const management = docSnap.data()
            const responsibleName =
              allUsersCache[management.registeredById] || management.registeredBy || "Desconhecido"
            const activity = {
              id: docSnap.id,
              type: management.type
                ? management.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                : "Manejo",
              status: management.status || "Concluída",
              local: plotName,
              date: management.date,
              description: management.description || "Detalhes não informados.",
              imageUrls: management.imageUrls || [],
              responsible: responsibleName,
              dataSource: "management",
              clientId: clientId,
              propertyId: propertyId,
              plotId: plotId,
              cultureId: cultureId,
              cultureName: cultureData.cropName || "Cultura não identificada",
              originalData: management,
            }
            allActivities.push(activity)
            allActivitiesCache[activity.id] = activity
          })
        }
      }
      const completedTasksQuery = query(
        collection(db, `clients/${clientId}/tasks`),
        where("isCompleted", "==", true),
        where("propertyId", "==", propertyId),
        orderBy("dueDate", "desc"),
      )
      const completedTasksSnapshot = await getDocs(completedTasksQuery)
      if (completedTasksSnapshot.empty) {
        console.log("Cliente Dashboard: Nenhuma tarefa concluída encontrada para o cliente na propriedade:", propertyId)
      }
      completedTasksSnapshot.forEach((docSnap) => {
        const task = docSnap.data()
        const responsibleName = allUsersCache[task.responsibleAgronomistId] || "Desconhecido"
        const plotNameForTask = task.plotId ? plotNamesMap.get(task.plotId) || "Talhão Desconhecido" : "N/A"
        const activity = {
          id: docSnap.id,
          type: `Tarefa: ${task.title}`,
          status: "Concluída",
          local: plotNameForTask,
          date: task.dueDate,
          description: task.description || "Tarefa concluída.",
          imageUrls: task.imageUrls || [],
          responsible: responsibleName,
          dataSource: "task",
          clientId: clientId,
          propertyId: propertyId,
          plotId: task.plotId,
          cultureId: task.cultureId || null,
          originalTask: task,
        }
        allActivities.push(activity)
        allActivitiesCache[activity.id] = activity
      })
      allActivities.sort((a, b) => new Date(b.date + "T12:00:00") - new Date(a.date + "T12:00:00"))
      filteredActivities = allActivities
      console.log("Cliente Dashboard: Todas as atividades coletadas:", allActivities.length, allActivities)
      hideSpinner(activitiesList)
      displayActivities(filteredActivities)
    } catch (error) {
      console.error("Erro ao carregar e exibir movimentações:", error)
      hideSpinner(activitiesList)
      activitiesList.innerHTML =
        '<p class="text-red-500 text-center py-4">Erro ao carregar movimentações na lavoura.</p>'
    }
  }

  function displayActivities(activities) {
    if (!activitiesList) return

    if (activities.length === 0) {
      activitiesList.innerHTML =
        '<p class="text-gray-500 text-center py-4">Nenhuma movimentação encontrada para o período selecionado.</p>'
      return
    }

    activitiesList.innerHTML = ""
    activities.forEach((activity) => {
      const activityDate = new Date(activity.date + "T12:00:00").toLocaleDateString("pt-BR")
      const photoCount = activity.imageUrls ? activity.imageUrls.length : 0
      const photoHtml =
        photoCount > 0
          ? `<span class="inline-flex items-center text-gray-600 text-sm ml-2"><i class="fas fa-camera mr-1"></i>${photoCount} fotos</span>`
          : ""
      let statusColorClass = "bg-gray-100 text-gray-800"
      if (activity.status === "Concluída") {
        statusColorClass = "bg-green-100 text-green-800"
      } else if (activity.status === "Em Andamento") {
        statusColorClass = "bg-blue-100 text-blue-800"
      } else if (activity.status === "Pendente") {
        statusColorClass = "bg-orange-100 text-orange-800"
      }
      activitiesList.innerHTML += `
                <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div class="flex-grow">
                        <div class="flex items-center mb-2">
                            <h4 class="text-lg font-bold text-gray-800 mr-3">${activity.type}</h4>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColorClass}">${activity.status}</span>
                            ${photoHtml}
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
                            <div><span class="font-semibold">Local:</span> ${activity.local}</div>
                            <div><span class="font-semibold">Data:</span> ${activityDate}</div>
                            <div class="col-span-full"><span class="font-semibold">Responsável:</span> ${activity.responsible}</div>
                        </div>
                        <p class="text-gray-700">${activity.description}</p>
                    </div>
                    <button class="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center view-activity-details-btn"
                            data-activity-id="${activity.id}" 
                            data-data-source="${activity.dataSource}">
                        <i class="fas fa-eye mr-2"></i>Ver Detalhes
                    </button>
                </div>
            `
    })
    document.querySelectorAll(".view-activity-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const { activityId, dataSource } = e.currentTarget.dataset
        const activity = allActivitiesCache[activityId]
        if (activity) {
          openActivityDetailsModal(activity)
        } else {
          showToast("Detalhes da atividade não encontrados.", "error")
        }
      })
    })
  }

  function setupDateFilters() {
    if (dateFrom && dateTo) {
      const applyDateFilter = () => {
        const fromDate = dateFrom.value
        const toDate = dateTo.value

        if (fromDate && toDate) {
          const filtered = Object.values(allActivitiesCache).filter((activity) => {
            const activityDate = activity.date
            return activityDate >= fromDate && activityDate <= toDate
          })
          filtered.sort((a, b) => new Date(b.date + "T12:00:00") - new Date(a.date + "T12:00:00"))
          filteredActivities = filtered
          displayActivities(filtered)
        } else {
          filteredActivities = Object.values(allActivitiesCache)
          displayActivities(filteredActivities)
        }
      }

      dateFrom.addEventListener("change", applyDateFilter)
      dateTo.addEventListener("change", applyDateFilter)
    }
  }

  function setupPdfGeneration() {
    if (generatePdfBtn) {
      generatePdfBtn.addEventListener("click", async () => {
        if (!selectedPropertyId || filteredActivities.length === 0) {
          showToast("Selecione uma propriedade e certifique-se de que há atividades para gerar o relatório.", "warning")
          return
        }
        await generatePdfReport()
      })
    }
  }

  async function generatePdfReport() {
    try {
      // Show progress modal
      openModal(pdfProgressModal)
      updateProgress(10, "Inicializando geração do PDF...")

      const { jsPDF } = window.jspdf
      const doc = new jsPDF()

      // Get current property data
      const currentProperty = allClientProperties.find((p) => p.id === selectedPropertyId)
      const propertyName = currentProperty ? currentProperty.name : "Propriedade não identificada"

      updateProgress(20, "Configurando cabeçalho...")

      // Header
      doc.setFontSize(20)
      doc.setTextColor(34, 139, 34) // Green color
      doc.text("ORGÂNIA FERTILIZANTES", 20, 20)

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Relatório de Atividades da Propriedade", 20, 35)

      doc.setFontSize(12)
      doc.text(`Cliente: ${currentClientData?.name || "N/A"}`, 20, 50)
      doc.text(`Propriedade: ${propertyName}`, 20, 60)
      doc.text(
        `Período: ${dateFrom?.value ? new Date(dateFrom.value).toLocaleDateString("pt-BR") : "N/A"} a ${dateTo?.value ? new Date(dateTo.value).toLocaleDateString("pt-BR") : "N/A"}`,
        20,
        70,
      )
      doc.text(
        `Data de Geração: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        20,
        80,
      )

      updateProgress(30, "Preparando dados das atividades...")

      // Summary statistics
      const totalActivities = filteredActivities.length
      const analysisCount = filteredActivities.filter((a) => a.dataSource === "analysis").length
      const managementCount = filteredActivities.filter((a) => a.dataSource === "management").length
      const taskCount = filteredActivities.filter((a) => a.dataSource === "task").length

      doc.setFontSize(14)
      doc.text("Resumo do Período", 20, 100)
      doc.setFontSize(10)
      doc.text(`Total de Atividades: ${totalActivities}`, 20, 115)
      doc.text(`Análises de Solo: ${analysisCount}`, 20, 125)
      doc.text(`Manejos: ${managementCount}`, 20, 135)
      doc.text(`Tarefas Concluídas: ${taskCount}`, 20, 145)

      updateProgress(40, "Gerando tabela de atividades...")

      // Activities table
      const tableData = filteredActivities.map((activity) => [
        new Date(activity.date + "T12:00:00").toLocaleDateString("pt-BR"),
        activity.type,
        activity.local,
        activity.responsible,
        activity.status,
        activity.description.length > 50 ? activity.description.substring(0, 50) + "..." : activity.description,
      ])

      updateProgress(60, "Formatando tabela...")

      doc.autoTable({
        head: [["Data", "Tipo", "Local", "Responsável", "Status", "Descrição"]],
        body: tableData,
        startY: 160,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [34, 139, 34],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Data
          1: { cellWidth: 35 }, // Tipo
          2: { cellWidth: 30 }, // Local
          3: { cellWidth: 35 }, // Responsável
          4: { cellWidth: 25 }, // Status
          5: { cellWidth: 40 }, // Descrição
        },
      })

      updateProgress(80, "Adicionando detalhes específicos...")

      // Add detailed information for each activity type
      let currentY = doc.lastAutoTable.finalY + 20

      // Analysis details
      if (analysisCount > 0) {
        doc.setFontSize(12)
        doc.text("Detalhes das Análises de Solo", 20, currentY)
        currentY += 10

        const analysisActivities = filteredActivities.filter((a) => a.dataSource === "analysis")
        analysisActivities.forEach((activity, index) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }

          doc.setFontSize(10)
          doc.text(
            `${index + 1}. ${activity.local} - ${new Date(activity.date + "T12:00:00").toLocaleDateString("pt-BR")}`,
            25,
            currentY,
          )
          currentY += 8

          const analysisData = activity.originalData
          if (analysisData.ph) doc.text(`   pH: ${analysisData.ph}`, 30, currentY), (currentY += 6)
          if (analysisData.organicMatter)
            doc.text(`   Matéria Orgânica: ${analysisData.organicMatter}%`, 30, currentY), (currentY += 6)
          if (analysisData.phosphorus)
            doc.text(`   Fósforo: ${analysisData.phosphorus} mg/dm³`, 30, currentY), (currentY += 6)
          if (analysisData.potassium)
            doc.text(`   Potássio: ${analysisData.potassium} cmolc/dm³`, 30, currentY), (currentY += 6)

          currentY += 5
        })
      }

      updateProgress(90, "Finalizando documento...")

      // Management details
      if (managementCount > 0) {
        if (currentY > 200) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(12)
        doc.text("Detalhes dos Manejos", 20, currentY)
        currentY += 10

        const managementActivities = filteredActivities.filter((a) => a.dataSource === "management")
        managementActivities.forEach((activity, index) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }

          doc.setFontSize(10)
          doc.text(
            `${index + 1}. ${activity.type} - ${activity.local} - ${new Date(activity.date + "T12:00:00").toLocaleDateString("pt-BR")}`,
            25,
            currentY,
          )
          currentY += 8

          const managementData = activity.originalData
          if (managementData.products && managementData.products.length > 0) {
            doc.text(
              `   Produtos: ${managementData.products.map((p) => `${p.name} (${p.quantity || "N/A"} ${p.unit || ""})`).join(", ")}`,
              30,
              currentY,
            )
            currentY += 6
          }
          if (managementData.area) doc.text(`   Área: ${managementData.area} ha`, 30, currentY), (currentY += 6)
          if (managementData.equipment)
            doc.text(`   Equipamento: ${managementData.equipment}`, 30, currentY), (currentY += 6)

          currentY += 5
        })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Página ${i} de ${pageCount}`, 20, 285)
        doc.text("Relatório gerado automaticamente pelo sistema Orgânia Fertilizantes", 20, 290)
      }

      updateProgress(100, "Salvando arquivo...")

      // Save the PDF
      const fileName = `relatorio_${propertyName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      setTimeout(() => {
        closeModal(pdfProgressModal)
        showToast("Relatório PDF gerado com sucesso!", "success")
      }, 500)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      closeModal(pdfProgressModal)
      showToast("Erro ao gerar o relatório PDF. Tente novamente.", "error")
    }
  }

  function updateProgress(percentage, message) {
    if (pdfProgress) pdfProgress.style.width = `${percentage}%`
    if (pdfProgressText) pdfProgressText.textContent = message
  }

  async function openActivityDetailsModal(activity) {
    console.log("openActivityDetailsModal: Iniciando preenchimento do modal com o objeto:", activity)

    const activityDetailsModal = document.getElementById("activityDetailsModal")
    const activityModalTitle = document.getElementById("activityModalTitle")
    const activityModalType = document.getElementById("activityModalType")
    const activityModalLocation = document.getElementById("activityModalLocation")
    const activityModalDate = document.getElementById("activityModalDate")
    const activityModalResponsible = document.getElementById("activityModalResponsible")
    const activityModalStatus = document.getElementById("activityModalStatus")
    const activityModalDescription = document.getElementById("activityModalDescription")
    const activityModalPhotos = document.getElementById("activityModalPhotos")
    const activityModalDetails = document.getElementById("activityModalDetails")

    if (!activityDetailsModal) {
      console.error("openActivityDetailsModal: Modal não encontrado. Abortando.")
      showToast("Erro: Modal não encontrado. Recarregue a página.", "error")
      return
    }

    // Limpa o conteúdo antes de preencher
    if (activityModalTitle) activityModalTitle.textContent = ""
    if (activityModalType) activityModalType.textContent = ""
    if (activityModalLocation) activityModalLocation.textContent = ""
    if (activityModalDate) activityModalDate.textContent = ""
    if (activityModalResponsible) activityModalResponsible.textContent = ""
    if (activityModalStatus) activityModalStatus.textContent = ""
    if (activityModalDescription) activityModalDescription.textContent = ""
    if (activityModalPhotos) activityModalPhotos.innerHTML = ""
    if (activityModalDetails) activityModalDetails.innerHTML = ""

    showSpinner(activityDetailsModal)

    try {
      if (!activity) {
        console.warn("openActivityDetailsModal: Objeto de atividade é nulo.")
        if (activityModalTitle) activityModalTitle.textContent = "Atividade Não Encontrada"
        if (activityModalDescription)
          activityModalDescription.textContent = "Detalhes da atividade não puderam ser carregados."
        return
      }

      // Informações básicas
      if (activityModalTitle) activityModalTitle.textContent = activity.type
      if (activityModalType) activityModalType.textContent = activity.type
      if (activityModalLocation) activityModalLocation.textContent = activity.local
      if (activityModalDate)
        activityModalDate.textContent = new Date(activity.date + "T12:00:00").toLocaleDateString("pt-BR")
      if (activityModalResponsible) activityModalResponsible.textContent = activity.responsible

      // Status com cor
      if (activityModalStatus) {
        let statusClass = "bg-gray-100 text-gray-800"
        if (activity.status === "Concluída") {
          statusClass = "bg-green-100 text-green-800"
        } else if (activity.status === "Em Andamento") {
          statusClass = "bg-blue-100 text-blue-800"
        } else if (activity.status === "Pendente") {
          statusClass = "bg-orange-100 text-orange-800"
        }
        activityModalStatus.innerHTML = `<span class="px-3 py-1 text-sm font-semibold rounded-full ${statusClass}">${activity.status}</span>`
      }

      if (activityModalDescription) activityModalDescription.textContent = activity.description

      // Detalhes específicos por tipo de atividade
      let detailsHtml = ""

      if (activity.dataSource === "analysis") {
        const analysisData = activity.originalData
        detailsHtml = `
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-800 mb-3 flex items-center">
                            <i class="fas fa-flask mr-2"></i>Detalhes da Análise de Solo
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span class="font-semibold">Cultura:</span> ${activity.cultureName}</div>
                            <div><span class="font-semibold">Tipo de Análise:</span> ${analysisData.analysisType || "Solo"}</div>
                            ${analysisData.ph ? `<div><span class="font-semibold">pH:</span> ${analysisData.ph}</div>` : ""}
                            ${analysisData.organicMatter ? `<div><span class="font-semibold">Matéria Orgânica:</span> ${analysisData.organicMatter}%</div>` : ""}
                            ${analysisData.phosphorus ? `<div><span class="font-semibold">Fósforo (P):</span> ${analysisData.phosphorus} mg/dm³</div>` : ""}
                            ${analysisData.potassium ? `<div><span class="font-semibold">Potássio (K):</span> ${analysisData.potassium} cmolc/dm³</div>` : ""}
                            ${analysisData.calcium ? `<div><span class="font-semibold">Cálcio (Ca):</span> ${analysisData.calcium} cmolc/dm³</div>` : ""}
                            ${analysisData.magnesium ? `<div><span class="font-semibold">Magnésio (Mg):</span> ${analysisData.magnesium} cmolc/dm³</div>` : ""}
                        </div>
                        ${
                          analysisData.recommendations
                            ? `
                            <div class="mt-4">
                                <span class="font-semibold text-green-700">Recomendações:</span>
                                <p class="text-gray-700 mt-1">${analysisData.recommendations}</p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `
      } else if (activity.dataSource === "management") {
        const managementData = activity.originalData
        detailsHtml = `
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-green-800 mb-3 flex items-center">
                            <i class="fas fa-seedling mr-2"></i>Detalhes do Manejo
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span class="font-semibold">Cultura:</span> ${activity.cultureName}</div>
                            <div><span class="font-semibold">Tipo de Manejo:</span> ${activity.type}</div>
                            ${
                              managementData.products && managementData.products.length > 0
                                ? `
                                <div class="col-span-full">
                                    <span class="font-semibold">Produtos Utilizados:</span>
                                    <ul class="list-disc list-inside mt-1 text-gray-700">
                                        ${managementData.products
                                          .map(
                                            (product) => `
                                            <li>${product.name} - ${product.quantity || "N/A"} ${product.unit || ""}</li>
                                        `,
                                          )
                                          .join("")}
                                    </ul>
                                </div>
                            `
                                : ""
                            }
                            ${managementData.weather ? `<div><span class="font-semibold">Condições Climáticas:</span> ${managementData.weather}</div>` : ""}
                            ${managementData.equipment ? `<div><span class="font-semibold">Equipamento:</span> ${managementData.equipment}</div>` : ""}
                            ${managementData.area ? `<div><span class="font-semibold">Área Tratada:</span> ${managementData.area} ha</div>` : ""}
                        </div>
                        ${
                          managementData.observations
                            ? `
                            <div class="mt-4">
                                <span class="font-semibold text-green-700">Observações:</span>
                                <p class="text-gray-700 mt-1">${managementData.observations}</p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `
      } else if (activity.dataSource === "task") {
        const taskData = activity.originalTask
        const propertyName = allClientProperties.find((p) => p.id === taskData.propertyId)?.name || "N/A"
        detailsHtml = `
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-purple-800 mb-3 flex items-center">
                            <i class="fas fa-tasks mr-2"></i>Detalhes da Tarefa
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span class="font-semibold">Título:</span> ${taskData.title}</div>
                            <div><span class="font-semibold">Tipo:</span> ${taskData.type || "Geral"}</div>
                            <div><span class="font-semibol  ${taskData.type || "Geral"}</div>
                            <div><span class="font-semibold">Propriedade:</span> ${propertyName}</div>
                            <div><span class="font-semibold">Prioridade:</span> ${taskData.priority || "Normal"}</div>
                            <div><span class="font-semibold">Data de Vencimento:</span> ${new Date(taskData.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                            ${taskData.completedDate ? `<div><span class="font-semibold">Data de Conclusão:</span> ${new Date(taskData.completedDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>` : ""}
                        </div>
                        ${
                          taskData.notes
                            ? `
                            <div class="mt-4">
                                <span class="font-semibold text-purple-700">Notas da Conclusão:</span>
                                <p class="text-gray-700 mt-1">${taskData.notes}</p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `
      }

      if (activityModalDetails) {
        activityModalDetails.innerHTML = detailsHtml
      }

      // Fotos
      if (activityModalPhotos) {
        if (activity.imageUrls && activity.imageUrls.length > 0) {
          activityModalPhotos.innerHTML = `
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-camera mr-2"></i>Fotos (${activity.imageUrls.length})
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            ${activity.imageUrls
                              .map(
                                (url) => `
                                <div class="relative group cursor-pointer">
                                    <img src="${url}" alt="Foto da atividade" 
                                         class="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow activity-modal-photo" 
                                         data-full-src="${url}">
                                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                        <i class="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                    </div>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    `

          // Event listeners para as fotos
          activityModalPhotos.querySelectorAll(".activity-modal-photo").forEach((img) => {
            img.addEventListener("click", (e) => openLightbox(e.target.dataset.fullSrc))
          })
        } else {
          activityModalPhotos.innerHTML = `
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-camera mr-2"></i>Fotos
                        </h4>
                        <p class="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                            <i class="fas fa-image text-3xl mb-2 block"></i>
                            Nenhuma foto disponível para esta atividade.
                        </p>
                    `
        }
      }
    } catch (error) {
      console.error("Erro fatal ao carregar detalhes da atividade:", error)
      if (activityModalTitle) activityModalTitle.textContent = "Erro ao Carregar"
      if (activityModalDescription)
        activityModalDescription.innerHTML = `<p class="text-red-500">Erro: ${error.message}</p>`
      if (activityModalPhotos) activityModalPhotos.innerHTML = ""
      showToast("Erro ao carregar detalhes da atividade.", "error")
    } finally {
      hideSpinner(activityDetailsModal)
      openModal(activityDetailsModal)
    }
  }

  // Lógica para Lightbox
  const openLightbox = (src) => {
    const lightboxImage = document.getElementById("lightboxImage")
    const imageLightboxModal = document.getElementById("imageLightboxModal")
    if (lightboxImage) lightboxImage.src = src
    openModal(imageLightboxModal)
  }

  const closeLightbox = () => {
    const imageLightboxModal = document.getElementById("imageLightboxModal")
    const lightboxImage = document.getElementById("lightboxImage")
    closeModal(imageLightboxModal)
    if (lightboxImage) lightboxImage.src = ""
  }

  // Event Listeners Gerais
  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox)
  if (imageLightboxModal)
    imageLightboxModal.addEventListener("click", (e) => {
      if (e.target === imageLightboxModal) {
        closeLightbox()
      }
    })
  if (document.getElementById("closeActivityDetailsModalBtn")) {
    document
      .getElementById("closeActivityDetailsModalBtn")
      .addEventListener("click", () => closeModal(document.getElementById("activityDetailsModal")))
  }

  // Lógica de controle de abas
  function setupTabListeners() {
    tabButtons.forEach((button) => {
      if (!button._hasTabListener) {
        button.addEventListener("click", () => {
          const targetId = button.dataset.tabTarget
          tabContents.forEach((content) => content.classList.add("hidden"))

          tabButtons.forEach((btn) => {
            btn.classList.remove("active-tab", "border-green-600", "text-green-600")
            btn.classList.add("text-gray-500", "border-transparent", "hover:border-gray-300")
          })
          button.classList.add("active-tab", "border-green-600", "text-green-600")
          button.classList.remove("text-gray-500", "border-transparent", "hover:border-gray-300")
          document.getElementById(`${targetId}-content`).classList.remove("hidden")
        })
        button._hasTabListener = true
      }
    })
    if (tabButtons.length > 0) {
      tabButtons[0].click()
    }
  }

  loadClientDashboard()
}
