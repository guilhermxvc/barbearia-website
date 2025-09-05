"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Package, AlertTriangle } from "lucide-react"

export function ProductsManagement() {
  const [showAddForm, setShowAddForm] = useState(false)

  const products = [
    {
      id: 1,
      name: "Óleo de Barba Premium",
      category: "Barba",
      stock: 15,
      minStock: 5,
      costPrice: 25.0,
      salePrice: 45.0,
      supplier: "BeardCare Co.",
      lastSale: "2024-01-15",
    },
    {
      id: 2,
      name: "Pomada Modeladora",
      category: "Cabelo",
      stock: 3,
      minStock: 10,
      costPrice: 18.0,
      salePrice: 35.0,
      supplier: "HairStyle Ltd.",
      lastSale: "2024-01-14",
    },
    {
      id: 3,
      name: "Shampoo Anticaspa",
      category: "Cabelo",
      stock: 8,
      minStock: 5,
      costPrice: 12.0,
      salePrice: 22.0,
      supplier: "CleanHair Inc.",
      lastSale: "2024-01-13",
    },
    {
      id: 4,
      name: "Bálsamo Hidratante",
      category: "Barba",
      stock: 20,
      minStock: 8,
      costPrice: 20.0,
      salePrice: 38.0,
      supplier: "BeardCare Co.",
      lastSale: "2024-01-12",
    },
  ]

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { status: "low", color: "bg-red-100 text-red-800" }
    if (stock <= minStock * 1.5) return { status: "medium", color: "bg-yellow-100 text-yellow-800" }
    return { status: "good", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button onClick={() => setShowAddForm(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Alertas de Estoque */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Alertas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products
              .filter((product) => product.stock <= product.minStock)
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm">{product.name}</span>
                  <Badge className="bg-red-100 text-red-800">{product.stock} unidades restantes</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Produto</CardTitle>
            <CardDescription>Preencha os dados do novo produto</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Nome do Produto</Label>
                  <Input id="productName" placeholder="Ex: Óleo de Barba Premium" />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select id="category" className="w-full p-2 border rounded-md">
                    <option value="">Selecione uma categoria</option>
                    <option value="Cabelo">Cabelo</option>
                    <option value="Barba">Barba</option>
                    <option value="Pele">Pele</option>
                    <option value="Acessórios">Acessórios</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                  <Input id="costPrice" type="number" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
                  <Input id="salePrice" type="number" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="initialStock">Estoque Inicial</Label>
                  <Input id="initialStock" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input id="minStock" type="number" placeholder="5" />
                </div>
                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input id="supplier" placeholder="Nome do fornecedor" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  Adicionar Produto
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock, product.minStock)
          const margin = (((product.salePrice - product.costPrice) / product.salePrice) * 100).toFixed(1)

          return (
            <Card key={product.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-gray-600">Categoria: {product.category}</p>
                      <p className="text-sm text-gray-500">Fornecedor: {product.supplier}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Estoque</p>
                    <p className="text-xl font-bold text-gray-900">{product.stock}</p>
                    <Badge className={`text-xs ${stockStatus.color}`}>
                      {stockStatus.status === "low" ? "Baixo" : stockStatus.status === "medium" ? "Médio" : "Bom"}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Preço Venda</p>
                    <p className="text-xl font-bold text-green-600">R$ {product.salePrice.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Margem</p>
                    <p className="text-xl font-bold text-blue-600">{margin}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Última Venda</p>
                    <p className="text-sm font-medium text-gray-900">{product.lastSale}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
