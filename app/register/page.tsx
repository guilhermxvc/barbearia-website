"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Building2, User, Scissors, Check, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { authApi } from "@/lib/api/auth"

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"barbearia" | "barbeiro" | "cliente" | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<"basico" | "profissional" | "premium">("profissional")
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; barbershopName: string; message: string }>({
    isValid: false,
    barbershopName: "",
    message: "",
  })

  useEffect(() => {
    setIsClient(true)
    const planFromUrl = searchParams.get("plan")
    const stepFromUrl = searchParams.get("step")
    
    if (planFromUrl && ["basico", "profissional", "premium"].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl as "basico" | "profissional" | "premium")
    }
    
    // Se step=3 é especificado, ir direto para o pagamento (último passo do registro de barbearia)
    if (stepFromUrl === "3" && planFromUrl) {
      setUserType("barbearia")
      setStep(3) // Ir direto para o passo de pagamento
    }
  }, [searchParams])

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    nomeBarbearia: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    cnpj: "",
    codigoBarbearia: "",
    especialidades: [] as string[],
    experiencia: "",
    portfolio: "",
    numeroCartao: "",
    nomeCartao: "",
    validadeCartao: "",
    cvv: "",
    aceitarTermos: false,
  })

  const validateBarbershopCode = (code: string) => {
    const validCodes = {
      BB123ABC: { name: "Barbearia Básica", plan: "basico" },
      BB456DEF: { name: "Barbearia Profissional", plan: "profissional" },
      BB789GHI: { name: "Barbearia Premium", plan: "premium" },
    }

    if (code.length < 6) {
      setCodeValidation({
        isValid: false,
        barbershopName: "",
        message: "",
      })
      return
    }

    const barbershop = validCodes[code as keyof typeof validCodes]

    if (barbershop) {
      setCodeValidation({
        isValid: true,
        barbershopName: barbershop.name,
        message: `Código válido! Você será vinculado à ${barbershop.name}`,
      })
    } else {
      setCodeValidation({
        isValid: false,
        barbershopName: "",
        message: "Código inválido. Verifique com o gerente da barbearia.",
      })
    }
  }

  const plans = {
    basico: {
      name: "Plano Básico",
      price: "R$ 99",
      description: "Ideal para barbearias pequenas",
      features: ["Agendamento online", "Gestão básica de clientes", "Até 3 barbeiros", "Suporte por email"],
    },
    profissional: {
      name: "Plano Profissional",
      price: "R$ 125",
      description: "Para barbearias em crescimento",
      features: [
        "Todas as funcionalidades básicas",
        "Gestão de estoque",
        "Relatórios avançados",
        "Marketing integrado",
        "Até 10 barbeiros",
      ],
      popular: true,
    },
    premium: {
      name: "Plano Premium",
      price: "R$ 199",
      description: "Solução completa com IA",
      features: [
        "Todas as funcionalidades profissionais",
        "IA avançada integrada",
        "Integrações personalizadas",
        "Barbeiros ilimitados",
        "Suporte 24/7",
      ],
    },
  }

  const currentPlan = plans[selectedPlan]

  const handlePlanSelect = (planKey: "basico" | "profissional" | "premium") => {
    console.log("Selecionando plano:", planKey)
    setSelectedPlan(planKey)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "codigoBarbearia") {
      validateBarbershopCode(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (userType === "barbeiro" && !codeValidation.isValid) {
      setError("Por favor, insira um código de barbearia válido.")
      setIsLoading(false)
      return
    }

    if (!formData.aceitarTermos) {
      setError("Você deve aceitar os termos de uso e política de privacidade")
      setIsLoading(false)
      return
    }

    try {
      // Mapear tipo de usuário
      let apiUserType: 'manager' | 'barber' | 'client'
      switch (userType) {
        case 'barbearia':
          apiUserType = 'manager'
          break
        case 'barbeiro':
          apiUserType = 'barber'
          break
        case 'cliente':
          apiUserType = 'client'
          break
        default:
          throw new Error('Tipo de usuário inválido')
      }

      // Preparar dados para a API
      const registerData = {
        email: formData.email,
        password: formData.senha,
        name: formData.nome,
        phone: formData.telefone,
        userType: apiUserType,
        ...(userType === 'barbearia' && {
          barbershopName: formData.nomeBarbearia,
          barbershopAddress: `${formData.endereco}, ${formData.cidade}, ${formData.estado} - ${formData.cep}`,
          barbershopPhone: formData.telefone,
          subscriptionPlan: selectedPlan,
        }),
        ...(userType === 'barbeiro' && {
          barbershopCode: formData.codigoBarbearia,
          specialties: formData.especialidades,
        }),
      }

      const response = await authApi.register(registerData)

      if (response.success && response.data) {
        // Sucesso - redirecionar para dashboard
        const dashboardRoute = getDashboardRoute(apiUserType)
        router.push(dashboardRoute)
      } else {
        setError(response.error || "Erro ao criar conta")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
      console.error("Register error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getDashboardRoute = (userType: string) => {
    switch (userType) {
      case "manager":
        return "/dashboard/manager"
      case "barber":
        return "/dashboard/barber" 
      case "client":
        return "/dashboard/client"
      default:
        return "/dashboard/client"
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-amber-600">Carregando...</div>
      </div>
    )
  }

  const renderProgressSteps = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            step >= 1 ? "bg-amber-600 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          1
        </div>
        <div className={`w-12 h-0.5 ${step >= 2 ? "bg-amber-600" : "bg-gray-300"}`}></div>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            step >= 2 ? "bg-amber-600 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          2
        </div>
        <div className={`w-12 h-0.5 ${step >= 3 ? "bg-amber-600" : "bg-gray-300"}`}></div>
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            step >= 3 ? "bg-amber-600 text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          3
        </div>
      </div>
    </div>
  )

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {renderProgressSteps()}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Escolha o tipo de conta que deseja criar</p>
          </div>

          <div className="flex justify-center">
            <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-4xl">
              {/* Dono de Barbearia */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  userType === "barbearia" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setUserType("barbearia")}
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Dono de Barbearia</h3>
                  <p className="text-sm text-gray-600 mb-4">Quero gerenciar minha barbearia e equipe de barbeiros</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Gestão completa da barbearia</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Cadastro de barbeiros</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Relatórios financeiros</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Barbeiro */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  userType === "barbeiro" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setUserType("barbeiro")}
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Scissors className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Barbeiro</h3>
                  <p className="text-sm text-gray-600 mb-4">Quero trabalhar em uma barbearia parceira</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Agenda pessoal</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Controle de comissões</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Histórico de clientes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  userType === "cliente" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setUserType("cliente")}
              >
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Cliente</h3>
                  <p className="text-sm text-gray-600 mb-4">Quero agendar serviços em barbearias</p>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Agendamento fácil</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Histórico de serviços</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Assistente IA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => userType && setStep(userType === "barbearia" ? 2 : 3)}
              disabled={!userType}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              Continuar
            </Button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2 && userType === "barbearia") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen p-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header Navigation */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors">
                <Scissors className="h-6 w-6" />
                <span className="text-lg font-semibold">Voltar ao início</span>
              </Link>
            </div>

            {renderProgressSteps()}

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Selecione o plano ideal para sua barbearia e comece com 30 dias grátis</p>
            </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 relative ${
                  selectedPlan === key ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setSelectedPlan(key as "basico" | "profissional" | "premium")}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-amber-600 text-white px-3 py-1">Mais Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-gray-900">
                      {plan.price}
                      <span className="text-sm font-normal text-gray-600">/mês</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setStep(1)} className="px-6 py-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={() => setStep(3)} className="px-8 py-2 bg-amber-600 hover:bg-amber-700 text-white">
              Continuar com Plano {plans[selectedPlan].name}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {renderProgressSteps()}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulário de dados */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {userType === "barbearia"
                    ? "Dados da Barbearia"
                    : userType === "barbeiro"
                      ? "Dados do Barbeiro"
                      : "Dados do Cliente"}
                </CardTitle>
                <CardDescription>
                  {userType === "barbearia"
                    ? "Informações para criar sua conta"
                    : userType === "barbeiro"
                      ? "Informações profissionais"
                      : "Informações pessoais"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados da Barbearia */}
                  {userType === "barbearia" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nomeBarbearia">Nome da Barbearia</Label>
                        <Input
                          id="nomeBarbearia"
                          value={formData.nomeBarbearia}
                          onChange={(e) => handleInputChange("nomeBarbearia", e.target.value)}
                          placeholder="Nome da sua barbearia"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => handleInputChange("nome", e.target.value)}
                            placeholder="Seu nome"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sobrenome">Sobrenome</Label>
                          <Input id="sobrenome" placeholder="Seu sobrenome" required />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => handleInputChange("telefone", e.target.value)}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => handleInputChange("endereco", e.target.value)}
                          placeholder="Endereço completo da barbearia"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            value={formData.cidade}
                            onChange={(e) => handleInputChange("cidade", e.target.value)}
                            placeholder="Cidade"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado</Label>
                          <Input
                            id="estado"
                            value={formData.estado}
                            onChange={(e) => handleInputChange("estado", e.target.value)}
                            placeholder="Estado"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="senha">Senha</Label>
                        <Input
                          id="senha"
                          type="password"
                          value={formData.senha}
                          onChange={(e) => handleInputChange("senha", e.target.value)}
                          placeholder="Sua senha"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {userType === "barbeiro" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Dados Profissionais</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome Completo</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => handleInputChange("nome", e.target.value)}
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => handleInputChange("telefone", e.target.value)}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="senha">Senha</Label>
                          <Input
                            id="senha"
                            type="password"
                            value={formData.senha}
                            onChange={(e) => handleInputChange("senha", e.target.value)}
                            placeholder="Sua senha"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                          <Input
                            id="confirmarSenha"
                            type="password"
                            value={formData.confirmarSenha}
                            onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                            placeholder="Confirme sua senha"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="experiencia">Tempo de Experiência</Label>
                        <Input
                          id="experiencia"
                          value={formData.experiencia}
                          onChange={(e) => handleInputChange("experiencia", e.target.value)}
                          placeholder="Ex: 5 anos"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="portfolio">Portfolio/Instagram (opcional)</Label>
                        <Input
                          id="portfolio"
                          value={formData.portfolio}
                          onChange={(e) => handleInputChange("portfolio", e.target.value)}
                          placeholder="@seu_instagram ou link do portfolio"
                        />
                      </div>

                      <div>
                        <Label htmlFor="codigoBarbearia">Código da Barbearia *</Label>
                        <Input
                          id="codigoBarbearia"
                          value={formData.codigoBarbearia}
                          onChange={(e) => handleInputChange("codigoBarbearia", e.target.value)}
                          placeholder="Ex: BB123ABC"
                          className={`${formData.codigoBarbearia.length > 0 ? (codeValidation.isValid ? "border-green-500 focus:border-green-500" : "border-red-500 focus:border-red-500") : ""}`}
                          required
                        />

                        {formData.codigoBarbearia.length > 0 && (
                          <div
                            className={`mt-2 p-3 rounded-lg flex items-start space-x-2 ${codeValidation.isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                          >
                            <AlertCircle
                              className={`h-4 w-4 mt-0.5 ${codeValidation.isValid ? "text-green-600" : "text-red-600"}`}
                            />
                            <div>
                              <p
                                className={`text-sm font-medium ${codeValidation.isValid ? "text-green-800" : "text-red-800"}`}
                              >
                                {codeValidation.message}
                              </p>
                              {codeValidation.isValid && (
                                <p className="text-xs text-green-700 mt-1">
                                  Sua solicitação será enviada para aprovação do gerente.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="text-sm font-medium text-amber-900 mb-1">Como obter o código?</h4>
                          <ul className="text-xs text-amber-800 space-y-1">
                            <li>• Solicite o código ao gerente/proprietário da barbearia</li>
                            <li>• O código é único para cada barbearia</li>
                            <li>• Formato: 2 letras + 6 caracteres (Ex: BB123ABC)</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <Label>Especialidades</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["Corte Clássico", "Barba", "Degradê", "Desenhos", "Coloração", "Tratamentos"].map((esp) => (
                            <div key={esp} className="flex items-center space-x-2">
                              <Checkbox
                                id={esp}
                                checked={formData.especialidades.includes(esp)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleInputChange("especialidades", [...formData.especialidades, esp])
                                  } else {
                                    handleInputChange(
                                      "especialidades",
                                      formData.especialidades.filter((e) => e !== esp),
                                    )
                                  }
                                }}
                              />
                              <Label htmlFor={esp} className="text-sm">
                                {esp}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {userType === "cliente" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nome">Nome Completo</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => handleInputChange("nome", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => handleInputChange("telefone", e.target.value)}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="senha">Senha</Label>
                          <Input
                            id="senha"
                            type="password"
                            value={formData.senha}
                            onChange={(e) => handleInputChange("senha", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                          <Input
                            id="confirmarSenha"
                            type="password"
                            value={formData.confirmarSenha}
                            onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="termos"
                      checked={formData.aceitarTermos}
                      onCheckedChange={(checked) => handleInputChange("aceitarTermos", checked)}
                      required
                    />
                    <Label htmlFor="termos" className="text-sm">
                      Aceito os{" "}
                      <Link href="#" className="text-amber-600 hover:text-amber-700 underline">
                        termos de uso
                      </Link>{" "}
                      e{" "}
                      <Link href="#" className="text-amber-600 hover:text-amber-700 underline">
                        política de privacidade
                      </Link>
                    </Label>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(userType === "barbearia" ? 2 : 1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Criando conta..." : "Finalizar Cadastro"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Plano (apenas para barbearia) */}
          {userType === "barbearia" && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Resumo do Plano
                  </CardTitle>
                  <CardDescription>Detalhes da sua assinatura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <h3 className="font-semibold text-lg">{plans[selectedPlan].name}</h3>
                      <div className="text-2xl font-bold text-amber-600 mt-1">
                        {plans[selectedPlan].price}
                        <span className="text-sm font-normal text-gray-600">/mês</span>
                      </div>
                      <Badge className="bg-amber-600 text-white mt-2">30 dias grátis</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Funcionalidades incluídas:</h4>
                      <div className="space-y-2">
                        {plans[selectedPlan].features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <p>• Primeiro mês grátis, cobrança inicia após 30 dias</p>
                      <p>• Cancele a qualquer momento</p>
                      <p>• Suporte completo durante o período de teste</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
