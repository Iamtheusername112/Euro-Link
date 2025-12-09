/**
 * Shipment Status Configuration
 * Defines all delivery stages, their order, and metadata
 */

export const SHIPMENT_STATUSES = {
  // Stage 1: Order Processing
  PENDING: {
    value: 'Pending',
    label: 'Pending',
    stage: 1,
    stageName: 'Order Processing',
    description: 'Your shipment has been received and is being prepared for dispatch.',
    icon: '⏳',
    color: 'yellow',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    canTransitionTo: ['Paid', 'Cancelled'],
  },
  
  // Stage 2: Payment Confirmed
  PAID: {
    value: 'Paid',
    label: 'Payment Confirmed',
    stage: 2,
    stageName: 'Payment Confirmed',
    description: 'Your payment has been confirmed. Your shipment will be processed shortly.',
    icon: '✅',
    color: 'green',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    canTransitionTo: ['Processing', 'Cancelled'],
  },
  
  // Stage 3: Processing
  PROCESSING: {
    value: 'Processing',
    label: 'Processing',
    stage: 3,
    stageName: 'Processing',
    description: 'Your shipment is being processed and prepared for pickup.',
    icon: '📦',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    canTransitionTo: ['Picked Up', 'In Transit'],
  },
  
  // Stage 4: Picked Up
  PICKED_UP: {
    value: 'Picked Up',
    label: 'Picked Up',
    stage: 4,
    stageName: 'Picked Up',
    description: 'Your shipment has been picked up and is on its way to our facility.',
    icon: '📥',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    canTransitionTo: ['In Transit'],
  },
  
  // Stage 5: In Transit
  IN_TRANSIT: {
    value: 'In Transit',
    label: 'In Transit',
    stage: 5,
    stageName: 'In Transit',
    description: 'Your shipment is on its way to the destination facility.',
    icon: '🚚',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    canTransitionTo: ['On Route', 'Out for Delivery'],
  },
  
  // Stage 6: On Route
  ON_ROUTE: {
    value: 'On Route',
    label: 'On Route',
    stage: 6,
    stageName: 'On Route',
    description: 'Your shipment is on route to its destination.',
    icon: '🚛',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    canTransitionTo: ['Out for Delivery'],
  },
  
  // Stage 7: Out for Delivery
  OUT_FOR_DELIVERY: {
    value: 'Out for Delivery',
    label: 'Out for Delivery',
    stage: 7,
    stageName: 'Out for Delivery',
    description: 'Your package is out for delivery and will arrive soon!',
    icon: '📦',
    color: 'purple',
    bgColor: 'bg-purple-500/20',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    canTransitionTo: ['Delivered'],
  },
  
  // Stage 8: Delivered
  DELIVERED: {
    value: 'Delivered',
    label: 'Delivered',
    stage: 8,
    stageName: 'Delivered',
    description: 'Your package has been delivered successfully. Thank you for choosing Euro-Link!',
    icon: '🎉',
    color: 'green',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    canTransitionTo: [],
    isFinal: true,
  },
  
  // Special Status: Cancelled
  CANCELLED: {
    value: 'Cancelled',
    label: 'Cancelled',
    stage: 0,
    stageName: 'Cancelled',
    description: 'This shipment has been cancelled.',
    icon: '❌',
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500',
    canTransitionTo: [],
    isFinal: true,
  },
}

/**
 * Get status configuration by value
 */
export const getStatusConfig = (statusValue) => {
  return Object.values(SHIPMENT_STATUSES).find(
    status => status.value === statusValue
  ) || SHIPMENT_STATUSES.PENDING
}

/**
 * Get all statuses in order
 */
export const getStatusesInOrder = () => {
  return Object.values(SHIPMENT_STATUSES)
    .filter(s => s.stage > 0) // Exclude cancelled
    .sort((a, b) => a.stage - b.stage)
}

/**
 * Get next possible statuses for a given status
 */
export const getNextPossibleStatuses = (currentStatus) => {
  const config = getStatusConfig(currentStatus)
  return config.canTransitionTo.map(statusValue => getStatusConfig(statusValue))
}

/**
 * Check if status transition is valid
 */
export const isValidTransition = (fromStatus, toStatus) => {
  const fromConfig = getStatusConfig(fromStatus)
  return fromConfig.canTransitionTo.includes(toStatus)
}

/**
 * Get status progress percentage
 */
export const getStatusProgress = (statusValue) => {
  const config = getStatusConfig(statusValue)
  if (config.isFinal) return 100
  if (config.stage === 0) return 0
  // Calculate progress based on stage (8 total stages)
  return Math.round((config.stage / 8) * 100)
}

/**
 * Get status notification message
 */
export const getStatusNotificationMessage = (statusValue, trackingNumber) => {
  const config = getStatusConfig(statusValue)
  return {
    title: `${config.icon} ${config.label}`,
    message: `Your shipment ${trackingNumber} status has been updated to ${config.label}. ${config.description}`,
  }
}

