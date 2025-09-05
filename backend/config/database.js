// Mock database - Simulação de dados em memória
class MockDatabase {
  constructor() {
    this.users = [
      {
        id: 1,
        email: "admin@barberpro.com",
        password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
        name: "Admin BarberPro",
        role: "manager",
        barbershopId: 1,
        avatar: null,
        phone: "(11) 99999-9999",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: 2,
        email: "barbeiro@teste.com",
        password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
        name: "João Silva",
        role: "barber",
        barbershopId: 1,
        avatar: null,
        phone: "(11) 88888-8888",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: 3,
        email: "cliente@teste.com",
        password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
        name: "Maria Santos",
        role: "client",
        barbershopId: null,
        avatar: null,
        phone: "(11) 77777-7777",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ]

    this.barbershops = [
      {
        id: 1,
        name: "Barbearia Central",
        code: "CENTRAL123",
        address: "Rua das Flores, 123 - Centro",
        phone: "(11) 3333-3333",
        email: "contato@central.com",
        latitude: -23.5505,
        longitude: -46.6333,
        workingHours: {
          monday: { start: "08:00", end: "18:00" },
          tuesday: { start: "08:00", end: "18:00" },
          wednesday: { start: "08:00", end: "18:00" },
          thursday: { start: "08:00", end: "18:00" },
          friday: { start: "08:00", end: "18:00" },
          saturday: { start: "08:00", end: "16:00" },
          sunday: { closed: true },
        },
        plan: "premium",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ]

    this.services = [
      {
        id: 1,
        barbershopId: 1,
        name: "Corte Masculino",
        description: "Corte tradicional masculino",
        price: 25.0,
        duration: 30,
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: 2,
        barbershopId: 1,
        name: "Barba",
        description: "Aparar e modelar barba",
        price: 15.0,
        duration: 20,
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: 3,
        barbershopId: 1,
        name: "Corte + Barba",
        description: "Pacote completo",
        price: 35.0,
        duration: 45,
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ]

    this.appointments = [
      {
        id: 1,
        clientId: 3,
        barberId: 2,
        barbershopId: 1,
        serviceId: 1,
        date: "2024-12-20",
        time: "10:00",
        status: "confirmed",
        notes: "Cliente preferencial",
        price: 25.0,
        createdAt: new Date("2024-12-19"),
        updatedAt: new Date("2024-12-19"),
      },
      {
        id: 2,
        clientId: 3,
        barberId: 2,
        barbershopId: 1,
        serviceId: 3,
        date: "2024-12-20",
        time: "14:00",
        status: "pending",
        notes: "",
        price: 35.0,
        createdAt: new Date("2024-12-19"),
        updatedAt: new Date("2024-12-19"),
      },
    ]

    this.products = [
      {
        id: 1,
        barbershopId: 1,
        name: "Pomada Modeladora",
        description: "Pomada para modelar cabelo",
        price: 45.0,
        stock: 15,
        minStock: 5,
        category: "styling",
        active: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ]

    this.notifications = [
      {
        id: 1,
        userId: 2,
        title: "Novo agendamento",
        message: "Você tem um novo agendamento para hoje às 10:00",
        type: "appointment",
        read: false,
        createdAt: new Date("2024-12-19"),
        updatedAt: new Date("2024-12-19"),
      },
    ]

    // Auto-increment counters
    this.counters = {
      users: 3,
      barbershops: 1,
      services: 3,
      appointments: 2,
      products: 1,
      notifications: 1,
    }
  }

  // Helper methods for CRUD operations
  getNextId(table) {
    this.counters[table]++
    return this.counters[table]
  }

  findById(table, id) {
    return this[table].find((item) => item.id === Number.parseInt(id))
  }

  findByField(table, field, value) {
    return this[table].find((item) => item[field] === value)
  }

  findAllByField(table, field, value) {
    return this[table].filter((item) => item[field] === value)
  }

  create(table, data) {
    const newItem = {
      id: this.getNextId(table),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this[table].push(newItem)
    return newItem
  }

  update(table, id, data) {
    const index = this[table].findIndex((item) => item.id === Number.parseInt(id))
    if (index === -1) return null

    this[table][index] = {
      ...this[table][index],
      ...data,
      updatedAt: new Date(),
    }
    return this[table][index]
  }

  delete(table, id) {
    const index = this[table].findIndex((item) => item.id === Number.parseInt(id))
    if (index === -1) return false

    this[table].splice(index, 1)
    return true
  }
}

module.exports = new MockDatabase()
