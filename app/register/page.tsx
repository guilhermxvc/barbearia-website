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
import { Building2, User, UserCheck, Scissors, Check, ArrowLeft, MapPin, Phone, Mail, Lock, Briefcase } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

type UserType = "manager" | "barber" | "client" | null
type PlanType = "basico" | "profissional" | "premium"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register: registerUser } = useAuth()
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("profissional")
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    nomeBarbearia: "",
    endereco: "",
    codigoBarbearia: "",
    especialidades: "",
    aceitarTermos: false,
  })

  useEffect(() => {
    setIsClient(true)
    const planFromUrl = searchParams.get("plan")
    
    if (planFromUrl && ["basico", "profissional", "premium"].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl as PlanType)
    }
  }, [searchParams])

  const plans = {
    basico: {
      name: "Básico",
      price: "R$ 39",
      description: "Ideal para começar",
      features: ["Até 2 barbeiros", "Agendamento básico", "Relatórios simples"],
      popular: false,
    },
    profissional: {
      name: "Profissional",
      price: "R$ 79",
      description: "Mais popular",
      features: ["Até 5 barbeiros", "Agendamento avançado", "Relatórios completos", "Suporte prioritário"],
      popular: true,
    },
    premium: {
      name: "Premium",
      price: "R$ 129",
      description: "Recursos completos",
      features: ["Barbeiros ilimitados", "Todas as funcionalidades", "API personalizada", "Suporte 24/7"],
      popular: false,
    },
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validações
      if (!formData.nome || !formData.sobrenome || !formData.email || !formData.senha) {
        setError("Por favor, preencha todos os campos obrigatórios")
        toast.error("Preencha todos os campos obrigatórios")
        setIsLoading(false)
        return
      }

      if (formData.senha !== formData.confirmarSenha) {
        setError("As senhas não coincidem")
        toast.error("As senhas não coincidem")
        setIsLoading(false)
        return
      }

      if (formData.senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres")
        toast.error("A senha deve ter pelo menos 6 caracteres")
        setIsLoading(false)
        return
      }

      if (!formData.aceitarTermos) {
        setError("Você deve aceitar os termos de uso")
        toast.error("Você deve aceitar os termos de uso")
        setIsLoading(false)
        return
      }

      // Preparar dados de acordo com o tipo de usuário
      const registrationData: any = {
        email: formData.email,
        password: formData.senha,
        firstName: formData.nome,
        lastName: formData.sobrenome,
        phone: formData.telefone,
        userType: userType
      }

      // Dados específicos para manager
      if (userType === "manager") {
        if (!formData.nomeBarbearia) {
          setError("Nome da barbearia é obrigatório")
          toast.error("Nome da barbearia é obrigatório")
          setIsLoading(false)
          return
        }
        registrationData.barbershopName = formData.nomeBarbearia
        registrationData.barbershopAddress = formData.endereco
        registrationData.barbershopPhone = formData.telefone
        registrationData.subscriptionPlan = selectedPlan
      }

      // Dados específicos para barber
      if (userType === "barber") {
        registrationData.barbershopCode = formData.codigoBarbearia || undefined
        registrationData.specialties = formData.especialidades ? formData.especialidades.split(',').map(s => s.trim()) : []
      }

      // Chamar a API de registro
      const result = await registerUser(registrationData)
      
      if (result.success) {
        toast.success("Cadastro realizado com sucesso!")
        
        // Pequeno delay para dar tempo da API carregar os dados
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Redirecionar baseado no tipo de usuário
        if (userType === "manager") {
          router.push("/dashboard/manager")
        } else if (userType === "barber") {
          router.push("/dashboard/barber")
        } else {
          router.push("/dashboard/client")
        }
      } else {
        setError(result.error || "Erro ao fazer cadastro")
        toast.error(result.error || "Erro ao fazer cadastro")
      }
    } catch (error) {
      console.error("Erro no registro:", error)
      setError("Erro ao conectar com o servidor")
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return null
  }

  // Step 1: Selecionar tipo de conta
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors mb-6">
              <Scissors className="h-6 w-6" />
              <span className="text-lg font-semibold">Voltar ao início</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-6">Criar Conta</h1>
            <p className="text-gray-600 text-lg">Escolha o tipo de conta que deseja criar</p>
          </div>

          {/* Cards de seleção */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Manager */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                userType === "manager" ? "border-amber-600 bg-amber-50 shadow-xl scale-105" : "border-gray-200 hover:border-amber-300"
              }`}
              onClick={() => setUserType("manager")}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <Building2 className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Dono de Barbearia</h3>
                <p className="text-sm text-gray-600 mb-4">Gerencie sua barbearia e equipe</p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Gestão completa</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Equipe de barbeiros</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Relatórios financeiros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barber */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                userType === "barber" ? "border-blue-600 bg-blue-50 shadow-xl scale-105" : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => setUserType("barber")}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <UserCheck className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Barbeiro</h3>
                <p className="text-sm text-gray-600 mb-4">Gerencie agendamentos e clientes</p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Agenda pessoal</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Controle de horários</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Histórico de clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                userType === "client" ? "border-green-600 bg-green-50 shadow-xl scale-105" : "border-gray-200 hover:border-green-300"
              }`}
              onClick={() => setUserType("client")}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <User className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cliente</h3>
                <p className="text-sm text-gray-600 mb-4">Agende cortes e encontre barbearias</p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Agendamento fácil</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Buscar barbearias</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Histórico de cortes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão continuar */}
          <div className="text-center">
            <Button
              onClick={() => {
                if (!userType) {
                  toast.error("Selecione um tipo de conta")
                  return
                }
                setStep(2)
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              disabled={!userType}
            >
              Continuar
            </Button>
            <p className="mt-4 text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-semibold">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Selecionar plano (apenas para manager)
  if (step === 2 && userType === "manager") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors mb-6">
              <Scissors className="h-6 w-6" />
              <span className="text-lg font-semibold">Voltar ao início</span>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-6">Escolha seu Plano</h1>
            <p className="text-gray-600 text-lg">Selecione o plano ideal para sua barbearia</p>
          </div>

          {/* Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(Object.keys(plans) as PlanType[]).map((planKey) => {
              const plan = plans[planKey]
              return (
                <Card
                  key={planKey}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 relative ${
                    selectedPlan === planKey ? "border-amber-600 bg-amber-50 shadow-xl scale-105" : "border-gray-200 hover:border-amber-300"
                  }`}
                  onClick={() => setSelectedPlan(planKey)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white">
                      Mais Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Botões */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="px-6 py-6 text-lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg font-semibold"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3 ou 2 (para barber/client): Formulário de dados
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-gray-700 hover:text-amber-600 transition-colors mb-6">
            <Scissors className="h-6 w-6" />
            <span className="text-lg font-semibold">Voltar ao início</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-6">Complete seu Cadastro</h1>
          <p className="text-gray-600 text-lg">
            {userType === "manager" && "Informações da sua barbearia"}
            {userType === "barber" && "Informações profissionais"}
            {userType === "client" && "Suas informações pessoais"}
          </p>
        </div>

        <Card className="shadow-xl border-2 border-gray-200">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-amber-600" />
                  Dados Pessoais
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="João"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sobrenome">Sobrenome *</Label>
                    <Input
                      id="sobrenome"
                      value={formData.sobrenome}
                      onChange={(e) => handleInputChange("sobrenome", e.target.value)}
                      placeholder="Silva"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email *
                  </Label>
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
                  <Label htmlFor="telefone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Dados da barbearia (apenas manager) */}
              {userType === "manager" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-amber-600" />
                    Dados da Barbearia
                  </h3>
                  <div>
                    <Label htmlFor="nomeBarbearia">Nome da Barbearia *</Label>
                    <Input
                      id="nomeBarbearia"
                      value={formData.nomeBarbearia}
                      onChange={(e) => handleInputChange("nomeBarbearia", e.target.value)}
                      placeholder="Barbearia Premium"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endereco" className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Endereço
                    </Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange("endereco", e.target.value)}
                      placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF"
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900">
                      <strong>Plano selecionado:</strong> {plans[selectedPlan].name} - {plans[selectedPlan].price}/mês
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Primeiro mês grátis • Cancele quando quiser
                    </p>
                  </div>
                </div>
              )}

              {/* Dados do barbeiro (apenas barber) */}
              {userType === "barber" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                    Informações Profissionais
                  </h3>
                  <div>
                    <Label htmlFor="codigoBarbearia">Código da Barbearia (Opcional)</Label>
                    <Input
                      id="codigoBarbearia"
                      value={formData.codigoBarbearia}
                      onChange={(e) => handleInputChange("codigoBarbearia", e.target.value)}
                      placeholder="XX-1234"
                      className="uppercase"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Se você já tem um código da barbearia, insira aqui. Caso contrário, pode vincular depois.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="especialidades">Especialidades (Opcional)</Label>
                    <Input
                      id="especialidades"
                      value={formData.especialidades}
                      onChange={(e) => handleInputChange("especialidades", e.target.value)}
                      placeholder="Corte Clássico, Barba, Degradê"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Separe suas especialidades com vírgula
                    </p>
                  </div>
                </div>
              )}

              {/* Senha */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-amber-600" />
                  Segurança
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      value={formData.senha}
                      onChange={(e) => handleInputChange("senha", e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
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
              </div>

              {/* Termos */}
              <div className="flex items-start space-x-2 pt-4 border-t">
                <Checkbox
                  id="termos"
                  checked={formData.aceitarTermos}
                  onCheckedChange={(checked) => handleInputChange("aceitarTermos", checked as boolean)}
                  required
                />
                <Label htmlFor="termos" className="text-sm leading-relaxed cursor-pointer">
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

              {/* Mensagem de erro */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(userType === "manager" ? 2 : 1)}
                  className="flex-1 py-6"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-amber-600 hover:text-amber-700 font-semibold">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
