"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Package, AlertTriangle, Search, TrendingUp, DollarSign } from "lucide-react"

interface Product {
  id: number
  name: string
  category: string
  stock: number
  minStock: number
  costPrice: number
  salePrice: number
  supplier: string
  lastSale: string
  totalSold: number
}

export function ProductsManagement() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")

  const products: Product[] = [
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
      totalSold: 28,
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
      totalSold: 45,
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
      totalSold: 32,
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
      totalSold: 18,
    },
    {
      id: 5,
      name: "Cera Modeladora",
      category: "Cabelo",
      stock: 12,
      minStock: 6,
      costPrice: 22.0,
      salePrice: 42.0,
      supplier: "StylePro",
      lastSale: "2024-01-11",
      totalSold: 25,
    },
  ]

  const categories = ["Cabelo", "Barba", "Pele", "Acessórios"]

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { status: "low", color: "bg-red-100 text-red-800", label: "Baixo" }
    if (stock <= minStock * 1.5) return { status: "medium", color: "bg-yellow-100 text-yellow-800", label: "Médio" }
    return { status: "good", color: "bg-green-100 text-green-800", label: "Bom" }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "todos" || product.category === categoryFilter
    const stockStatus = getStockStatus(product.stock, product.minStock)
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "baixo" && stockStatus.status === "low") ||
      (statusFilter === "normal" && stockStatus.status !== "low")

    return matchesSearch && matchesCategory && matchesStatus
  })

  const productStats = {
    total: products.length,
    lowStock: products.filter((p) => p.stock <= p.minStock).length,
    totalValue: products.reduce((sum, p) => sum + p.stock * p.costPrice, 0),
    avgMargin:
      products.length > 0
        ? products.reduce((sum, p) => sum + ((p.salePrice - p.costPrice) / p.salePrice) * 100, 0) / products.length
        : 0,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900">{productStats.total}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-3xl font-bold text-red-600">{productStats.lowStock}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor em Estoque</p>
                <p className="text-3xl font-bold text-green-600">R$ {productStats.totalValue.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margem Média</p>
                <p className="text-3xl font-bold text-blue-600">{productStats.avgMargin.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {productStats.lowStock > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas de Estoque ({productStats.lowStock} produtos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {products
                .filter((product) => product.stock <= product.minStock)
                .map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">{product.name}</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800">{product.stock} restantes</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Produtos</CardTitle>
              <CardDescription>Controle de estoque e preços dos produtos</CardDescription>
            </div>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Produto</DialogTitle>
                  <DialogDescription>Preencha os dados do novo produto</DialogDescription>
                </DialogHeader>
                <ProductForm onClose={() => setShowAddForm(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="baixo">Estoque Baixo</SelectItem>
                <SelectItem value="normal">Estoque Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock, product.minStock)
              const margin = (((product.salePrice - product.costPrice) / product.salePrice) * 100).toFixed(1)

              return (
                <Card key={product.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                            <Badge variant="outline">{product.category}</Badge>
                            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Fornecedor: {product.supplier}</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Estoque</p>
                              <p className="text-lg font-bold text-gray-900">{product.stock}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Preço Venda</p>
                              <p className="text-lg font-bold text-green-600">R$ {product.salePrice.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Margem</p>
                              <p className="text-lg font-bold text-blue-600">{margin}%</p>
                            </div>
                            
                            
                          </div>
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
                  </CardContent>
                </Card>
              )
            })}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros ou adicione um novo produto.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    costPrice: 0,
    salePrice: 0,
    initialStock: 0,
    minStock: 5,
    supplier: "",
  })

  const categories = ["Cabelo", "Barba", "Pele", "Acessórios"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Salvando produto:", formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productName">Nome do Produto</Label>
          <Input
            id="productName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Óleo de Barba Premium"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: Number.parseFloat(e.target.value) })}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
          <Input
            id="salePrice"
            type="number"
            step="0.01"
            value={formData.salePrice}
            onChange={(e) => setFormData({ ...formData, salePrice: Number.parseFloat(e.target.value) })}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="initialStock">Estoque Inicial</Label>
          <Input
            id="initialStock"
            type="number"
            value={formData.initialStock}
            onChange={(e) => setFormData({ ...formData, initialStock: Number.parseInt(e.target.value) })}
            placeholder="0"
            required
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minStock">Estoque Mínimo</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number.parseInt(e.target.value) })}
            placeholder="5"
            required
          />
        </div>
        <div>
          <Label htmlFor="supplier">Fornecedor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="Nome do fornecedor"
            required
          />
        </div>
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          Adicionar Produto
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
