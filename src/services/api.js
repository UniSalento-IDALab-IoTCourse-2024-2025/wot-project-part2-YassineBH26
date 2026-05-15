const BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

/* =========================
   REPORTS
========================= */

export async function fetchDeliveryReport(deliveryId) {
  return request(`/delivery-report/${deliveryId}`);
}

/* =========================
   AUTH
========================= */

export async function login(username, password) {
  return request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function signup(userData) {
  return request("/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
}

export async function logout() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function checkUsername(username) {
  return request("/auth/check-username", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
}

/* =========================
   MONITORING
========================= */

export async function fetchLiveData() {
  return request("/data");
}

export async function fetchHistory() {
  return request("/history-v2");
}

export async function fetchActiveDelivery() {
  return request("/active-delivery");
}

export async function toggleMonitoring() {
  return request("/toggle-monitoring", {
    method: "POST",
  });
}

export async function startMonitoring() {
  return request("/start-monitoring", {
    method: "POST",
  });
}

export async function stopMonitoring() {
  return request("/stop-monitoring", {
    method: "POST",
  });
}

/* =========================
   ADMIN
========================= */

export async function fetchRequests() {
  return request("/requests");
}

export async function fetchDrivers() {
  return request("/drivers");
}

export async function assignRequest(requestId, driverId) {
  return request("/assign-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request_id: requestId,
      driver_id: driverId,
    }),
  });
}

export async function fetchAdminUsers() {
  return request("/admin/users");
}

export async function createAccount(accountData) {
  return request("/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(accountData),
  });
}

export async function geocodeAddress(address) {
  return request("/admin/geocode-address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });
}

/* =========================
   DRIVER
========================= */

export async function fetchDriverDeliveries() {
  return request("/driver-deliveries");
}

export async function startDelivery(deliveryId) {
  return request("/start-delivery", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      delivery_id: deliveryId,
    }),
  });
}

export async function stopDelivery(deliveryId) {
  return request("/stop-delivery", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      delivery_id: deliveryId,
    }),
  });
}

/* =========================
   SCHOOL
========================= */

export async function createRequest(requestData) {
  return request("/create-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });
}

export async function fetchSchoolRequests() {
  return request("/school-requests");
}