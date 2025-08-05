"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Shield, BarChart3, Users } from "lucide-react"

const features = [
  {
    icon: BarChart3,
    title: "Análise em Tempo Real",
    description: "Monitore suas propriedades com dados atualizados em tempo real",
  },
  {
    icon: Shield,
    title: "Segurança Avançada",
    description: "Seus dados protegidos com criptografia de ponta a ponta",
  },
  {
    icon: Users,
    title: "Gestão de Equipe",
    description: "Coordene sua equipe e atividades de forma eficiente",
  },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      // Redirect based on user role
      switch (user.role) {
        case "client":
          router.push("/dashboard/client")
          break
        case "admin":
          router.push("/dashboard/admin")
          break
        case "agronomist":
          router.push("/dashboard/agronomist")
          break
        case "operator":
          router.push("/dashboard/operator")
          break
        default:
          router.push("/dashboard/client")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left side - Branding and Features */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">AppOrgania</h1>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Gestão Agrícola
                <span className="text-primary block">Inteligente</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Transforme sua propriedade rural com tecnologia de ponta. Monitore, analise e otimize sua produção
                agrícola.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-white/50 backdrop-blur-sm">
                  <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-600">Propriedades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50k+</div>
                <div className="text-sm text-gray-600">Hectares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
                <CardDescription className="text-base">Faça login para acessar sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
