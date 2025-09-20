"use client"

import { useState, useEffect, FormEvent } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Package, AlertTriangle, Search, TrendingUp, DollarSign, Minus, ShoppingCart } from "lucide-react"
import { productsApi, Product, CreateProductRequest, UpdateProductRequest } from "@/lib/api/products"

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    stockQuantity: 0,
    minStockLevel: 5,
    category: "",
  })

  const categories = ["Cabelo", "Barba", "Pele", "Acessórios", "Outros"]

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError("")
    
    try {
      const barbershopId = localStorage.getItem('barbershopId')
      
      if (!barbershopId) {
        setError("ID da barbearia não encontrado")
        return
      }

      const response = await productsApi.list(barbershopId)
      
      if (response.success && response.data) {
        setProducts(response.data.products)
      } else {
        setError(response.error || "Erro ao carregar produtos")
      }
    } catch (err) {
      setError("Erro ao carregar produtos")
      console.error("Load products error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const barbershopId = localStorage.getItem('barbershopId')
      if (!barbershopId) {
        setError("ID da barbearia não encontrado")
        return
      }

      const productData: CreateProductRequest = {
        barbershopId,
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        cost: formData.cost || undefined,
        stockQuantity: formData.stockQuantity,
        minStockLevel: formData.minStockLevel,
        category: formData.category || undefined,
      }

      const response = await productsApi.create(productData)
      
      if (response.success) {
        await loadProducts()
        setShowAddForm(false)
        resetForm()
      } else {
        setError(response.error || "Erro ao criar produto")
      }
    } catch (err) {
      setError("Erro ao criar produto")
      console.error("Create product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct) return
    
    try {
      setLoading(true)

      const updateData: UpdateProductRequest = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        cost: formData.cost || undefined,
        stockQuantity: formData.stockQuantity,
        minStockLevel: formData.minStockLevel,
        category: formData.category || undefined,
      }

      const response = await productsApi.update(selectedProduct.id, updateData)
      
      if (response.success) {
        await loadProducts()
        setShowEditForm(false)
        setSelectedProduct(null)
        resetForm()
      } else {
        setError(response.error || "Erro ao atualizar produto")
      }
    } catch (err) {
      setError("Erro ao atualizar produto")
      console.error("Update product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    
    try {
      setLoading(true)
      
      const response = await productsApi.delete(productId)
      
      if (response.success) {
        await loadProducts()
      } else {
        setError(response.error || "Erro ao excluir produto")
      }
    } catch (err) {
      setError("Erro ao excluir produto")
      console.error("Delete product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleStockUpdate = async (productId: string, quantity: number, operation: 'add' | 'subtract') => {
    try {
      setLoading(true)
      
      const response = await productsApi.updateStock(productId, quantity, operation)
      
      if (response.success) {
        await loadProducts()
      } else {
        setError(response.error || "Erro ao atualizar estoque")
      }
    } catch (err) {
      setError("Erro ao atualizar estoque")
      console.error("Update stock error:", err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      cost: "",
      stockQuantity: 0,
      minStockLevel: 5,
      category: "",
    })
  }

  const openEditForm = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      cost: product.cost || "",
      stockQuantity: product.stockQuantity || 0,
      minStockLevel: product.minStockLevel || 5,
      category: product.category || "",
    })
    setShowEditForm(true)
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { status: "low", color: "bg-red-100 text-red-800", label: "Baixo" }
    if (stock <= minStock * 1.5) return { status: "medium", color: "bg-yellow-100 text-yellow-800", label: "Médio" }
    return { status: "good", color: "bg-green-100 text-green-800", label: "Bom" }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "todos" || product.category === categoryFilter
    const stockStatus = getStockStatus(product.stockQuantity || 0, product.minStockLevel || 5)
    const matchesStatus =
      statusFilter === "todos" ||
      (statusFilter === "baixo" && stockStatus.status === "low") ||
      (statusFilter === "normal" && stockStatus.status !== "low")

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Cálculos estatísticos
  const totalProducts = products.length
  const lowStockCount = products.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 5)).length
  const totalInventoryValue = products.reduce((sum, p) => {
    const cost = parseFloat(p.cost || "0")
    const stock = p.stockQuantity || 0
    return sum + (cost * stock)
  }, 0)
  const averageProfitMargin = products.length > 0 ? products.reduce((sum, p) => {
    const price = parseFloat(p.price)
    const cost = parseFloat(p.cost || "0")
    return sum + (cost > 0 ? ((price - cost) / price) * 100 : 0)
  }, 0) / products.length : 0

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-amber-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor do Estoque</p>
              <p className="text-2xl font-bold text-gray-900">R$ {totalInventoryValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Margem Média</p>
              <p className="text-2xl font-bold text-gray-900">{averageProfitMargin.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Produtos</CardTitle>
              <CardDescription>Gerencie seus produtos e controle de estoque</CardDescription>
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
                  <DialogDescription>Preencha as informações do produto</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço de Venda (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Preço de Custo (R$)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockQuantity">Quantidade em Estoque</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStockLevel">Estoque Mínimo</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                      Adicionar Produto
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
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
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status do estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="baixo">Estoque baixo</SelectItem>
                <SelectItem value="normal">Estoque normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de produtos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stockQuantity || 0, product.minStockLevel || 5)
              const profitMargin = parseFloat(product.cost || "0") > 0 
                ? ((parseFloat(product.price) - parseFloat(product.cost || "0")) / parseFloat(product.price)) * 100 
                : 0

              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                        {product.category && (
                          <p className="text-sm text-gray-600">{product.category}</p>
                        )}
                      </div>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Preço:</span>
                        <span className="font-medium">R$ {parseFloat(product.price).toFixed(2)}</span>
                      </div>
                      {product.cost && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Custo:</span>
                          <span>R$ {parseFloat(product.cost).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estoque:</span>
                        <span className={`font-medium ${(product.stockQuantity || 0) <= (product.minStockLevel || 5) ? 'text-red-600' : ''}`}>
                          {product.stockQuantity || 0} un.
                        </span>
                      </div>
                      {profitMargin > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Margem:</span>
                          <span className="text-green-600 font-medium">{profitMargin.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Controles de estoque */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockUpdate(product.id, 1, 'subtract')}
                          disabled={loading || (product.stockQuantity || 0) <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockUpdate(product.id, 1, 'add')}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(product)}
                          disabled={loading}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Atualize as informações do produto</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome do Produto *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
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

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Preço de Venda (R$) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-cost">Preço de Custo (R$)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-stockQuantity">Quantidade em Estoque</Label>
                <Input
                  id="edit-stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-minStockLevel">Estoque Mínimo</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={loading}>
                Salvar Alterações
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { 
                  setShowEditForm(false); 
                  setSelectedProduct(null);
                  resetForm(); 
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}