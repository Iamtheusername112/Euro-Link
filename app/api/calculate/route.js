import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { pickupLocation, dropOff, packageSize, deliveryType } = await request.json()

    // Mock calculation logic - replace with actual calculation
    const baseRates = {
      '1KG': 10,
      '5KG': 25,
      '10KG': 45,
    }

    const deliveryMultipliers = {
      Express: 1.5,
      Normal: 1.0,
    }

    const baseCost = baseRates[packageSize] || 25
    const multiplier = deliveryMultipliers[deliveryType] || 1.0
    const totalCost = baseCost * multiplier

    return NextResponse.json({
      cost: totalCost,
      currency: 'EUR',
      estimatedDays: deliveryType === 'Express' ? 1 : 3,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

