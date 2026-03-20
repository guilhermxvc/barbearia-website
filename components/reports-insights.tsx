"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from "recharts"
import {
  TrendingUp, DollarSign, Calendar,
  Download, Loader2, BarChart3, PieChart as PieChartIcon, AlertCircle,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  parseISO, isWithinInterval, getDaysInMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SaleRecord {
  id: string
  barberId: string
  barberName: string
  clientName: string
  serviceName: string
  totalAmount: string
  paymentMethod: string
  createdAt: string
}

interface AppointmentRecord {
  id: string
  scheduledAt: string
  status: string
  totalPrice: string
  client: { id: string; name: string }
  barber: { id: string; name: string }
  service: { id: string; name: string; price: string }
}

interface BarberOption {
  id: string
  name: string
}

const COLORS = ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#1d4ed8", "#3b82f6", "#10b981", "#ef4444"]

const PERIOD_PRESETS = [
  { label: "Esta semana", value: "week" },
  { label: "Este mês", value: "month" },
  { label: "Este trimestre", value: "quarter" },
  { label: "Este ano", value: "year" },
]

function getPeriodDates(preset: string): { start: Date; end: Date } {
  const now = new Date()
  switch (preset) {
    case "week": return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) }
    case "month": return { start: startOfMonth(now), end: endOfMonth(now) }
    case "quarter": return { start: startOfQuarter(now), end: endOfQuarter(now) }
    case "year": return { start: startOfYear(now), end: endOfYear(now) }
    default: return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatMonthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split("-").map(Number)
  return format(new Date(y, m - 1, 1), "MMM/yy", { locale: ptBR })
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface ReportsInsightsProps {
  barbershopId: string
}

export function ReportsInsights({ barbershopId }: ReportsInsightsProps) {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [barbers, setBarbers] = useState<BarberOption[]>([])
  const [loading, setLoading] = useState(true)

  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [periodPreset, setPeriodPreset] = useState("month")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const [compareMonth1, setCompareMonth1] = useState(() => {
    const now = new Date()
    const prev = now.getMonth() === 0 ? 12 : now.getMonth()
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return `${prevYear}-${String(prev).padStart(2, "0")}`
  })
  const [compareMonth2, setCompareMonth2] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [selectedBarber, setSelectedBarber] = useState("all")

  const fetchData = useCallback(async () => {
    if (!barbershopId) return
    setLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      const headers = { Authorization: `Bearer ${token}` }
      const [salesRes, appointmentsRes, barbersRes] = await Promise.all([
        fetch(`/api/sales?barbershopId=${barbershopId}`, { headers }),
        fetch(`/api/appointments?barbershopId=${barbershopId}`, { headers }),
        fetch(`/api/barbers?barbershopId=${barbershopId}`, { headers }),
      ])
      const salesData = await salesRes.json()
      const appointmentsData = await appointmentsRes.json()
      const barbersData = await barbersRes.json()

      if (salesData.sales) setSales(salesData.sales)
      if (appointmentsData.appointments) setAppointments(appointmentsData.appointments)
      if (barbersData.barbers) {
        setBarbers(barbersData.barbers.map((b: any) => ({
          id: b.id,
          name: b.user?.name || b.name || "Barbeiro",
        })))
      }
    } catch (e) {
      console.error("Erro ao carregar relatórios", e)
    } finally {
      setLoading(false)
    }
  }, [barbershopId])

  useEffect(() => { fetchData() }, [fetchData])

  const getPeriodRange = () => {
    if (useCustom && customStart && customEnd) {
      return { start: new Date(customStart + "T00:00:00"), end: new Date(customEnd + "T23:59:59") }
    }
    return getPeriodDates(periodPreset)
  }

  const filterSalesByRange = (s: SaleRecord, range: { start: Date; end: Date }) => {
    const d = parseISO(s.createdAt)
    return isWithinInterval(d, range)
  }

  const filterApptsByRange = (a: AppointmentRecord, range: { start: Date; end: Date }) => {
    const d = parseISO(a.scheduledAt)
    return isWithinInterval(d, range)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="period" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="period" className="text-xs sm:text-sm py-2">Faturamento</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs sm:text-sm py-2">Comparar Meses</TabsTrigger>
          <TabsTrigger value="barber" className="text-xs sm:text-sm py-2">Por Barbeiro</TabsTrigger>
          <TabsTrigger value="service" className="text-xs sm:text-sm py-2">Por Serviço</TabsTrigger>
          <TabsTrigger value="noshow" className="text-xs sm:text-sm py-2">No-show</TabsTrigger>
        </TabsList>

        {/* ──────────────── FATURAMENTO ──────────────── */}
        <TabsContent value="period" className="mt-6 space-y-4">
          <FaturamentoTab
            sales={sales}
            appointments={appointments}
            billingMonth={billingMonth}
            setBillingMonth={setBillingMonth}
          />
        </TabsContent>

        {/* ──────────────── COMPARAR MESES ──────────────── */}
        <TabsContent value="compare" className="mt-6 space-y-4">
          <CompareTab
            sales={sales}
            appointments={appointments}
            compareMonth1={compareMonth1}
            setCompareMonth1={setCompareMonth1}
            compareMonth2={compareMonth2}
            setCompareMonth2={setCompareMonth2}
          />
        </TabsContent>

        {/* ──────────────── POR BARBEIRO ──────────────── */}
        <TabsContent value="barber" className="mt-6 space-y-4">
          <BarberTab
            sales={sales}
            appointments={appointments}
            barbers={barbers}
            selectedBarber={selectedBarber}
            setSelectedBarber={setSelectedBarber}
          />
        </TabsContent>

        {/* ──────────────── POR SERVIÇO ──────────────── */}
        <TabsContent value="service" className="mt-6 space-y-4">
          <ServiceTab sales={sales} />
        </TabsContent>

        {/* ──────────────── NO-SHOW ──────────────── */}
        <TabsContent value="noshow" className="mt-6 space-y-4">
          <NoShowTab
            appointments={appointments}
            periodPreset={periodPreset}
            setPeriodPreset={setPeriodPreset}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            useCustom={useCustom}
            setUseCustom={setUseCustom}
            getPeriodRange={getPeriodRange}
            filterApptsByRange={filterApptsByRange}
          />
        </TabsContent>
      </Tabs>

      {/* ──────────────── EXPORTAR ──────────────── */}
      <ExportSection
        sales={sales}
        appointments={appointments}
        billingMonth={billingMonth}
        getPeriodRange={getPeriodRange}
        filterSalesByRange={filterSalesByRange}
        filterApptsByRange={filterApptsByRange}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// TAB: FATURAMENTO (mês único)
// ─────────────────────────────────────────────────────────────────
function FaturamentoTab({ sales, appointments, billingMonth, setBillingMonth }: any) {
  const [y, m] = billingMonth.split("-").map(Number)
  const monthStart = startOfMonth(new Date(y, m - 1, 1))
  const monthEnd = endOfMonth(new Date(y, m - 1, 1))
  const daysInMonth = getDaysInMonth(new Date(y, m - 1, 1))

  const filteredSales = sales.filter((s: SaleRecord) => {
    const d = parseISO(s.createdAt)
    return isWithinInterval(d, { start: monthStart, end: monthEnd })
  })
  const filteredAppts = appointments.filter((a: AppointmentRecord) => {
    const d = parseISO(a.scheduledAt)
    return isWithinInterval(d, { start: monthStart, end: monthEnd })
  })

  const totalRevenue = filteredSales.reduce((acc: number, s: SaleRecord) => acc + parseFloat(s.totalAmount || "0"), 0)
  const totalSales = filteredSales.length
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0
  const totalAppts = filteredAppts.length

  const dailyMap: Record<number, number> = {}
  filteredSales.forEach((s: SaleRecord) => {
    const day = parseISO(s.createdAt).getDate()
    dailyMap[day] = (dailyMap[day] || 0) + parseFloat(s.totalAmount || "0")
  })

  const chartData = Array.from({ length: daysInMonth }, (_, i) => ({
    dia: String(i + 1).padStart(2, "0"),
    valor: parseFloat((dailyMap[i + 1] || 0).toFixed(2)),
  }))

  const monthLabel = format(new Date(y, m - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Mês de Referência</CardTitle>
          <Calendar className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              type="month"
              value={billingMonth}
              onChange={e => setBillingMonth(e.target.value)}
              className="h-9 text-sm w-44"
            />
            <span className="text-sm text-gray-500 capitalize">{monthLabel}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Faturamento Total" value={formatCurrency(totalRevenue)} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={TrendingUp} label="Ticket Médio" value={formatCurrency(avgTicket)} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={CheckCircle} label="Vendas" value={String(totalSales)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Calendar} label="Agendamentos" value={String(totalAppts)} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento Diário — {monthLabel}</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 10 }}
                interval={daysInMonth > 20 ? 2 : 0}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={v => v === 0 ? "0" : `R$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Faturamento"]}
                labelFormatter={l => `Dia ${l}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (payload.valor === 0) return <circle key={`dot-${payload.dia}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="none" />
                  return <circle key={`dot-${payload.dia}`} cx={cx} cy={cy} r={4} fill="#d97706" stroke="#fff" strokeWidth={2} />
                }}
                activeDot={{ r: 6, fill: "#b45309", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {filteredSales.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações do Mês</CardTitle>
            <Badge variant="secondary">{filteredSales.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-72 overflow-y-auto">
              {filteredSales.map((s: SaleRecord) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.clientName || "Cliente"}</p>
                    <p className="text-xs text-gray-500">{s.serviceName} · {s.barberName} · {format(parseISO(s.createdAt), "dd/MM/yyyy")}</p>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">{formatCurrency(parseFloat(s.totalAmount || "0"))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState message="Nenhuma venda registrada neste mês." />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// TAB: COMPARAR MESES
// ─────────────────────────────────────────────────────────────────
function CompareTab({ sales, appointments, compareMonth1, setCompareMonth1, compareMonth2, setCompareMonth2 }: any) {
  const getMonthStats = (yyyymm: string) => {
    const [y, m] = yyyymm.split("-").map(Number)
    const start = startOfMonth(new Date(y, m - 1, 1))
    const end = endOfMonth(new Date(y, m - 1, 1))
    const s = sales.filter((s: SaleRecord) => {
      const d = parseISO(s.createdAt)
      return isWithinInterval(d, { start, end })
    })
    const a = appointments.filter((a: AppointmentRecord) => {
      const d = parseISO(a.scheduledAt)
      return isWithinInterval(d, { start, end })
    })
    const revenue = s.reduce((acc: number, sale: SaleRecord) => acc + parseFloat(sale.totalAmount || "0"), 0)
    const completed = a.filter((ap: AppointmentRecord) => ap.status === "completed" || ap.status === "finished")
    const cancelled = a.filter((ap: AppointmentRecord) => ap.status === "cancelled" || ap.status === "no_show")
    return {
      revenue,
      totalAppts: a.length,
      completedAppts: completed.length,
      cancelledAppts: cancelled.length,
      avgTicket: completed.length > 0 ? revenue / completed.length : 0,
      cancelRate: a.length > 0 ? (cancelled.length / a.length) * 100 : 0,
    }
  }

  const stats1 = getMonthStats(compareMonth1)
  const stats2 = getMonthStats(compareMonth2)

  const diff = (a: number, b: number) => {
    if (b === 0) return a > 0 ? 100 : 0
    return ((a - b) / b) * 100
  }

  const barData = [
    { name: "Faturamento", m1: stats1.revenue, m2: stats2.revenue },
    { name: "Agendamentos", m1: stats1.totalAppts, m2: stats2.totalAppts },
    { name: "Concluídos", m1: stats1.completedAppts, m2: stats2.completedAppts },
    { name: "Cancelados", m1: stats1.cancelledAppts, m2: stats2.cancelledAppts },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Selecione os Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Mês 1</Label>
              <Input type="month" value={compareMonth1} onChange={e => setCompareMonth1(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Mês 2</Label>
              <Input type="month" value={compareMonth2} onChange={e => setCompareMonth2(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompareCard label={formatMonthLabel(compareMonth1)} stats={stats1} highlight />
        <CompareCard label={formatMonthLabel(compareMonth2)} stats={stats2} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variação (%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Faturamento", v1: stats1.revenue, v2: stats2.revenue },
            { label: "Agendamentos", v1: stats1.totalAppts, v2: stats2.totalAppts },
            { label: "Ticket Médio", v1: stats1.avgTicket, v2: stats2.avgTicket },
          ].map(({ label, v1, v2 }) => {
            const d = diff(v1, v2)
            const positive = d >= 0
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <div className={`flex items-center gap-1 text-sm font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
                  {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(d).toFixed(1)}%
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comparativo Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend formatter={(v) => v === "m1" ? formatMonthLabel(compareMonth1) : formatMonthLabel(compareMonth2)} />
              <Bar dataKey="m1" fill="#d97706" radius={[4, 4, 0, 0]} name="m1" />
              <Bar dataKey="m2" fill="#3b82f6" radius={[4, 4, 0, 0]} name="m2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function CompareCard({ label, stats, highlight }: { label: string; stats: any; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-amber-300 bg-amber-50/30" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{label}</CardTitle>
        {highlight && <Badge className="bg-amber-600 text-xs">Mês 1</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Faturamento</span>
          <span className="text-sm font-bold text-amber-600">{formatCurrency(stats.revenue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Agendamentos</span>
          <span className="text-sm font-semibold">{stats.totalAppts}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Concluídos</span>
          <span className="text-sm font-semibold text-green-600">{stats.completedAppts}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Cancelados</span>
          <span className="text-sm font-semibold text-red-500">{stats.cancelledAppts}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Ticket Médio</span>
          <span className="text-sm font-semibold">{formatCurrency(stats.avgTicket)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Taxa Cancelamento</span>
          <span className="text-sm font-semibold text-red-500">{stats.cancelRate.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────
// TAB: POR BARBEIRO
// ─────────────────────────────────────────────────────────────────
function BarberTab({ sales, appointments, barbers, selectedBarber, setSelectedBarber }: any) {
  const barberStats = barbers.map((b: BarberOption) => {
    const bs = sales.filter((s: SaleRecord) => s.barberId === b.id)
    const ba = appointments.filter((a: AppointmentRecord) => a.barber?.id === b.id)
    const revenue = bs.reduce((acc: number, s: SaleRecord) => acc + parseFloat(s.totalAmount || "0"), 0)
    const completed = ba.filter((a: AppointmentRecord) => a.status === "completed" || a.status === "finished")
    return {
      id: b.id,
      name: b.name,
      revenue,
      totalAppts: ba.length,
      completedAppts: completed.length,
      avgTicket: completed.length > 0 ? revenue / completed.length : 0,
    }
  }).sort((a: any, b: any) => b.revenue - a.revenue)

  const focused = selectedBarber === "all"
    ? barberStats
    : barberStats.filter((b: any) => b.id === selectedBarber)

  const chartData = barberStats.map((b: any) => ({ name: b.name.split(" ")[0], value: b.revenue }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filtrar Barbeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedBarber} onValueChange={setSelectedBarber}>
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.map((b: BarberOption) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {barbers.length === 0 ? (
        <EmptyState message="Nenhum barbeiro encontrado." />
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento por Barbeiro</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="divide-y rounded-lg border bg-white">
            {focused.map((b: any, i: number) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">#{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.totalAppts} agend. · {b.completedAppts} concluídos</p>
                  </div>
                </div>
                <div className="flex gap-6 pl-12 sm:pl-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Faturamento</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(b.revenue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Ticket Médio</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(b.avgTicket)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// TAB: POR SERVIÇO
// ─────────────────────────────────────────────────────────────────
function ServiceTab({ sales }: { sales: SaleRecord[] }) {
  const serviceMap: Record<string, { revenue: number; qty: number }> = {}
  sales.forEach(s => {
    const name = s.serviceName || "Serviço"
    if (!serviceMap[name]) serviceMap[name] = { revenue: 0, qty: 0 }
    serviceMap[name].revenue += parseFloat(s.totalAmount || "0")
    serviceMap[name].qty += 1
  })

  const totalRevenue = Object.values(serviceMap).reduce((acc, v) => acc + v.revenue, 0)
  const serviceData = Object.entries(serviceMap)
    .map(([name, v]) => ({ name, revenue: v.revenue, qty: v.qty, pct: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  if (serviceData.length === 0) return <EmptyState message="Nenhum serviço registrado ainda." />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Serviço</CardTitle>
            <PieChartIcon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={serviceData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }) => `${name.slice(0, 8)} ${pct.toFixed(0)}%`} labelLine={false}>
                  {serviceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento por Serviço</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviceData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {serviceData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ranking de Serviços</CardTitle>
          <Badge variant="secondary">{serviceData.length} serviços</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {serviceData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.qty} vendas · {s.pct.toFixed(1)}% do total</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-600">{formatCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// TAB: NO-SHOW
// ─────────────────────────────────────────────────────────────────
function NoShowTab({ appointments, periodPreset, setPeriodPreset, customStart, setCustomStart, customEnd, setCustomEnd, useCustom, setUseCustom, getPeriodRange, filterApptsByRange }: any) {
  const range = getPeriodRange()
  const filtered = appointments.filter((a: AppointmentRecord) => filterApptsByRange(a, range))

  const counts = {
    total: filtered.length,
    completed: filtered.filter((a: AppointmentRecord) => a.status === "completed" || a.status === "finished").length,
    confirmed: filtered.filter((a: AppointmentRecord) => a.status === "confirmed").length,
    inProgress: filtered.filter((a: AppointmentRecord) => a.status === "in_progress").length,
    cancelled: filtered.filter((a: AppointmentRecord) => a.status === "cancelled").length,
    noShow: filtered.filter((a: AppointmentRecord) => a.status === "no_show").length,
  }
  const noShowRate = counts.total > 0 ? (counts.noShow / counts.total) * 100 : 0
  const cancelRate = counts.total > 0 ? (counts.cancelled / counts.total) * 100 : 0
  const completionRate = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0

  const statusData = [
    { name: "Concluídos", value: counts.completed, color: "#10b981" },
    { name: "Confirmados", value: counts.confirmed, color: "#3b82f6" },
    { name: "Em andamento", value: counts.inProgress, color: "#f59e0b" },
    { name: "Cancelados", value: counts.cancelled, color: "#ef4444" },
    { name: "No-show", value: counts.noShow, color: "#6b7280" },
  ].filter(d => d.value > 0)

  const weeklyMap: Record<string, { noShow: number; total: number }> = {}
  filtered.forEach((a: AppointmentRecord) => {
    const weekStart = format(startOfWeek(parseISO(a.scheduledAt), { locale: ptBR }), "dd/MM")
    if (!weeklyMap[weekStart]) weeklyMap[weekStart] = { noShow: 0, total: 0 }
    weeklyMap[weekStart].total++
    if (a.status === "no_show") weeklyMap[weekStart].noShow++
  })
  const weeklyData = Object.entries(weeklyMap).map(([week, v]) => ({
    week,
    noShow: v.noShow,
    taxa: v.total > 0 ? parseFloat(((v.noShow / v.total) * 100).toFixed(1)) : 0,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filtro de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {PERIOD_PRESETS.map(p => (
              <Button
                key={p.value}
                size="sm"
                variant={!useCustom && periodPreset === p.value ? "default" : "outline"}
                className={!useCustom && periodPreset === p.value ? "bg-amber-600 hover:bg-amber-700" : ""}
                onClick={() => { setPeriodPreset(p.value); setUseCustom(false) }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Data início</Label>
              <Input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setUseCustom(true) }} className="h-9 text-sm w-36" />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Data fim</Label>
              <Input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setUseCustom(true) }} className="h-9 text-sm w-36" />
            </div>
            {useCustom && (
              <Button size="sm" variant="ghost" onClick={() => setUseCustom(false)} className="text-gray-500">Limpar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Agend." value={String(counts.total)} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={CheckCircle} label="Concluídos" value={`${completionRate.toFixed(1)}%`} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={XCircle} label="Cancelados" value={`${cancelRate.toFixed(1)}%`} color="text-red-500" bg="bg-red-50" />
        <StatCard icon={AlertCircle} label="Taxa No-show" value={`${noShowRate.toFixed(1)}%`} color="text-gray-600" bg="bg-gray-100" />
      </div>

      {statusData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status dos Agendamentos</CardTitle>
              <PieChartIcon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No-shows por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [v, n === "noShow" ? "No-shows" : "Taxa (%)"]} />
                    <Bar dataKey="noShow" name="noShow" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Sem dados semanais</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState message="Nenhum agendamento no período selecionado." />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Detalhamento por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Concluídos", count: counts.completed, color: "bg-green-500" },
              { label: "Confirmados", count: counts.confirmed, color: "bg-blue-500" },
              { label: "Em andamento", count: counts.inProgress, color: "bg-amber-500" },
              { label: "Cancelados", count: counts.cancelled, color: "bg-red-500" },
              { label: "No-show", count: counts.noShow, color: "bg-gray-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <span className="text-sm font-semibold">{count}</span>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {counts.total > 0 ? ((count / counts.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// EXPORTAR DADOS
// ─────────────────────────────────────────────────────────────────
function ExportSection({ sales, appointments, billingMonth, getPeriodRange, filterSalesByRange, filterApptsByRange }: any) {
  const [y, m] = billingMonth.split("-").map(Number)
  const monthStart = startOfMonth(new Date(y, m - 1, 1))
  const monthEnd = endOfMonth(new Date(y, m - 1, 1))

  const filteredSales = sales.filter((s: SaleRecord) => {
    const d = parseISO(s.createdAt)
    return isWithinInterval(d, { start: monthStart, end: monthEnd })
  })
  const filteredAppts = appointments.filter((a: AppointmentRecord) => {
    const d = parseISO(a.scheduledAt)
    return isWithinInterval(d, { start: monthStart, end: monthEnd })
  })

  const exportSales = () => {
    const rows = [
      ["Data", "Cliente", "Barbeiro", "Serviço", "Valor", "Método de Pagamento"],
      ...filteredSales.map((s: SaleRecord) => [
        format(parseISO(s.createdAt), "dd/MM/yyyy HH:mm"),
        s.clientName || "",
        s.barberName || "",
        s.serviceName || "",
        parseFloat(s.totalAmount || "0").toFixed(2).replace(".", ","),
        s.paymentMethod || "",
      ]),
    ]
    downloadCSV(rows, `vendas_${billingMonth}.csv`)
  }

  const exportAppointments = () => {
    const rows = [
      ["Data/Hora", "Cliente", "Barbeiro", "Serviço", "Status", "Valor"],
      ...filteredAppts.map((a: AppointmentRecord) => [
        format(parseISO(a.scheduledAt), "dd/MM/yyyy HH:mm"),
        a.client?.name || "",
        a.barber?.name || "",
        a.service?.name || "",
        a.status || "",
        parseFloat(a.totalPrice || "0").toFixed(2).replace(".", ","),
      ]),
    ]
    downloadCSV(rows, `agendamentos_${billingMonth}.csv`)
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Exportar Dados</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Exporta os dados do mês selecionado na aba "Faturamento"</p>
        </div>
        <Download className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={exportSales} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Vendas ({filteredSales.length})
          </Button>
          <Button variant="outline" size="sm" onClick={exportAppointments} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Agendamentos ({filteredAppts.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
        <div className={`p-1.5 rounded-md ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
      </CardContent>
    </Card>
  )
}
