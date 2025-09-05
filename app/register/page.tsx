"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Scissors, Users, User, CreditCard, Check, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function RegisterPage() {
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"barbearia" | "barbeiro" | "cliente" | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<"basico" | "profissional" | "premium">("basico")
  const [isClient, setIsClient] = useState(false)
  const [codeValidation, setCodeValidation] = useState<{ isValid: boolean; barbershopName: string; message: string }>({
    isValid: false,
    barbershopName: "",
    message: "",
  })

  useEffect(() => {
    setIsClient(true)
    const planFromUrl = searchParams.get("plan")
    if (planFromUrl && ["basico", "profissional", "premium"].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl as "basico" | "profissional" | "premium")
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
      name: "Básico",
      price: "R$ 99",
      features: ["Até 3 barbeiros", "Agendamento online", "Gestão básica de clientes", "Relatórios simples"],
    },
    profissional: {
      name: "Profissional",
      price: "R$ 125",
      features: [
        "Até 8 barbeiros",
        "Todas funcionalidades básicas",
        "Relatórios avançados",
        "Gestão de estoque",
        "Marketing integrado",
      ],
    },
    premium: {
      name: "Premium",
      price: "R$ 199",
      features: [
        "Barbeiros ilimitados",
        "Todas funcionalidades profissionais",
        "IA avançada",
        "Integrações personalizadas",
        "Suporte prioritário 24/7",
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

    if (userType === "barbeiro" && !codeValidation.isValid) {
      alert("Por favor, insira um código de barbearia válido.")
      return
    }

    console.log("Dados do cadastro:", { ...formData, selectedPlan })

    if (userType === "barbeiro") {
      alert(`Solicitação enviada! Aguarde a aprovação da ${codeValidation.barbershopName}.`)
    } else {
      alert("Cadastro realizado com sucesso! Redirecionando para o dashboard...")
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-amber-600">Carregando...</div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
              <Scissors className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription>Escolha o tipo de conta que deseja criar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-amber-50 hover:border-amber-300 bg-transparent"
              onClick={() => {
                setUserType("barbearia")
                setStep(2)
              }}
            >
              <Scissors className="h-6 w-6 text-amber-600" />
              <div className="text-center">
                <div className="font-semibold">Conta Barbearia</div>
                <div className="text-sm text-gray-500">Gerenciar minha barbearia</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-amber-50 hover:border-amber-300 bg-transparent"
              onClick={() => {
                setUserType("barbeiro")
                setStep(2)
              }}
            >
              <User className="h-6 w-6 text-amber-600" />
              <div className="text-center">
                <div className="font-semibold">Conta Barbeiro</div>
                <div className="text-sm text-gray-500">Sou funcionário de uma barbearia</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-amber-50 hover:border-amber-300 bg-transparent"
              onClick={() => {
                setUserType("cliente")
                setStep(2)
              }}
            >
              <Users className="h-6 w-6 text-amber-600" />
              <div className="text-center">
                <div className="font-semibold">Conta Cliente</div>
                <div className="text-sm text-gray-500">Agendar serviços</div>
              </div>
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-amber-600 hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-600 hover:text-amber-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {userType === "barbearia" && "Cadastro da Barbearia"}
                  {userType === "barbeiro" && "Cadastro do Barbeiro"}
                  {userType === "cliente" && "Cadastro do Cliente"}
                </CardTitle>
                <CardDescription>
                  {userType === "barbearia" && "Preencha os dados da sua barbearia e escolha seu plano"}
                  {userType === "barbeiro" && "Preencha seus dados profissionais e código da barbearia"}
                  {userType === "cliente" && "Preencha seus dados pessoais"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  {userType === "barbearia" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Dados da Barbearia</h3>
                      <div>
                        <Label htmlFor="nomeBarbearia">Nome da Barbearia</Label>
                        <Input
                          id="nomeBarbearia"
                          value={formData.nomeBarbearia}
                          onChange={(e) => handleInputChange("nomeBarbearia", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => handleInputChange("cnpj", e.target.value)}
                          placeholder="00.000.000/0000-00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => handleInputChange("endereco", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input
                            id="cidade"
                            value={formData.cidade}
                            onChange={(e) => handleInputChange("cidade", e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado</Label>
                          <Select onValueChange={(value) => handleInputChange("estado", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            value={formData.cep}
                            onChange={(e) => handleInputChange("cep", e.target.value)}
                            placeholder="00000-000"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {userType === "barbeiro" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Dados Profissionais</h3>
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

                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Como obter o código?</h4>
                          <ul className="text-xs text-blue-800 space-y-1">
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

                  {userType === "barbearia" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Dados de Pagamento
                      </h3>
                      <div>
                        <Label htmlFor="numeroCartao">Número do Cartão</Label>
                        <Input
                          id="numeroCartao"
                          value={formData.numeroCartao}
                          onChange={(e) => handleInputChange("numeroCartao", e.target.value)}
                          placeholder="0000 0000 0000 0000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="nomeCartao">Nome no Cartão</Label>
                        <Input
                          id="nomeCartao"
                          value={formData.nomeCartao}
                          onChange={(e) => handleInputChange("nomeCartao", e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="validadeCartao">Validade</Label>
                          <Input
                            id="validadeCartao"
                            value={formData.validadeCartao}
                            onChange={(e) => handleInputChange("validadeCartao", e.target.value)}
                            placeholder="MM/AA"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange("cvv", e.target.value)}
                            placeholder="000"
                            required
                          />
                        </div>
                      </div>

                      <div key={selectedPlan} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-semibold text-amber-800 mb-3 flex items-center justify-between">
                          Plano Selecionado: {currentPlan.name}
                          <Badge className="bg-amber-600">{currentPlan.price}/mês</Badge>
                        </h4>

                        <div className="mb-4">
                          <h5 className="font-medium mb-2 text-amber-700">Funcionalidades incluídas:</h5>
                          <ul className="space-y-1">
                            {currentPlan.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <Check className="h-3 w-3 text-green-600" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t border-amber-200 pt-3">
                          <h5 className="font-semibold text-amber-800 mb-2">Resumo da Cobrança</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Período de teste (30 dias)</span>
                              <span className="text-green-600 font-medium">Grátis</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Após o período de teste</span>
                              <span>{currentPlan.price}/mês</span>
                            </div>
                          </div>
                          <p className="text-xs text-amber-700 mt-2">
                            Você pode cancelar a qualquer momento durante o período de teste.
                          </p>
                        </div>
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
                      <Link href="#" className="text-amber-600 hover:underline">
                        termos de uso
                      </Link>{" "}
                      e{" "}
                      <Link href="#" className="text-amber-600 hover:underline">
                        política de privacidade
                      </Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                    {userType === "barbearia"
                      ? "Finalizar Cadastro e Pagamento"
                      : userType === "barbeiro"
                        ? "Enviar Solicitação"
                        : "Criar Conta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {userType === "barbearia" && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Escolha seu Plano</CardTitle>
                  <CardDescription>Selecione o plano ideal para sua barbearia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(plans).map(([key, plan]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlan === key ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300"
                      }`}
                      onClick={() => handlePlanSelect(key as "basico" | "profissional" | "premium")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <Badge className={selectedPlan === key ? "bg-amber-600" : "bg-gray-500"}>
                          {plan.price}/mês
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 2).map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-gray-600">{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 2 && (
                          <li className="text-xs text-gray-500">+{plan.features.length - 2} funcionalidades</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
