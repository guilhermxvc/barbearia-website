"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Building2, User, UserCheck, Scissors, Check, ArrowLeft, Crown } from "lucide-react"

type UserType = "barbearia" | "barbeiro" | "cliente" | null
type PlanType = "basico" | "profissional" | "premium"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("basico")
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    nomeBarbearia: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    especialidades: "",
    experiencia: "",
    barbershopName: "",
    message: "",
    aceitarTermos: false,
  })

  useEffect(() => {
    setIsClient(true)
    const planFromUrl = searchParams.get("plan")
    const stepFromUrl = searchParams.get("step")
    
    if (planFromUrl && ["basico", "profissional", "premium"].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl as PlanType)
    }
    
    // Se step=3 é especificado, ir direto para o pagamento (último passo do registro de barbearia)
    if (stepFromUrl === "3" && planFromUrl) {
      setUserType("barbearia")
      setStep(3) // Ir direto para o passo de pagamento
    }
  }, [searchParams])

  const plans = {
    basico: {
      name: "Básico",
      price: "R$ 39",
      description: "Ideal para barbearias iniciantes",
      features: [
        "Até 2 barbeiros",
        "Agendamento básico",
        "Relatórios simples",
        "Suporte por email",
      ],
    },
    profissional: {
      name: "Profissional",
      price: "R$ 79",
      description: "Para barbearias em crescimento",
      features: [
        "Até 5 barbeiros",
        "Agendamento avançado",
        "Relatórios detalhados",
        "Suporte prioritário",
        "Integração WhatsApp",
      ],
      popular: true,
    },
    premium: {
      name: "Premium",
      price: "R$ 129",
      description: "Para barbearias estabelecidas",
      features: [
        "Barbeiros ilimitados",
        "Todas as funcionalidades",
        "Relatórios avançados",
        "Suporte 24/7",
        "API personalizada",
      ],
    },
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simular registro
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirecionar baseado no tipo de usuário
      if (userType === "barbearia") {
        router.push("/dashboard/manager")
      } else if (userType === "barbeiro") {
        router.push("/dashboard/barber")
      } else {
        router.push("/dashboard/client")
      }
    } catch (error) {
      console.error("Erro no registro:", error)
    } finally {
      setIsLoading(false)
    }
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

  if (!isClient) {
    return null
  }

  // Componente de cabeçalho compartilhado
  const renderBackToHomeHeader = () => (
    <div className="text-center mb-8">
      <Link href="/" className="inline-flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors">
        <Scissors className="h-6 w-6" />
        <span className="text-lg font-semibold">Voltar ao início</span>
      </Link>
    </div>
  )

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {renderBackToHomeHeader()}
          {renderProgressSteps()}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Escolha o tipo de conta que deseja criar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            {/* Dono de Barbearia */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 h-full ${
                userType === "barbearia" ? "border-amber-500 bg-amber-50 shadow-lg" : "border-gray-200 hover:border-amber-300"
              }`}
              onClick={() => setUserType("barbearia")}
            >
              <CardContent className="p-6 text-center h-full flex flex-col">
                <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Dono de Barbearia</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">Quero gerenciar minha barbearia e equipe de barbeiros</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Gestão completa da barbearia</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Cadastro de barbeiros</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Relatórios financeiros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barbeiro */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 h-full ${
                userType === "barbeiro" ? "border-amber-500 bg-amber-50 shadow-lg" : "border-gray-200 hover:border-amber-300"
              }`}
              onClick={() => setUserType("barbeiro")}
            >
              <CardContent className="p-6 text-center h-full flex flex-col">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Barbeiro</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">Quero gerenciar meus agendamentos e clientes</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Agenda pessoal</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Controle de horários</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Histórico de clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 h-full md:col-span-2 lg:col-span-1 md:mx-auto lg:mx-0 md:max-w-sm lg:max-w-none ${
                userType === "cliente" ? "border-amber-500 bg-amber-50 shadow-lg" : "border-gray-200 hover:border-amber-300"
              }`}
              onClick={() => setUserType("cliente")}
            >
              <CardContent className="p-6 text-center h-full flex flex-col">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sou Cliente</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">Quero agendar cortes e encontrar barbearias</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Agendamento fácil</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Buscar barbearias</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Histórico de cortes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="container mx-auto max-w-6xl">
          {renderBackToHomeHeader()}
          {renderProgressSteps()}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu Plano</h1>
            <p className="text-gray-600">Selecione o plano ideal para sua barbearia</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 relative ${
                  selectedPlan === key ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                }`}
                onClick={() => setSelectedPlan(key as PlanType)}
              >
                {"popular" in plan && plan.popular && (
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
        {renderBackToHomeHeader()}
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
                  {/* Dados básicos */}
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
                      <Input
                        id="sobrenome"
                        value={formData.sobrenome}
                        onChange={(e) => handleInputChange("sobrenome", e.target.value)}
                        placeholder="Seu sobrenome"
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
                        placeholder="Mínimo 8 caracteres"
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

                  {/* Dados específicos do tipo */}
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
                      <div>
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => handleInputChange("endereco", e.target.value)}
                          placeholder="Endereço completo"
                          required
                        />
                      </div>
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