// js/services/ui.js

export function showSpinner(element) {
  if (!element) return

  const spinner = document.createElement("div")
  spinner.className = "flex justify-center items-center py-8"
  spinner.innerHTML = `
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
  `
  spinner.id = "loading-spinner"

  // Clear existing content and add spinner
  element.innerHTML = ""
  element.appendChild(spinner)
}

export function hideSpinner(element) {
  if (!element) return

  const spinner = element.querySelector("#loading-spinner")
  if (spinner) {
    spinner.remove()
  }
}

export function showToast(message, type = "info", duration = 5000) {
  const toastContainer = document.getElementById("toastContainer") || createToastContainer()

  const toast = document.createElement("div")
  toast.className = `max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 translate-x-full`

  let bgColor = "bg-blue-500"
  let icon = "fas fa-info-circle"

  switch (type) {
    case "success":
      bgColor = "bg-green-500"
      icon = "fas fa-check-circle"
      break
    case "error":
      bgColor = "bg-red-500"
      icon = "fas fa-exclamation-circle"
      break
    case "warning":
      bgColor = "bg-yellow-500"
      icon = "fas fa-exclamation-triangle"
      break
  }

  toast.innerHTML = `
    <div class="flex-1 w-0 p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="${icon} text-${type === "warning" ? "yellow" : type === "error" ? "red" : type === "success" ? "green" : "blue"}-600 text-xl"></i>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900">${message}</p>
        </div>
      </div>
    </div>
    <div class="flex border-l border-gray-200">
      <button class="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `

  toastContainer.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-x-full")
  }, 100)

  // Auto remove
  setTimeout(() => {
    toast.classList.add("translate-x-full")
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove()
      }
    }, 300)
  }, duration)
}

function createToastContainer() {
  const container = document.createElement("div")
  container.id = "toastContainer"
  container.className = "fixed top-4 right-4 z-50 space-y-2"
  document.body.appendChild(container)
  return container
}

export function openModal(modal) {
  if (!modal) return

  modal.classList.remove("hidden")
  document.body.style.overflow = "hidden"

  // Focus trap
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (focusableElements.length > 0) {
    focusableElements[0].focus()
  }
}

export function closeModal(modal) {
  if (!modal) return

  modal.classList.add("hidden")
  document.body.style.overflow = "auto"
}

// Utility function to format dates
export function formatDate(dateString) {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString + "T12:00:00")
    return date.toLocaleDateString("pt-BR")
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Data inválida"
  }
}

// Utility function to format currency
export function formatCurrency(value) {
  if (value === null || value === undefined) return "R$ 0,00"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Utility function to truncate text
export function truncateText(text, maxLength = 100) {
  if (!text) return ""

  if (text.length <= maxLength) return text

  return text.substring(0, maxLength) + "..."
}

// Utility function to validate email
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Utility function to validate phone
export function validatePhone(phone) {
  const phoneRegex = /^$$\d{2}$$\s\d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

// Utility function to format phone number
export function formatPhone(phone) {
  if (!phone) return ""

  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
  }

  return phone
}

// Utility function to debounce function calls
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Utility function to throttle function calls
export function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
