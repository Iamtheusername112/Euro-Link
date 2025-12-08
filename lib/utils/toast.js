// Temporary toast implementation until sonner is installed
// This mimics sonner's API so the code works without the package

let toastContainer = null

function createToastContainer() {
  if (typeof document === 'undefined') return null
  
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

function showToast(message, type = 'info') {
  if (typeof window === 'undefined') {
    console.log(`[${type.toUpperCase()}] ${message}`)
    return
  }

  const container = createToastContainer()
  if (!container) return

  const toast = document.createElement('div')
  const colors = {
    success: { bg: '#10b981', text: '#fff' },
    error: { bg: '#ef4444', text: '#fff' },
    info: { bg: '#3b82f6', text: '#fff' },
    warning: { bg: '#f59e0b', text: '#fff' },
  }
  const color = colors[type] || colors.info

  toast.style.cssText = `
    background: ${color.bg};
    color: ${color.text};
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
  `

  toast.textContent = message
  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `
  if (!document.head.querySelector('#toast-styles')) {
    style.id = 'toast-styles'
    document.head.appendChild(style)
  }
}

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
  warning: (message) => showToast(message, 'warning'),
}

