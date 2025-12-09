'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Package, User, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle, Plus, Trash2, Edit2 } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateShipmentPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Sender info
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    pickupAddress: '',
    pickupCity: '',
    pickupPostalCode: '',
    pickupCountry: '',
    
    // Recipient info
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryCountry: '',
    
    // Package info
    packageSize: '5KG',
    packageWeight: '',
    packageDescription: '',
    packageValue: '',
    deliveryType: 'Normal',
    
    // Special instructions
    specialInstructions: '',
  })

  const [errors, setErrors] = useState({})
  const [estimatedCost, setEstimatedCost] = useState(null)
  const [shipments, setShipments] = useState([]) // Array to store multiple shipments
  const [editingIndex, setEditingIndex] = useState(null) // Index of shipment being edited

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to create a shipment')
      router.push('/auth/login?redirect=/create-shipment')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !formData.senderEmail) {
      // Pre-fill sender info from user profile
      setFormData(prev => ({
        ...prev,
        senderEmail: user.email || '',
        senderName: user.user_metadata?.full_name || '',
      }))
    }
  }, [user])

  const validateStep = (stepNumber) => {
    const newErrors = {}
    
    if (stepNumber === 1) {
      if (!formData.senderName.trim()) newErrors.senderName = 'Name is required'
      if (!formData.senderPhone.trim()) newErrors.senderPhone = 'Phone is required'
      if (!formData.senderEmail.trim()) newErrors.senderEmail = 'Email is required'
      if (!formData.pickupAddress.trim()) newErrors.pickupAddress = 'Address is required'
      if (!formData.pickupCity.trim()) newErrors.pickupCity = 'City is required'
      if (!formData.pickupPostalCode.trim()) newErrors.pickupPostalCode = 'Postal code is required'
    } else if (stepNumber === 2) {
      if (!formData.recipientName.trim()) newErrors.recipientName = 'Name is required'
      if (!formData.recipientPhone.trim()) newErrors.recipientPhone = 'Phone is required'
      if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = 'Address is required'
      if (!formData.deliveryCity.trim()) newErrors.deliveryCity = 'City is required'
      if (!formData.deliveryPostalCode.trim()) newErrors.deliveryPostalCode = 'Postal code is required'
    } else if (stepNumber === 3) {
      if (!formData.packageWeight) newErrors.packageWeight = 'Weight is required'
      if (!formData.packageDescription.trim()) newErrors.packageDescription = 'Description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateCost = async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) return
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation: `${formData.pickupAddress}, ${formData.pickupCity}`,
          dropOff: `${formData.deliveryAddress}, ${formData.deliveryCity}`,
          packageSize: formData.packageSize,
          deliveryType: formData.deliveryType,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setEstimatedCost(data.cost)
      }
    } catch (error) {
      console.error('Error calculating cost:', error)
    }
  }

  useEffect(() => {
    if (step === 3 && formData.pickupAddress && formData.deliveryAddress) {
      calculateCost()
    }
  }, [step, formData.pickupAddress, formData.deliveryAddress, formData.packageSize, formData.deliveryType])

  const generateTrackingNumber = () => {
    const prefix = 'EU'
    const timestamp = Date.now().toString().slice(-10)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}${random}`
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const addShipmentToList = async () => {
    if (!validateStep(3)) return
    
    try {
      // Validate required fields
      if (!formData.pickupAddress || !formData.deliveryAddress) {
        toast.error('Please fill in pickup and delivery addresses')
        return
      }

      // Calculate cost for this shipment
      let cost = estimatedCost || 0
      
      try {
        const costResponse = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupLocation: `${formData.pickupAddress}, ${formData.pickupCity}`,
            dropOff: `${formData.deliveryAddress}, ${formData.deliveryCity}`,
            packageSize: formData.packageSize,
            deliveryType: formData.deliveryType,
          }),
        })
        
        if (!costResponse.ok) {
          throw new Error(`Cost calculation failed: ${costResponse.statusText}`)
        }
        
        const costData = await costResponse.json()
        
        if (!costData || typeof costData.cost !== 'number') {
          throw new Error('Invalid cost data received')
        }
        
        cost = costData.cost
      } catch (costError) {
        console.error('Error calculating cost:', costError)
        if (cost === 0) {
          toast.error('Failed to calculate cost. Please try again.')
          return
        }
        // Use estimated cost if available, otherwise show warning
        toast.warning('Using estimated cost. Cost calculation failed.')
      }

      const shipmentData = {
        id: editingIndex !== null ? shipments[editingIndex].id : Date.now(),
        senderName: formData.senderName || '',
        senderPhone: formData.senderPhone || '',
        senderEmail: formData.senderEmail || '',
        pickupAddress: formData.pickupAddress || '',
        pickupCity: formData.pickupCity || '',
        pickupPostalCode: formData.pickupPostalCode || '',
        recipientName: formData.recipientName || '',
        recipientPhone: formData.recipientPhone || '',
        recipientEmail: formData.recipientEmail || '',
        deliveryAddress: formData.deliveryAddress || '',
        deliveryCity: formData.deliveryCity || '',
        deliveryPostalCode: formData.deliveryPostalCode || '',
        packageSize: formData.packageSize || '5KG',
        packageWeight: formData.packageWeight || '',
        packageDescription: formData.packageDescription || '',
        packageValue: formData.packageValue || '0',
        deliveryType: formData.deliveryType || 'Normal',
        specialInstructions: formData.specialInstructions || '',
        cost: cost,
      }

      if (editingIndex !== null) {
        // Update existing shipment
        const updatedShipments = [...shipments]
        updatedShipments[editingIndex] = shipmentData
        setShipments(updatedShipments)
        setEditingIndex(null)
        toast.success('Shipment updated!')
      } else {
        // Add new shipment
        setShipments([...shipments, shipmentData])
        toast.success('Shipment added to list!')
      }

      // Reset form
      resetForm()
      setStep(4) // Go to review step
    } catch (error) {
      console.error('Error adding shipment to list:', error)
      toast.error(error.message || 'Failed to add shipment to list')
    }
  }

  const resetForm = () => {
    setFormData({
      senderName: formData.senderName, // Keep sender info
      senderPhone: formData.senderPhone,
      senderEmail: formData.senderEmail,
      pickupAddress: formData.pickupAddress, // Keep pickup address
      pickupCity: formData.pickupCity,
      pickupPostalCode: formData.pickupPostalCode,
      pickupCountry: '',
      recipientName: '',
      recipientPhone: '',
      recipientEmail: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryPostalCode: '',
      deliveryCountry: '',
      packageSize: '5KG',
      packageWeight: '',
      packageDescription: '',
      packageValue: '',
      deliveryType: 'Normal',
      specialInstructions: '',
    })
    setEstimatedCost(null)
    setErrors({})
  }

  const editShipment = (index) => {
    const shipment = shipments[index]
    setFormData({
      senderName: shipment.senderName,
      senderPhone: shipment.senderPhone,
      senderEmail: shipment.senderEmail,
      pickupAddress: shipment.pickupAddress,
      pickupCity: shipment.pickupCity,
      pickupPostalCode: shipment.pickupPostalCode,
      pickupCountry: '',
      recipientName: shipment.recipientName,
      recipientPhone: shipment.recipientPhone,
      recipientEmail: shipment.recipientEmail,
      deliveryAddress: shipment.deliveryAddress,
      deliveryCity: shipment.deliveryCity,
      deliveryPostalCode: shipment.deliveryPostalCode,
      deliveryCountry: '',
      packageSize: shipment.packageSize,
      packageWeight: shipment.packageWeight,
      packageDescription: shipment.packageDescription,
      packageValue: shipment.packageValue,
      deliveryType: shipment.deliveryType,
      specialInstructions: shipment.specialInstructions,
    })
    setEditingIndex(index)
    setStep(1) // Go back to step 1
  }

  const removeShipment = (index) => {
    const updatedShipments = shipments.filter((_, i) => i !== index)
    setShipments(updatedShipments)
    toast.success('Shipment removed')
    if (updatedShipments.length === 0) {
      setStep(1) // Go back to step 1 if no shipments left
    }
  }

  const handleSubmitAll = async () => {
    if (shipments.length === 0) {
      toast.error('Please add at least one shipment')
      return
    }

    if (!user) {
      toast.error('Please login to create shipments')
      router.push('/auth/login?redirect=/create-shipment')
      return
    }

    if (!supabase) {
      toast.error('Database not configured. Please check your .env.local file.')
      return
    }

    setLoading(true)
    try {
      const createdShipments = []
      const errors = []
      
      // Create all shipments
      for (let i = 0; i < shipments.length; i++) {
        const shipment = shipments[i]
        
        try {
          // Validate shipment data
          if (!shipment.pickupAddress || !shipment.deliveryAddress) {
            throw new Error(`Shipment #${i + 1}: Missing pickup or delivery address`)
          }
          
          if (!shipment.cost || isNaN(shipment.cost)) {
            console.warn(`Shipment #${i + 1}: Invalid cost, recalculating...`)
            // Recalculate cost if missing
            try {
              const costResponse = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  pickupLocation: `${shipment.pickupAddress}, ${shipment.pickupCity}`,
                  dropOff: `${shipment.deliveryAddress}, ${shipment.deliveryCity}`,
                  packageSize: shipment.packageSize,
                  deliveryType: shipment.deliveryType,
                }),
              })
              const costData = await costResponse.json()
              if (costResponse.ok && costData.cost) {
                shipment.cost = costData.cost
              } else {
                throw new Error(`Shipment #${i + 1}: Failed to calculate cost`)
              }
            } catch (costError) {
              throw new Error(`Shipment #${i + 1}: Failed to calculate cost - ${costError.message}`)
            }
          }

          const trackingNumber = generateTrackingNumber()
          console.log(`Creating shipment #${i + 1} with tracking: ${trackingNumber}`)

          const { data, error } = await supabase
            .from('shipments')
            .insert({
              tracking_number: trackingNumber,
              user_id: user.id,
              status: 'Pending',
              pickup_location: `${shipment.pickupAddress}, ${shipment.pickupCity} ${shipment.pickupPostalCode || ''}`.trim(),
              drop_off_location: `${shipment.deliveryAddress}, ${shipment.deliveryCity} ${shipment.deliveryPostalCode || ''}`.trim(),
              package_size: shipment.packageSize || '5KG',
              delivery_type: shipment.deliveryType || 'Normal',
              cost: parseFloat(shipment.cost) || 0,
              sender_info: {
                name: shipment.senderName || '',
                phone: shipment.senderPhone || '',
                email: shipment.senderEmail || '',
                address: `${shipment.pickupAddress}, ${shipment.pickupCity} ${shipment.pickupPostalCode || ''}`.trim(),
              },
              recipient_info: {
                name: shipment.recipientName || '',
                phone: shipment.recipientPhone || '',
                email: shipment.recipientEmail || '',
                address: `${shipment.deliveryAddress}, ${shipment.deliveryCity} ${shipment.deliveryPostalCode || ''}`.trim(),
              },
              package_info: {
                weight: shipment.packageWeight || '',
                description: shipment.packageDescription || '',
                value: shipment.packageValue || '0',
                size: shipment.packageSize || '5KG',
              },
              special_instructions: shipment.specialInstructions || null,
            })
            .select()
            .single()

          if (error) {
            console.error(`Error creating shipment #${i + 1}:`, error)
            throw new Error(`Shipment #${i + 1}: ${error.message || 'Database error'}`)
          }

          if (!data || !data.id) {
            throw new Error(`Shipment #${i + 1}: No data returned from database`)
          }

          console.log(`✅ Shipment #${i + 1} created successfully:`, data.id)

          // Create initial status history
          const { error: historyError } = await supabase
            .from('shipment_status_history')
            .insert({
              shipment_id: data.id,
              status: 'Pending',
              location: shipment.pickupAddress || 'Shipment created',
              notes: 'Shipment created',
            })

          if (historyError) {
            console.warn(`Warning: Failed to create status history for shipment #${i + 1}:`, historyError)
            // Don't fail the whole operation if status history fails
          }

          createdShipments.push(data)
        } catch (shipmentError) {
          console.error(`Failed to create shipment #${i + 1}:`, shipmentError)
          errors.push(`Shipment #${i + 1}: ${shipmentError.message}`)
          // Continue with next shipment instead of stopping
        }
      }

      if (createdShipments.length === 0) {
        throw new Error(`Failed to create any shipments. Errors: ${errors.join('; ')}`)
      }

      if (errors.length > 0) {
        toast.warning(`Created ${createdShipments.length} of ${shipments.length} shipments. Some failed: ${errors.join('; ')}`)
      } else {
        toast.success(`Successfully created ${createdShipments.length} shipment(s)!`)
      }

      const shipmentIds = createdShipments.map(s => s.id).join(',')
      
      // Redirect to checkout with successfully created shipment IDs
      router.push(`/checkout?ids=${shipmentIds}`)
    } catch (error) {
      console.error('Error creating shipments:', error)
      toast.error(error.message || 'Failed to create shipments. Please check console for details.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Create Shipment" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const steps = [
    { number: 1, title: 'Sender Info', icon: User },
    { number: 2, title: 'Recipient Info', icon: Package },
    { number: 3, title: 'Package Details', icon: Package },
    { number: 4, title: 'Review', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Create Shipment" showBack={true} />
      
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              
              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition
                      ${isActive ? 'bg-red-500 text-white' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${step > s.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Sender Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User size={24} className="text-red-500" />
              Sender Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.senderName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your full name"
              />
              {errors.senderName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.senderName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.senderPhone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {errors.senderPhone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.senderPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.senderEmail ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.senderEmail && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.senderEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Pickup Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.pickupAddress ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Street address"
              />
              {errors.pickupAddress && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.pickupAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pickupCity}
                  onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.pickupCity ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.pickupCity && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.pickupCity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pickupPostalCode}
                  onChange={(e) => setFormData({ ...formData, pickupPostalCode: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.pickupPostalCode ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="12345"
                />
                {errors.pickupPostalCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.pickupPostalCode}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              Continue to Recipient Info
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Recipient Info */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package size={24} className="text-red-500" />
              Recipient Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.recipientName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Recipient's full name"
              />
              {errors.recipientName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.recipientName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.recipientPhone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {errors.recipientPhone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.recipientPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="recipient@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.deliveryAddress ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Street address"
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.deliveryAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryCity}
                  onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.deliveryCity ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.deliveryCity && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.deliveryCity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryPostalCode}
                  onChange={(e) => setFormData({ ...formData, deliveryPostalCode: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.deliveryPostalCode ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="12345"
                />
                {errors.deliveryPostalCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.deliveryPostalCode}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                Continue to Package Details
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Package Details */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package size={24} className="text-red-500" />
              Package Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Size
              </label>
              <div className="flex gap-3">
                {['1KG', '5KG', '10KG', '20KG'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFormData({ ...formData, packageSize: size })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                      formData.packageSize === size
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.packageWeight}
                onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.packageWeight ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="e.g., 2.5"
              />
              {errors.packageWeight && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.packageWeight}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.packageDescription}
                onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.packageDescription ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="What's inside the package?"
              />
              {errors.packageDescription && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.packageDescription}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Declared Value (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.packageValue}
                onChange={(e) => setFormData({ ...formData, packageValue: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'Normal' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    formData.deliveryType === 'Normal'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Normal (3-5 days)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'Express' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    formData.deliveryType === 'Express'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Express (1-2 days)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Any special delivery instructions?"
              />
            </div>

            {estimatedCost && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Estimated Cost:</span>
                  <span className="text-2xl font-bold text-blue-600">€{estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={addShipmentToList}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {editingIndex !== null ? 'Update Shipment' : 'Add to List'}
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review All Shipments */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Package size={24} className="text-red-500" />
                Review Shipments ({shipments.length})
              </h3>
              <button
                onClick={() => {
                  resetForm()
                  setStep(1)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
              >
                <Plus size={18} />
                Add Another
              </button>
            </div>

            {shipments.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No shipments added yet</p>
                <button
                  onClick={() => {
                    resetForm()
                    setStep(1)
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                >
                  Create First Shipment
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {shipments.map((shipment, index) => (
                    <div key={shipment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">Shipment #{index + 1}</p>
                          <p className="text-sm text-gray-500">
                            {shipment.recipientName} → {shipment.deliveryCity}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editShipment(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => removeShipment(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">From:</p>
                          <p className="font-medium">{shipment.pickupCity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">To:</p>
                          <p className="font-medium">{shipment.deliveryCity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Package:</p>
                          <p className="font-medium">{shipment.packageSize} - {shipment.packageWeight}kg</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivery:</p>
                          <p className="font-medium">{shipment.deliveryType}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cost:</span>
                        <span className="text-lg font-bold text-red-600">€{shipment.cost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Total Cost:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €{shipments.reduce((sum, s) => sum + s.cost, 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {shipments.length} shipment{shipments.length > 1 ? 's' : ''} ready to create
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetForm()
                      setStep(1)
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add Another Shipment
                  </button>
                  <button
                    onClick={handleSubmitAll}
                    disabled={loading}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating...' : `Create All (${shipments.length})`}
                    {!loading && <ChevronRight size={20} />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
