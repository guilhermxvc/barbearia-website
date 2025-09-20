import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Scissors, Users, BarChart3, Sparkles, Crown, Star, ArrowRight, Calendar, Smartphone, TrendingUp, Shield, HeadphonesIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import barbershopInterior from "@/attached_assets/generated_images/Modern_barbershop_interior_scene_9e6f6d5f.png"
import barberApp from "@/attached_assets/generated_images/Barber_using_scheduling_app_883e73ca.png"
import happyClients from "@/attached_assets/generated_images/Happy_barbershop_clients_a1f46e3a.png"

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
      <header className="fixed top-0 w-full z-50 border-b border-amber-200/50 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-600" />
              <span className="text-2xl font-bold text-gray-900">BarberPro</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#precos" className="text-gray-700 hover:text-amber-600 transition-colors">
                Preços
              </a>
              <Link href="/register" className="text-gray-700 hover:text-amber-600 transition-colors">
                Criar Conta
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-amber-600 transition-colors">
                Entrar
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-amber-600 transition-colors">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-lg hover:shadow-xl">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"></div>
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transforme sua barbearia com{" "}
                <span className="text-amber-600 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  tecnologia inteligente
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Plataforma completa de agendamento e gestão para barbearias modernas. Com IA integrada, relatórios
                avançados e experiência premium para seus clientes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    Começar Teste Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-4 text-lg">
                  Ver Demonstração
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                  <Users className="h-6 w-6 text-amber-600 mx-auto md:mx-0" />
                  <div>
                    <div className="font-bold text-2xl text-gray-900">500+</div>
                    <div className="text-sm text-gray-600">Barbearias</div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                  <Star className="h-6 w-6 text-amber-600 mx-auto md:mx-0" />
                  <div>
                    <div className="font-bold text-2xl text-gray-900">4.9/5</div>
                    <div className="text-sm text-gray-600">Avaliação</div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                  <Sparkles className="h-6 w-6 text-amber-600 mx-auto md:mx-0" />
                  <div>
                    <div className="font-bold text-2xl text-gray-900">IA</div>
                    <div className="text-sm text-gray-600">Integrada</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src={barbershopInterior}
                  alt="Interior moderno de barbearia"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent"></div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 transform -rotate-6 hidden lg:block">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium">+15 agendamentos hoje</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 transform rotate-6 hidden lg:block">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">95% satisfação</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal para sua barbearia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todos os planos incluem 30 dias grátis para testar todas as funcionalidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              const planKey = plan.name.toLowerCase().replace('ã', 'a') // básico -> basico
              return (
                <Card
                  key={index}
                  className={`relative ${plan.color} border-2 hover:shadow-2xl transition-all duration-500 h-full flex flex-col transform hover:scale-105 ${
                    plan.popular ? 'border-amber-400 shadow-xl ring-2 ring-amber-200' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-1">
                      ⭐ Mais Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-white rounded-full w-fit shadow-lg">
                      <IconComponent className="h-10 w-10 text-amber-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-600 text-lg">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center pb-6 flex-grow">
                    <div className="mb-8">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 text-lg">{plan.period}</span>
                      <div className="text-sm text-gray-500 mt-2">30 dias grátis</div>
                    </div>

                    <ul className="space-y-4 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Link href={`/register?plan=${planKey}&step=3`} className="w-full">
                      <Button
                        size="lg"
                        className={`w-full py-4 text-lg font-semibold transition-all ${
                          plan.popular
                            ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                            : "bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-600 hover:border-amber-700"
                        }`}
                      >
                        {plan.popular ? "🚀 Começar Agora" : "Começar Teste Grátis"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Precisa de algo personalizado?</p>
            <Button variant="outline" size="lg" className="border-amber-600 text-amber-600 hover:bg-amber-50">
              Falar com Vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Tecnologia que facilita sua vida
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Com nosso app, você controla todos os agendamentos na palma da mão. Interface intuitiva e fácil de usar.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-amber-600" />
                  <span className="text-gray-700">App Mobile</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-amber-600" />
                  <span className="text-gray-700">100% Seguro</span>
                </div>
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                  <span className="text-gray-700">Relatórios em Tempo Real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <HeadphonesIcon className="h-6 w-6 text-amber-600" />
                  <span className="text-gray-700">Suporte 24/7</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={barberApp}
                  alt="Barbeiro usando app de agendamento"
                  width={500}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Funcionalidades pensadas especialmente para o seu negócio. Desde agendamentos até análises avançadas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Users,
                title: "Gestão de Clientes",
                description: "CRM completo com histórico de serviços, preferências e dados de contato organizados",
              },
              {
                icon: BarChart3,
                title: "Relatórios Avançados",
                description: "Análises detalhadas de faturamento, performance e crescimento do seu negócio",
              },
              {
                icon: Sparkles,
                title: "IA Integrada",
                description: "Recomendações personalizadas e análise de tendências para otimizar seus resultados",
              },
              {
                icon: Calendar,
                title: "Agendamento Online",
                description: "Sistema completo de agendamentos 24/7 com confirmações automáticas",
              },
              {
                icon: Star,
                title: "Sistema de Avaliações",
                description: "Colete feedback dos clientes e melhore continuamente seus serviços",
              },
              {
                icon: Crown,
                title: "Marketing Digital",
                description: "Ferramentas de promoção, campanhas e programas de fidelização",
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="p-6 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="mx-auto mb-6 p-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl w-fit">
                    <IconComponent className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              )
            })}
          </div>

          {/* Social Proof Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={happyClients}
                  alt="Clientes satisfeitos na barbearia"
                  width={500}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Mais de 10.000 clientes satisfeitos
              </h3>
              <p className="text-xl text-gray-600 mb-8">
                Junte-se às centenas de barbearias que já transformaram seus negócios com nossa plataforma.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">500+ Barbearias Ativas</div>
                    <div className="text-gray-600">Crescendo 15% todo mês</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">4.9/5 de Satisfação</div>
                    <div className="text-gray-600">Baseado em +2,000 avaliações</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">40% Aumento em Vendas</div>
                    <div className="text-gray-600">Em média, nos primeiros 3 meses</div>
                  </div>
                </div>
              </div>
            </div>
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
