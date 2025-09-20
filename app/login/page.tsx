"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Scissors, Eye, EyeOff, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    lembrarMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getUserPlan = (email: string) => {
    if (email.includes("basico")) {
      return "basico"
    } else if (email.includes("premium")) {
      return "premium"
    } else {
      return "profissional" // plano padrão
    }
  }

  const getUserType = (email: string) => {
    if (email.includes("manager") || email.includes("barbearia")) {
      return "manager"
    } else if (email.includes("barbeiro")) {
      return "barber"
    } else {
      return "client"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulação de login
    setTimeout(() => {
      console.log("Login:", formData)

      const userType = getUserType(formData.email)
      const userPlan = getUserPlan(formData.email)
      const dashboardRoute = getDashboardRoute(userType)

      if (userType === "manager") {
        localStorage.setItem("userPlan", userPlan)
      }
      localStorage.setItem("userType", userType)
      localStorage.setItem("userEmail", formData.email)

      router.push(dashboardRoute)

      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 border-amber-200 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
              <Scissors className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Entrar na sua conta</CardTitle>
            <CardDescription className="text-gray-600">Acesse sua conta BarberPro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="senha" className="text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-amber-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lembrarMe"
                    checked={formData.lembrarMe}
                    onCheckedChange={(checked) => handleInputChange("lembrarMe", checked)}
                    className="border-gray-400 data-[state=checked]:bg-amber-600"
                  />
                  <Label htmlFor="lembrarMe" className="text-sm text-gray-600">
                    Lembrar-me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 hover:underline">
                  Esqueci minha senha
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-amber-600 hover:text-amber-700 hover:underline">
                  Criar conta
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-amber-600" />
                Contas de demonstração:
              </h4>
              <div className="space-y-3 text-xs text-gray-700">
                <div className="border-b border-amber-200 pb-2">
                  <div className="font-semibold text-amber-800 mb-1">Barbearias (Managers):</div>
                  <div>
                    <strong className="text-amber-600">Plano Básico:</strong> manager.basico@barberpro.com / 123456
                  </div>
                  <div>
                    <strong className="text-amber-600">Plano Profissional:</strong> manager@barberpro.com / 123456
                  </div>
                  <div>
                    <strong className="text-amber-600">Plano Premium:</strong> manager.premium@barberpro.com / 123456
                  </div>
                </div>
                <div className="border-b border-amber-200 pb-2">
                  <div className="font-semibold text-amber-800 mb-1">Funcionários:</div>
                  <div>
                    <strong className="text-orange-600">Barbeiro:</strong> barbeiro@barberpro.com / 123456
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-amber-800 mb-1">Clientes:</div>
                  <div>
                    <strong className="text-gray-600">Cliente:</strong> cliente@barberpro.com / 123456
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
