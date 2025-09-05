"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Scissors, Clock, DollarSign } from "lucide-react"

export function ServicesManagement() {
  const [showAddForm, setShowAddForm] = useState(false)

  const services = [
    {
      id: 1,
      name: "Corte Clássico",
      description: "Corte tradicional masculino com acabamento profissional",
      price: 25,
      duration: 30,
      category: "Corte",
      active: true,
    },
    {
      id: 2,
      name: "Barba Completa",
      description: "Aparar, modelar e finalizar a barba com produtos premium",
      price: 20,
      duration: 25,
      category: "Barba",
      active: true,
    },
    {
      id: 3,
      name: "Combo Corte + Barba",
      description: "Serviço completo de corte e barba com desconto especial",
      price: 40,
      duration: 50,
      category: "Combo",
      active: true,
    },
    {
      id: 4,
      name: "Degradê Moderno",
      description: "Corte degradê com técnicas modernas e acabamento impecável",
      price: 35,
      duration: 40,
      category: "Corte",
      active: true,
    },
    {
      id: 5,
      name: "Desenho na Lateral",
      description: "Desenhos personalizados nas laterais do cabelo",
      price: 15,
      duration: 20,
      category: "Especial",
      active: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Serviço
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Serviço</CardTitle>
            <CardDescription>Preencha os dados do novo serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceName">Nome do Serviço</Label>
                  <Input id="serviceName" placeholder="Ex: Corte Clássico" />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select id="category" className="w-full p-2 border rounded-md">
                    <option value="">Selecione uma categoria</option>
                    <option value="Corte">Corte</option>
                    <option value="Barba">Barba</option>
                    <option value="Combo">Combo</option>
                    <option value="Especial">Especial</option>
                    <option value="Tratamento">Tratamento</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Descreva o serviço oferecido..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" type="number" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input id="duration" type="number" placeholder="30" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  Adicionar Serviço
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className={`${!service.active ? "opacity-60" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Scissors className="h-5 w-5 mr-2 text-amber-600" />
                  {service.name}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="ml-1 font-semibold text-green-600">R$ {service.price}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="ml-1 text-sm text-blue-600">{service.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoria: {service.category}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      service.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
