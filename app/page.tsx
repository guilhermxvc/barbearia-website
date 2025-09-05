import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Scissors, Users, BarChart3, Sparkles, Crown, Star } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const plans = [
    {
      name: "Básico",
      price: "R$ 99",
      period: "/mês",
      description: "Ideal para barbearias iniciantes",
      features: [
        "Agendamento online",
        "Gestão básica de clientes",
        "Até 3 barbeiros",
        "Suporte por email",
        "Dashboard básico",
      ],
      icon: Scissors,
      popular: false,
      color: "border-amber-200 bg-amber-50",
    },
    {
      name: "Profissional",
      price: "R$ 125",
      period: "/mês",
      description: "Para barbearias em crescimento",
      features: [
        "Todas as funcionalidades básicas",
        "Gestão de estoque",
        "Relatórios avançados",
        "Marketing integrado",
        "Até 8 barbeiros",
        "Suporte prioritário",
      ],
      icon: BarChart3,
      popular: false,
      color: "border-amber-200 bg-amber-50",
    },
    {
      name: "Premium",
      price: "R$ 199",
      period: "/mês",
      description: "Para barbearias estabelecidas",
      features: [
        "Todas as funcionalidades profissionais",
        "IA avançada para recomendações",
        "Integrações personalizadas",
        "Barbeiros ilimitados",
        "Suporte 24/7",
        "Análises preditivas",
      ],
      icon: Crown,
      popular: true,
      color: "border-amber-200 bg-amber-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-600" />
              <span className="text-2xl font-bold text-gray-900">BarberPro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-amber-600">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">Começar Agora</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transforme sua barbearia com
              <span className="text-amber-600"> tecnologia inteligente</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Plataforma completa de agendamento e gestão para barbearias modernas. Com IA integrada, relatórios
              avançados e experiência premium para seus clientes.
            </p>
            <div className="flex items-center justify-center space-x-8 mb-12">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-amber-600" />
                <span className="text-gray-700">+500 Barbearias</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-amber-600" />
                <span className="text-gray-700">4.9/5 Avaliação</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <span className="text-gray-700">IA Integrada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Escolha o plano ideal para sua barbearia</h2>
            <p className="text-xl text-gray-600">Todos os planos incluem 30 dias grátis para testar</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={index}
                  className={`relative ${plan.color} border-2 hover:shadow-xl transition-all duration-300 h-full flex flex-col`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white">
                      Mais Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-white rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center pb-6 flex-grow">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>

                    <ul className="space-y-3 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/register?plan=${plan.name.toLowerCase()}`} className="w-full">
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                        }`}
                      >
                        Começar Teste Grátis
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Tudo que sua barbearia precisa</h2>
            <p className="text-xl text-gray-600">Funcionalidades pensadas especialmente para o seu negócio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Gestão de Clientes",
                description: "CRM completo com histórico de serviços e preferências",
              },
              {
                icon: BarChart3,
                title: "Relatórios Avançados",
                description: "Análises detalhadas de faturamento e performance",
              },
              {
                icon: Sparkles,
                title: "IA Integrada",
                description: "Recomendações personalizadas e análise de tendências",
              },
              {
                icon: Scissors,
                title: "Agendamento Online",
                description: "Sistema completo de agendamentos 24/7",
              },
              {
                icon: Star,
                title: "Avaliações",
                description: "Sistema de feedback e avaliações dos clientes",
              },
              {
                icon: Crown,
                title: "Marketing",
                description: "Ferramentas de promoção e fidelização",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center p-6">
                  <div className="mx-auto mb-4 p-3 bg-amber-100 rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Pronto para modernizar sua barbearia?</h2>
          <p className="text-xl text-amber-100 mb-8">
            Junte-se a centenas de barbearias que já transformaram seu negócio
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-100 text-lg px-8 py-3">
              Começar Teste Grátis de 30 Dias
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scissors className="h-6 w-6 text-amber-600" />
                <span className="text-xl font-bold">BarberPro</span>
              </div>
              <p className="text-gray-400">A plataforma mais completa para gestão de barbearias no Brasil.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BarberPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
