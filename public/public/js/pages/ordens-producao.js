// js/pages/ordens-producao.js

import { db } from "../config/firebase.js"
import { showToast } from "../services/ui.js"
import { showSpinner, hideSpinner } from "../services/ui.js"
// Adicionado imports necessários para Firestore V9, incluindo collectionGroup e runTransaction
import {
  collection,
  query,
  where,
  doc,
  collectionGroup,
  runTransaction,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js"

export function initProductionOrders(userId, userRole) {
  // --- Elementos da Página ---
  const ordersListContainer = document.getElementById("orders-list")
  const filterInProgressBtn = document.getElementById("filter-in-progress")
  const filterCompletedBtn = document.getElementById("filter-completed")

  // --- Variáveis de Estado ---
  let currentFilter = "approved" // 'approved' (Em Andamento) ou 'completed' (Concluídas)
  let unsubscribe // Função para parar de ouvir as atualizações do Firestore

  // --- Funções Principais ---

  // Carrega as ordens do Firestore com base no filtro ativo
  function loadOrders() {
    if (ordersListContainer) showSpinner(ordersListContainer)

    // Cancela a inscrição da query anterior para evitar múltiplas execuções
    if (unsubscribe) {
      unsubscribe()
    }

    // CORREÇÃO: Usando collectionGroup() e query() para v9
    const ordersQuery = query(collectionGroup(db, "sales"), where("status", "==", currentFilter))

    // onSnapshot é chamado diretamente na query v9
    unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        if (ordersListContainer) hideSpinner(ordersListContainer)
        if (snapshot.empty) {
          const message =
            currentFilter === "approved"
              ? "Nenhuma ordem de produção em andamento."
              : "Nenhuma ordem concluída encontrada."
          if (ordersListContainer) ordersListContainer.innerHTML = `<p class="text-gray-500 text-center">${message}</p>`
          return
        }

        if (ordersListContainer) ordersListContainer.innerHTML = ""
        const orders = snapshot.docs.map((docSnap) => {
          // Renomeado para docSnap para evitar conflito
          const pathParts = docSnap.ref.path.split("/")
          const clientId = pathParts[pathParts.indexOf("clients") + 1]
          return { id: docSnap.id, clientId, ...docSnap.data() }
        })

        // Ordena por data de aprovação, as mais recentes primeiro
        orders.sort((a, b) => (b.approvedAt?.toDate() || 0) - (a.approvedAt?.toDate() || 0))

        orders.forEach((order) => {
          renderOrderCard(order)
        })
      },
      (error) => {
        console.error("Erro ao carregar ordens de produção:", error)
        if (ordersListContainer) {
          hideSpinner(ordersListContainer)
          ordersListContainer.innerHTML =
            '<p class="text-red-500 text-center">Ocorreu um erro ao carregar as ordens.</p>'
        }
      },
    )
  }

  // Renderiza um card individual para cada ordem
  function renderOrderCard(order) {
    if (!ordersListContainer) return

    const itemsHtml = order.items.map((item) => `<li>${item.tonnage} ton - ${item.formulaName}</li>`).join("")
    const approvedDate = order.approvedAt
      ? order.approvedAt.toDate().toLocaleDateString("pt-BR")
      : "Data não disponível"

    const orderCardHtml = `
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg text-gray-800">${order.clientName}</p>
                        <ul class="list-disc list-inside text-sm text-gray-600">${itemsHtml}</ul>
                        <p class="text-xs text-gray-500 mt-1">Aprovado em: ${approvedDate}</p>
                    </div>
                     <a href="client-details.html?clientId=${order.clientId}&from=admin" class="text-sm text-blue-600 hover:underline whitespace-nowrap">Ver Cliente</a>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${renderChecklist("Ordem de Produção", order.checklists.ordemDeProducao, order.id, order.clientId, "ordemDeProducao")}
                    ${renderChecklist("Venda Realizada", order.checklists.vendaRealizada, order.id, order.clientId, "vendaRealizada")}
                </div>
            </div>
        `
    ordersListContainer.innerHTML += orderCardHtml
  }

  // Renderiza um checklist individual
  function renderChecklist(title, checklistData, saleId, clientId, checklistType) {
    const isCompleted = currentFilter === "completed"
    const checklistItemsConfig = {
      ordemDeProducao: [
        { id: "ordemGerada", label: "Ordem de Produção Gerada" },
        { id: "impressaoEtiqueta", label: "Impressão de Etiqueta" },
        { id: "amostra", label: "Amostra" },
        { id: "contraprova", label: "Contraprova" },
        { id: "ordemCompleta", label: "Ordem Completa" },
      ],
      vendaRealizada: [
        { id: "pedidoPreenchido", label: "Pedido Preenchido" },
        { id: "pedidoAgendado", label: "Pedido Agendado" },
        { id: "emissaoNotaFiscal", label: "Emissão de Nota Fiscal" },
        { id: "pedidoPronto", label: "Pedido pronto" },
      ],
    }

    const itemsHtml = checklistItemsConfig[checklistType]
      .map(
        (item) => `
            <label class="flex items-center space-x-3 ${isCompleted ? "cursor-default" : "cursor-pointer"}">
                <input type="checkbox" class="checklist-item" 
                    data-sale-id="${saleId}" 
                    data-client-id="${clientId}" 
                    data-checklist-type="${checklistType}" 
                    data-item-name="${item.id}"
                    ${checklistData[item.id] ? "checked" : ""}
                    ${isCompleted ? "disabled" : ""}>
                <span class="${checklistData[item.id] ? "line-through text-gray-500" : ""}">${item.label}</span>
            </label>
        `,
      )
      .join("")

    return `<div class="bg-gray-50 p-4 rounded-lg"><h4 class="font-bold text-gray-700">${title}</h4><div class="w-full bg-gray-200 rounded-full h-2.5 my-2"><div class="bg-blue-600 h-2.5 rounded-full" style="width: ${checklistData.progress || 0}%"></div></div><div class="space-y-2 mt-3">${itemsHtml}</div></div>`
  }

  // Lida com a mudança de estado de um checkbox
  async function handleChecklistUpdate(saleId, clientId, checklistType, itemName, isChecked) {
    // CORREÇÃO: Construir a referência do documento usando doc() e collection()
    const saleRef = doc(collection(db, `clients/${clientId}/sales`), saleId)
    try {
      // CORREÇÃO: Usar runTransaction() para v9
      await runTransaction(db, async (transaction) => {
        const saleDoc = await transaction.get(saleRef)
        if (!saleDoc.exists()) {
          throw new Error("Documento de venda não encontrado.")
        }

        const saleData = saleDoc.data()
        const checklists = saleData.checklists || {}
        const checklist = checklists[checklistType] || {}

        checklist[itemName] = isChecked

        // Calcula o progresso do checklist
        const checklistItemsConfig = {
          ordemDeProducao: ["ordemGerada", "impressaoEtiqueta", "amostra", "contraprova", "ordemCompleta"],
          vendaRealizada: ["pedidoPreenchido", "pedidoAgendado", "emissaoNotaFiscal", "pedidoPronto"],
        }
        const totalItems = checklistItemsConfig[checklistType].length
        const completedItems = checklistItemsConfig[checklistType].filter((item) => checklist[item]).length
        checklist.progress = Math.round((completedItems / totalItems) * 100)

        checklists[checklistType] = checklist

        // Verifica se ambos os checklists estão 100% completos
        const ordemProgress = checklists.ordemDeProducao?.progress || 0
        const vendaProgress = checklists.vendaRealizada?.progress || 0
        const newStatus = ordemProgress === 100 && vendaProgress === 100 ? "completed" : "approved"

        transaction.update(saleRef, { checklists, status: newStatus })
      })

      showToast("Checklist atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar checklist:", error)
      showToast("Erro ao atualizar checklist: " + error.message, "error")
    }
  }

  // Configura os event listeners
  function setupEventListeners() {
    // Filtros
    if (filterInProgressBtn) {
      filterInProgressBtn.addEventListener("click", () => {
        currentFilter = "approved"
        updateFilterButtons()
        loadOrders()
      })
    }

    if (filterCompletedBtn) {
      filterCompletedBtn.addEventListener("click", () => {
        currentFilter = "completed"
        updateFilterButtons()
        loadOrders()
      })
    }

    // Delegação de eventos para checkboxes (usando event delegation)
    if (ordersListContainer) {
      ordersListContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("checklist-item")) {
          const { saleId, clientId, checklistType, itemName } = e.target.dataset
          handleChecklistUpdate(saleId, clientId, checklistType, itemName, e.target.checked)
        }
      })
    }
  }

  // Atualiza a aparência dos botões de filtro
  function updateFilterButtons() {
    if (filterInProgressBtn && filterCompletedBtn) {
      filterInProgressBtn.classList.toggle("filter-active", currentFilter === "approved")
      filterCompletedBtn.classList.toggle("filter-active", currentFilter === "completed")
    }
  }

  // --- Inicialização ---
  setupEventListeners()
  updateFilterButtons()
  loadOrders()

  // Cleanup quando a página é fechada ou o módulo é descarregado
  window.addEventListener("beforeunload", () => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
}
