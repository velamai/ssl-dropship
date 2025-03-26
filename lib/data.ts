// Mock data for shipments and orders
export interface Shipment {
  id: string
  trackingNumber: string
  status: string
  destination: string
  shipDate: string
  estimatedDelivery: string
  recipient: string
  recipientEmail: string
  recipientPhone: string
  serviceType: string
  packageType: string
  weight: string
  dimensions: string
  description: string
  createdAt: string
  specialInstructions?: string
  orderId?: string
  orderNumber?: string
  originAddress: {
    name: string
    street: string
    cityStateZip: string
    country: string
  }
  destinationAddress: {
    name: string
    street: string
    cityStateZip: string
    country: string
  }
  sender: {
    name: string
    email: string
    phone: string
  }
  trackingHistory: {
    status: string
    location: string
    timestamp: string
  }[]
}

export interface Order {
  id: string
  orderNumber: string
  customer: string
  customerReference?: string
  date: string
  status: string
  paymentMethod: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  notes?: string
  contactEmail: string
  contactPhone: string
  billingAddress: {
    name: string
    street: string
    cityStateZip: string
    country: string
  }
  shipments: Shipment[]
}

const mockShipments: Shipment[] = [
  {
    id: "1",
    trackingNumber: "CM1234567890",
    status: "in-transit",
    destination: "New York, NY",
    shipDate: "2023-05-15",
    estimatedDelivery: "2023-05-18",
    recipient: "John Smith",
    recipientEmail: "john.smith@example.com",
    recipientPhone: "+1 (555) 123-4567",
    serviceType: "Express",
    packageType: "Parcel",
    weight: "2.5",
    dimensions: "30 × 20 × 15",
    description: "Electronics - Laptop and accessories",
    createdAt: "2023-05-14",
    orderId: "1",
    orderNumber: "ORD-2023-001",
    specialInstructions: "Handle with care. Fragile electronics inside.",
    originAddress: {
      name: "Tech Solutions Inc.",
      street: "123 Business Ave",
      cityStateZip: "San Francisco, CA 94107",
      country: "United States",
    },
    destinationAddress: {
      name: "John Smith",
      street: "456 Park Avenue",
      cityStateZip: "New York, NY 10022",
      country: "United States",
    },
    sender: {
      name: "Tech Solutions Inc.",
      email: "shipping@techsolutions.com",
      phone: "+1 (555) 987-6543",
    },
    trackingHistory: [
      {
        status: "Package received",
        location: "San Francisco Sorting Center",
        timestamp: "May 15, 2023 - 09:23 AM",
      },
      {
        status: "In transit",
        location: "San Francisco International Airport",
        timestamp: "May 15, 2023 - 04:45 PM",
      },
      {
        status: "Arrived at facility",
        location: "Chicago Sorting Center",
        timestamp: "May 16, 2023 - 08:12 AM",
      },
      {
        status: "In transit",
        location: "Chicago Sorting Center",
        timestamp: "May 16, 2023 - 11:30 AM",
      },
    ],
  },
  {
    id: "2",
    trackingNumber: "CM9876543210",
    status: "pending",
    destination: "Los Angeles, CA",
    shipDate: "2023-05-17",
    estimatedDelivery: "2023-05-20",
    recipient: "Sarah Johnson",
    recipientEmail: "sarah.j@example.com",
    recipientPhone: "+1 (555) 234-5678",
    serviceType: "Standard",
    packageType: "Document",
    weight: "0.5",
    dimensions: "25 × 15 × 3",
    description: "Legal documents - Contract papers",
    createdAt: "2023-05-16",
    orderId: "1",
    orderNumber: "ORD-2023-001",
    originAddress: {
      name: "Legal Associates LLP",
      street: "789 Law Street",
      cityStateZip: "Boston, MA 02108",
      country: "United States",
    },
    destinationAddress: {
      name: "Sarah Johnson",
      street: "321 Hollywood Blvd",
      cityStateZip: "Los Angeles, CA 90028",
      country: "United States",
    },
    sender: {
      name: "Legal Associates LLP",
      email: "mail@legalassociates.com",
      phone: "+1 (555) 876-5432",
    },
    trackingHistory: [
      {
        status: "Label created",
        location: "Boston Office",
        timestamp: "May 16, 2023 - 02:15 PM",
      },
    ],
  },
  {
    id: "3",
    trackingNumber: "CM5678901234",
    status: "delivered",
    destination: "Miami, FL",
    shipDate: "2023-05-10",
    estimatedDelivery: "2023-05-13",
    recipient: "Maria Rodriguez",
    recipientEmail: "maria.r@example.com",
    recipientPhone: "+1 (555) 345-6789",
    serviceType: "Priority",
    packageType: "Parcel",
    weight: "4.2",
    dimensions: "40 × 30 × 25",
    description: "Clothing items - Summer collection",
    createdAt: "2023-05-09",
    orderId: "2",
    orderNumber: "ORD-2023-002",
    originAddress: {
      name: "Fashion Forward Inc.",
      street: "456 Style Avenue",
      cityStateZip: "Chicago, IL 60611",
      country: "United States",
    },
    destinationAddress: {
      name: "Maria Rodriguez",
      street: "789 Beach Drive",
      cityStateZip: "Miami, FL 33139",
      country: "United States",
    },
    sender: {
      name: "Fashion Forward Inc.",
      email: "orders@fashionforward.com",
      phone: "+1 (555) 765-4321",
    },
    trackingHistory: [
      {
        status: "Package received",
        location: "Chicago Sorting Center",
        timestamp: "May 10, 2023 - 10:45 AM",
      },
      {
        status: "In transit",
        location: "Chicago International Airport",
        timestamp: "May 10, 2023 - 06:30 PM",
      },
      {
        status: "Arrived at facility",
        location: "Atlanta Sorting Center",
        timestamp: "May 11, 2023 - 09:15 AM",
      },
      {
        status: "In transit",
        location: "Atlanta Sorting Center",
        timestamp: "May 11, 2023 - 12:45 PM",
      },
      {
        status: "Out for delivery",
        location: "Miami Distribution Center",
        timestamp: "May 12, 2023 - 08:30 AM",
      },
      {
        status: "Delivered",
        location: "Miami, FL",
        timestamp: "May 12, 2023 - 02:15 PM",
      },
    ],
  },
  {
    id: "4",
    trackingNumber: "CM2468013579",
    status: "cancelled",
    destination: "Seattle, WA",
    shipDate: "2023-05-12",
    estimatedDelivery: "2023-05-16",
    recipient: "David Wilson",
    recipientEmail: "david.w@example.com",
    recipientPhone: "+1 (555) 456-7890",
    serviceType: "Economy",
    packageType: "Parcel",
    weight: "1.8",
    dimensions: "35 × 25 × 10",
    description: "Books - Educational materials",
    createdAt: "2023-05-11",
    orderId: "3",
    orderNumber: "ORD-2023-003",
    originAddress: {
      name: "Knowledge Books Ltd.",
      street: "321 Education Lane",
      cityStateZip: "Austin, TX 78712",
      country: "United States",
    },
    destinationAddress: {
      name: "David Wilson",
      street: "654 Rainy Street",
      cityStateZip: "Seattle, WA 98101",
      country: "United States",
    },
    sender: {
      name: "Knowledge Books Ltd.",
      email: "orders@knowledgebooks.com",
      phone: "+1 (555) 654-3210",
    },
    trackingHistory: [
      {
        status: "Package received",
        location: "Austin Sorting Center",
        timestamp: "May 12, 2023 - 11:30 AM",
      },
      {
        status: "Shipment cancelled",
        location: "Austin Sorting Center",
        timestamp: "May 12, 2023 - 04:45 PM",
      },
    ],
  },
  {
    id: "5",
    trackingNumber: "CM1357924680",
    status: "in-transit",
    destination: "Denver, CO",
    shipDate: "2023-05-14",
    estimatedDelivery: "2023-05-18",
    recipient: "Michael Brown",
    recipientEmail: "michael.b@example.com",
    recipientPhone: "+1 (555) 567-8901",
    serviceType: "Standard",
    packageType: "Parcel",
    weight: "3.1",
    dimensions: "45 × 35 × 20",
    description: "Sporting goods - Hiking equipment",
    createdAt: "2023-05-13",
    originAddress: {
      name: "Outdoor Adventures Co.",
      street: "987 Mountain View",
      cityStateZip: "Portland, OR 97201",
      country: "United States",
    },
    destinationAddress: {
      name: "Michael Brown",
      street: "123 Rocky Road",
      cityStateZip: "Denver, CO 80202",
      country: "United States",
    },
    sender: {
      name: "Outdoor Adventures Co.",
      email: "sales@outdooradventures.com",
      phone: "+1 (555) 543-2109",
    },
    trackingHistory: [
      {
        status: "Package received",
        location: "Portland Sorting Center",
        timestamp: "May 14, 2023 - 10:15 AM",
      },
      {
        status: "In transit",
        location: "Portland International Airport",
        timestamp: "May 14, 2023 - 05:30 PM",
      },
      {
        status: "Arrived at facility",
        location: "Salt Lake City Sorting Center",
        timestamp: "May 15, 2023 - 08:45 AM",
      },
      {
        status: "In transit",
        location: "Salt Lake City Sorting Center",
        timestamp: "May 15, 2023 - 11:20 AM",
      },
    ],
  },
]

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2023-001",
    customer: "Tech Solutions Inc.",
    customerReference: "PO-12345",
    date: "2023-05-14",
    status: "processing",
    paymentMethod: "Credit Card",
    subtotal: 450.0,
    shipping: 35.5,
    tax: 48.55,
    total: 534.05,
    notes: "Priority handling requested",
    contactEmail: "shipping@techsolutions.com",
    contactPhone: "+1 (555) 987-6543",
    billingAddress: {
      name: "Tech Solutions Inc.",
      street: "123 Business Ave",
      cityStateZip: "San Francisco, CA 94107",
      country: "United States",
    },
    shipments: [mockShipments[0], mockShipments[1]],
  },
  {
    id: "2",
    orderNumber: "ORD-2023-002",
    customer: "Fashion Forward Inc.",
    customerReference: "FF-789",
    date: "2023-05-09",
    status: "completed",
    paymentMethod: "Bank Transfer",
    subtotal: 320.0,
    shipping: 25.0,
    tax: 34.5,
    total: 379.5,
    contactEmail: "orders@fashionforward.com",
    contactPhone: "+1 (555) 765-4321",
    billingAddress: {
      name: "Fashion Forward Inc.",
      street: "456 Style Avenue",
      cityStateZip: "Chicago, IL 60611",
      country: "United States",
    },
    shipments: [mockShipments[2]],
  },
  {
    id: "3",
    orderNumber: "ORD-2023-003",
    customer: "Knowledge Books Ltd.",
    date: "2023-05-11",
    status: "cancelled",
    paymentMethod: "PayPal",
    subtotal: 125.0,
    shipping: 15.0,
    tax: 14.0,
    total: 154.0,
    notes: "Customer requested cancellation",
    contactEmail: "orders@knowledgebooks.com",
    contactPhone: "+1 (555) 654-3210",
    billingAddress: {
      name: "Knowledge Books Ltd.",
      street: "321 Education Lane",
      cityStateZip: "Austin, TX 78712",
      country: "United States",
    },
    shipments: [mockShipments[3]],
  },
  {
    id: "4",
    orderNumber: "ORD-2023-004",
    customer: "Outdoor Adventures Co.",
    customerReference: "OA-456",
    date: "2023-05-13",
    status: "pending",
    paymentMethod: "Invoice",
    subtotal: 275.5,
    shipping: 30.0,
    tax: 30.55,
    total: 336.05,
    contactEmail: "sales@outdooradventures.com",
    contactPhone: "+1 (555) 543-2109",
    billingAddress: {
      name: "Outdoor Adventures Co.",
      street: "987 Mountain View",
      cityStateZip: "Portland, OR 97201",
      country: "United States",
    },
    shipments: [],
  },
]

// Function to get all shipments
export async function getShipments(): Promise<Shipment[]> {
  // In a real app, this would fetch from an API or database
  return mockShipments
}

// Function to get a shipment by ID
export async function getShipmentById(id: string): Promise<Shipment | undefined> {
  // In a real app, this would fetch from an API or database
  return mockShipments.find((shipment) => shipment.id === id)
}

// Function to get all orders
export async function getOrders(): Promise<Order[]> {
  // In a real app, this would fetch from an API or database
  return mockOrders
}

// Function to get an order by ID
export async function getOrderById(id: string): Promise<Order | undefined> {
  // In a real app, this would fetch from an API or database
  return mockOrders.find((order) => order.id === id)
}

