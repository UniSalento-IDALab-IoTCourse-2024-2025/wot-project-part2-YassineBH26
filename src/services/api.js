const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function fetchLiveData() {
  const response = await fetch(`${BASE_URL}/data`);
  if (!response.ok) {
    throw new Error("Failed to fetch live data");
  }
  return response.json();
}

export async function fetchHistory() {
  const response = await fetch(`${BASE_URL}/history-v2`);
  if (!response.ok) {
    throw new Error("Failed to fetch V2 history");
  }
  return response.json();
}

export async function fetchActiveDelivery() {
  const response = await fetch(`${BASE_URL}/active-delivery`);
  if (!response.ok) {
    throw new Error("Failed to fetch active delivery");
  }
  return response.json();
}

export async function toggleMonitoring() {
  const response = await fetch(`${BASE_URL}/toggle-monitoring`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Failed to toggle monitoring");
  }

  return response.json();
}

export async function fetchRequests() {
  const response = await fetch(`${BASE_URL}/requests`);
  if (!response.ok) {
    throw new Error("Failed to fetch requests");
  }
  return response.json();
}

export async function assignRequest(requestId, driverId) {
  const response = await fetch(`${BASE_URL}/assign-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      request_id: requestId,
      driver_id: driverId
    })
  });

  if (!response.ok) {
    throw new Error("Failed to assign request");
  }

  return response.json();
}

export async function fetchDriverDeliveries(driverId) {
  const response = await fetch(`${BASE_URL}/driver-deliveries/${driverId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch driver deliveries");
  }
  return response.json();
}

export async function startDelivery(deliveryId) {
  const response = await fetch(`${BASE_URL}/start-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      delivery_id: deliveryId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to start delivery");
  }

  return data;
}

export async function stopDelivery(deliveryId) {
  const response = await fetch(`${BASE_URL}/stop-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      delivery_id: deliveryId
    })
  });

  if (!response.ok) {
    throw new Error("Failed to stop delivery");
  }

  return response.json();
}

export async function createRequest(requestData) {
  const response = await fetch(`${BASE_URL}/create-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  });

  if (!response.ok) {
    throw new Error("Failed to create delivery request");
  }

  return response.json();
}