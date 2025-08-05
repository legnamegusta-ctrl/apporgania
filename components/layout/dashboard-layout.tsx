"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Home,
  Calendar,
  FileText,
  Map,
  Settings,
  LogOut,
  Leaf,
  BarChart3,
  Bell,
  Search,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard/client",
    icon: Home,
    description: "Visão geral da propriedade",
  },
  {
    name: "Agenda",
    href: "/dashboard/client/agenda",
    icon: Calendar,
    description: "Cronograma de atividades",
  },
  {
    name: "Relatórios",
    href: "/dashboard/client/reports",
    icon: FileText,
    description: "Relatórios e análises",
  },
  {
    name: "Mapa",
    href: "/dashboard/client/map",
    icon: Map,
    description: "Visualização geográfica",
  },
  {
    name: "Análises",
    href: "/dashboard/client/analytics",
    icon: BarChart3,
    description: "Dados e métricas",
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800",
              mobile && "text-base py-4",
            )}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 transition-colors",
                isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-gray-600",
              )}
            />
            <div className="flex-1">
              <div>{item.name}</div>
              {!mobile && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</div>}
            </div>
          </Link>
        )
      })}
    </nav>
  )

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <Badge variant="secondary" className="text-xs">
                {user?.role}
              </Badge>
            </div>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            {user?.lastLogin && (
              <p className="text-xs text-muted-foreground">
                Último acesso: {user.lastLogin.toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notificações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">AppOrgania</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestão Agrícola</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-6 py-6 overflow-y-auto">
              <NavItems mobile />
            </div>

            {/* User info in mobile */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">AppOrgania</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestão Agrícola Inteligente</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <NavItems />
          </div>

          {/* User section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search bar - hidden on mobile */}
              <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 min-w-0 flex-1 max-w-md">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-0 outline-none text-sm flex-1 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              {mounted && (
                <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>

              {/* User menu - desktop */}
              <div className="hidden lg:block">
                <UserMenu />
              </div>

              {/* User menu - mobile */}
              <div className="lg:hidden">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
