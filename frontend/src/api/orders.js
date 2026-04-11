const API_BASE = 'http://localhost:8000'

export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  if (!response.ok) throw new Error('Failed to create order')
  return response.json()
}

export async function getOrdersByUserId(userId) {
  const response = await fetch(`${API_BASE}/orders/user/${userId}`)
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}