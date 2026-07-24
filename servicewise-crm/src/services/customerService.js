const CUSTOMER_STORAGE_KEY = "servicewise_customers";

function cleanValue(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return cleanValue(value).toLowerCase();
}

function normalizePhone(value) {
  return cleanValue(value).replace(/\D/g, "");
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `customer-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function safelyParse(value, fallback = []) {
  try {
    const parsedValue = JSON.parse(value);

    return Array.isArray(parsedValue)
      ? parsedValue
      : fallback;
  } catch {
    return fallback;
  }
}

function generateCustomerNumber(customers = []) {
  const year = new Date().getFullYear();

  const highestNumber = customers.reduce(
    (highest, customer) => {
      const customerNumber = cleanValue(
        customer.customerNumber,
      );

      const match = customerNumber.match(
        /^CUS-\d{4}-(\d+)$/,
      );

      if (!match) {
        return highest;
      }

      return Math.max(
        highest,
        Number(match[1]),
      );
    },
    0,
  );

  return `CUS-${year}-${String(
    highestNumber + 1,
  ).padStart(4, "0")}`;
}

function getStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage
  ) {
    return null;
  }

  return window.localStorage;
}

export function getCustomers() {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const storedCustomers = storage.getItem(
    CUSTOMER_STORAGE_KEY,
  );

  if (!storedCustomers) {
    return [];
  }

  return safelyParse(storedCustomers, []);
}

export function saveCustomers(customers) {
  const storage = getStorage();

  const safeCustomers = Array.isArray(customers)
    ? customers
    : [];

  if (storage) {
    storage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify(safeCustomers),
    );
  }

  return safeCustomers;
}

export function getCustomerById(customerId) {
  return (
    getCustomers().find(
      (customer) =>
        String(customer.id) ===
        String(customerId),
    ) || null
  );
}

export function findExistingCustomer({
  email = "",
  phone = "",
  customerNumber = "",
  walletId = "",
  retailerId = "",
} = {}) {
  const normalizedEmail =
    normalizeEmail(email);

  const normalizedPhone =
    normalizePhone(phone);

  const normalizedCustomerNumber =
    cleanValue(customerNumber).toLowerCase();

  const normalizedWalletId =
    cleanValue(walletId).toLowerCase();

  const normalizedRetailerId =
    cleanValue(retailerId).toLowerCase();

  return (
    getCustomers().find((customer) => {
      const customerEmail =
        normalizeEmail(customer.email);

      const customerPhone =
        normalizePhone(customer.phone);

      const customerNumberValue =
        cleanValue(
          customer.customerNumber,
        ).toLowerCase();

      const walletIdValue =
        cleanValue(
          customer.walletId,
        ).toLowerCase();

      const retailerIdValue =
        cleanValue(
          customer.retailerId,
        ).toLowerCase();

      return (
        (normalizedEmail &&
          customerEmail === normalizedEmail) ||
        (normalizedPhone &&
          customerPhone === normalizedPhone) ||
        (normalizedCustomerNumber &&
          customerNumberValue ===
            normalizedCustomerNumber) ||
        (normalizedWalletId &&
          walletIdValue === normalizedWalletId) ||
        (normalizedRetailerId &&
          retailerIdValue ===
            normalizedRetailerId)
      );
    }) || null
  );
}

export function createCustomer(customerData = {}) {
  const customers = getCustomers();

  const existingCustomer =
    findExistingCustomer(customerData);

  if (existingCustomer) {
    throw new Error(
      "A customer with the same email, phone, customer ID, wallet ID or retailer ID already exists.",
    );
  }

  const now = new Date().toISOString();

  const newCustomer = {
    id: createId(),

    customerNumber:
      generateCustomerNumber(customers),

    name:
      cleanValue(customerData.name) ||
      "Unknown Customer",

    email: normalizeEmail(
      customerData.email,
    ),

    phone: cleanValue(
      customerData.phone,
    ),

    cnic: cleanValue(
      customerData.cnic,
    ),

    walletId: cleanValue(
      customerData.walletId,
    ),

    retailerId: cleanValue(
      customerData.retailerId,
    ),

    city: cleanValue(
      customerData.city,
    ),

    address: cleanValue(
      customerData.address,
    ),

    accountStatus:
      cleanValue(
        customerData.accountStatus,
      ) || "Active",

    riskLevel:
      cleanValue(
        customerData.riskLevel,
      ) || "Normal",

    preferredChannel:
      cleanValue(
        customerData.preferredChannel,
      ) || "Phone",

    notes: cleanValue(
      customerData.notes,
    ),

    createdAt: now,
    updatedAt: now,
  };

  saveCustomers([
    newCustomer,
    ...customers,
  ]);

  return newCustomer;
}

export function updateCustomer(
  customerId,
  updates = {},
) {
  const customers = getCustomers();

  const customerIndex =
    customers.findIndex(
      (customer) =>
        String(customer.id) ===
        String(customerId),
    );

  if (customerIndex === -1) {
    throw new Error(
      "Customer record was not found.",
    );
  }

  const currentCustomer =
    customers[customerIndex];

  const updatedCustomer = {
    ...currentCustomer,
    ...updates,

    id: currentCustomer.id,

    customerNumber:
      currentCustomer.customerNumber,

    name:
      cleanValue(
        updates.name ??
          currentCustomer.name,
      ) || "Unknown Customer",

    email: normalizeEmail(
      updates.email ??
        currentCustomer.email,
    ),

    phone: cleanValue(
      updates.phone ??
        currentCustomer.phone,
    ),

    cnic: cleanValue(
      updates.cnic ??
        currentCustomer.cnic,
    ),

    walletId: cleanValue(
      updates.walletId ??
        currentCustomer.walletId,
    ),

    retailerId: cleanValue(
      updates.retailerId ??
        currentCustomer.retailerId,
    ),

    city: cleanValue(
      updates.city ??
        currentCustomer.city,
    ),

    address: cleanValue(
      updates.address ??
        currentCustomer.address,
    ),

    accountStatus:
      cleanValue(
        updates.accountStatus ??
          currentCustomer.accountStatus,
      ) || "Active",

    riskLevel:
      cleanValue(
        updates.riskLevel ??
          currentCustomer.riskLevel,
      ) || "Normal",

    preferredChannel:
      cleanValue(
        updates.preferredChannel ??
          currentCustomer.preferredChannel,
      ) || "Phone",

    notes: cleanValue(
      updates.notes ??
        currentCustomer.notes,
    ),

    updatedAt: new Date().toISOString(),
  };

  customers[customerIndex] =
    updatedCustomer;

  saveCustomers(customers);

  return updatedCustomer;
}

export function deleteCustomer(customerId) {
  const customers = getCustomers();

  const remainingCustomers =
    customers.filter(
      (customer) =>
        String(customer.id) !==
        String(customerId),
    );

  saveCustomers(remainingCustomers);

  return remainingCustomers;
}

function getTicketCustomerData(ticket = {}) {
  const customer =
    ticket.customer || {};

  return {
    name:
      cleanValue(customer.name) ||
      cleanValue(ticket.customerName) ||
      cleanValue(ticket.customer_name) ||
      "Unknown Customer",

    email:
      cleanValue(customer.email) ||
      cleanValue(ticket.customerEmail) ||
      cleanValue(ticket.customer_email),

    phone:
      cleanValue(customer.phone) ||
      cleanValue(ticket.customerPhone) ||
      cleanValue(ticket.customer_phone),

    cnic:
      cleanValue(customer.cnic) ||
      cleanValue(ticket.customerCnic) ||
      cleanValue(ticket.customer_cnic),

    walletId:
      cleanValue(customer.walletId) ||
      cleanValue(customer.wallet_id) ||
      cleanValue(ticket.walletId) ||
      cleanValue(ticket.wallet_id),

    retailerId:
      cleanValue(customer.retailerId) ||
      cleanValue(customer.retailer_id) ||
      cleanValue(ticket.retailerId) ||
      cleanValue(ticket.retailer_id),

    city:
      cleanValue(customer.city) ||
      cleanValue(ticket.customerCity) ||
      cleanValue(ticket.customer_city),

    accountStatus:
      cleanValue(
        customer.accountStatus,
      ) ||
      cleanValue(
        customer.account_status,
      ) ||
      "Active",

    riskLevel:
      cleanValue(customer.riskLevel) ||
      cleanValue(customer.risk_level) ||
      "Normal",
  };
}

export function syncCustomersFromTickets(
  tickets = [],
) {
  const customerList = [
    ...getCustomers(),
  ];

  tickets.forEach((ticket) => {
    const ticketCustomer =
      getTicketCustomerData(ticket);

    const matchingIndex =
      customerList.findIndex(
        (customer) => {
          const sameEmail =
            normalizeEmail(
              ticketCustomer.email,
            ) &&
            normalizeEmail(
              customer.email,
            ) ===
              normalizeEmail(
                ticketCustomer.email,
              );

          const samePhone =
            normalizePhone(
              ticketCustomer.phone,
            ) &&
            normalizePhone(
              customer.phone,
            ) ===
              normalizePhone(
                ticketCustomer.phone,
              );

          return sameEmail || samePhone;
        },
      );

    if (matchingIndex >= 0) {
      const existingCustomer =
        customerList[matchingIndex];

      customerList[matchingIndex] = {
        ...existingCustomer,

        name:
          existingCustomer.name ===
          "Unknown Customer"
            ? ticketCustomer.name
            : existingCustomer.name,

        email:
          existingCustomer.email ||
          ticketCustomer.email,

        phone:
          existingCustomer.phone ||
          ticketCustomer.phone,

        cnic:
          existingCustomer.cnic ||
          ticketCustomer.cnic,

        walletId:
          existingCustomer.walletId ||
          ticketCustomer.walletId,

        retailerId:
          existingCustomer.retailerId ||
          ticketCustomer.retailerId,

        city:
          existingCustomer.city ||
          ticketCustomer.city,

        updatedAt:
          new Date().toISOString(),
      };

      return;
    }

    const now =
      new Date().toISOString();

    customerList.push({
      id: createId(),

      customerNumber:
        generateCustomerNumber(
          customerList,
        ),

      ...ticketCustomer,

      address: "",

      preferredChannel: "Phone",

      notes: "",

      createdAt: now,

      updatedAt: now,
    });
  });

  saveCustomers(customerList);

  return customerList;
}

export function clearCustomers() {
  const storage = getStorage();

  if (storage) {
    storage.removeItem(
      CUSTOMER_STORAGE_KEY,
    );
  }
}

export { CUSTOMER_STORAGE_KEY };
