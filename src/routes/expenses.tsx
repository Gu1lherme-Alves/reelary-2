import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, FormEvent } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Pencil,
  Tag,
  Search,
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Wallet,
  Sparkles,
  Check,
  X,
  PieChart as PieChartIcon,
  BarChart3,
  AlertCircle,
  FolderPlus,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Controle de Despesas — Reelary" }] }),
  component: () => (
    <AppShell>
      <ExpensesPage />
    </AppShell>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────────

type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
};

type Expense = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
  expense_categories?: {
    id: string;
    name: string;
    color: string;
  } | null;
};

// ─── Preset Color Palette ───────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#f97316", label: "Laranja" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#64748b", label: "Cinza" },
];

const DEFAULT_SUGGESTED_CATEGORIES = [
  { name: "Ferramentas & Softwares", color: "#f59e0b" },
  { name: "Proxies & IPs", color: "#3b82f6" },
  { name: "Contas de Instagram", color: "#ec4899" },
  { name: "Servidores & VPS", color: "#8b5cf6" },
  { name: "Tráfego & Anúncios", color: "#10b981" },
  { name: "Outros", color: "#64748b" },
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Helper to format currency in BRL
function formatBRL(value: number | null | undefined): string {
  if (typeof value !== "number" || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ─── Custom Chart Tooltip ───────────────────────────────────────────────────────

function CustomChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3 shadow-2xl text-xs max-w-xs z-50">
      <div className="flex items-center justify-between gap-3 border-b border-[#27272a] pb-2 mb-2">
        <span className="font-semibold text-zinc-300">{data.formattedDate}</span>
        <span className="font-bold text-amber-400">{formatBRL(data.amount)}</span>
      </div>
      {data.items && data.items.length > 0 ? (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {data.items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-zinc-400">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: item.expense_categories?.color || "#f59e0b",
                  }}
                />
                <span className="truncate">{item.title}</span>
              </div>
              <span className="font-medium text-zinc-200 shrink-0">
                {formatBRL(Number(item.amount))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-zinc-500 italic">Nenhum gasto neste dia</span>
      )}
    </div>
  );
}

// ─── Main Expenses Page ─────────────────────────────────────────────────────────

function ExpensesPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal: Create / Edit Expense
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>("none");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  // Modal: Categories Management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0].value);
  const [savingCategory, setSavingCategory] = useState(false);

  // ─── Load Data ────────────────────────────────────────────────────────────────

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      return data || [];
    } catch (err: any) {
      console.error("Error loading expense categories:", err);
      return [];
    }
  }

  async function loadExpenses() {
    setLoading(true);
    try {
      // Build start and end dates for selected month
      const startOfMonth = new Date(selectedYear, selectedMonth, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

      const startDateStr = startOfMonth.toISOString().split("T")[0];
      const endDateStr = endOfMonth.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(id, name, color)")
        .gte("expense_date", startDateStr)
        .lte("expense_date", endDateStr)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses((data as any) || []);
    } catch (err: any) {
      console.error("Error loading expenses:", err);
      toast.error("Erro ao carregar despesas: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const cats = await loadCategories();
      await loadExpenses();

      // If user has zero categories, seed default categories automatically
      if (cats && cats.length === 0) {
        seedDefaultCategories();
      }
    }
    init();
  }, [selectedYear, selectedMonth]);

  async function seedDefaultCategories() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const toInsert = DEFAULT_SUGGESTED_CATEGORIES.map((c) => ({
        user_id: uid,
        name: c.name,
        color: c.color,
      }));

      const { error } = await supabase.from("expense_categories").insert(toInsert);
      if (!error) {
        await loadCategories();
      }
    } catch (err) {
      console.error("Could not seed default categories:", err);
    }
  }

  // ─── Period Navigation ────────────────────────────────────────────────────────

  function prevMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }

  function goToCurrentMonth() {
    const current = new Date();
    setSelectedYear(current.getFullYear());
    setSelectedMonth(current.getMonth());
  }

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  // ─── Expense CRUD ─────────────────────────────────────────────────────────────

  function openNewExpenseModal() {
    setEditingExpense(null);
    setExpenseTitle("");
    setExpenseAmount("");
    // Default date is today if looking at current month, or 1st of viewed month
    if (isCurrentMonth) {
      setExpenseDate(new Date().toISOString().split("T")[0]);
    } else {
      const pad = (n: number) => String(n).padStart(2, "0");
      setExpenseDate(`${selectedYear}-${pad(selectedMonth + 1)}-01`);
    }
    setExpenseCategoryId("none");
    setExpenseNotes("");
    setShowExpenseModal(true);
  }

  function openEditExpenseModal(exp: Expense) {
    setEditingExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseAmount(String(exp.amount));
    setExpenseDate(exp.expense_date);
    setExpenseCategoryId(exp.category_id || "none");
    setExpenseNotes(exp.notes || "");
    setShowExpenseModal(true);
  }

  async function handleExpenseSubmit(e: FormEvent) {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      toast.error("Informe a descrição/título da despesa.");
      return;
    }

    // Parse amount supporting comma or dot
    const cleanAmount = parseFloat(expenseAmount.replace(",", "."));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      toast.error("Informe um valor válido e maior que zero.");
      return;
    }

    if (!expenseDate) {
      toast.error("Selecione a data da despesa.");
      return;
    }

    setSavingExpense(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = {
        user_id: uid,
        title: expenseTitle.trim(),
        amount: cleanAmount,
        expense_date: expenseDate,
        category_id: expenseCategoryId === "none" ? null : expenseCategoryId,
        notes: expenseNotes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", editingExpense.id);
        if (error) throw error;
        toast.success("Despesa atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
        toast.success("Despesa registrada com sucesso!");
      }

      setShowExpenseModal(false);
      await loadExpenses();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      toast.error(err.message || "Erro ao salvar despesa");
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(exp: Expense) {
    if (!confirm(`Deseja excluir a despesa "${exp.title}" (${formatBRL(exp.amount)})?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", exp.id);
      if (error) throw error;
      toast.success("Despesa excluída com sucesso!");
      await loadExpenses();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir despesa");
    }
  }

  // ─── Category CRUD ──────────────────────────────────────────────────────────

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryColor(CATEGORY_COLORS[0].value);
    setShowCategoryModal(true);
  }

  function openEditCategory(cat: ExpenseCategory) {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryColor(cat.color);
    setShowCategoryModal(true);
  }

  async function handleCategorySubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Digite o nome da categoria.");
      return;
    }

    setSavingCategory(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error("Sessão expirada.");

      if (editingCategory) {
        const { error } = await supabase
          .from("expense_categories")
          .update({ name: categoryName.trim(), color: categoryColor })
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast.success(`Categoria "${categoryName.trim()}" atualizada!`);
      } else {
        const { data, error } = await supabase
          .from("expense_categories")
          .insert({
            user_id: uid,
            name: categoryName.trim(),
            color: categoryColor,
          })
          .select("id")
          .single();
        if (error) throw error;
        toast.success(`Categoria "${categoryName.trim()}" criada!`);

        // If expense modal was open, auto-select this new category
        if (showExpenseModal && data) {
          setExpenseCategoryId(data.id);
        }
      }

      setShowCategoryModal(false);
      await Promise.all([loadCategories(), loadExpenses()]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar categoria");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(cat: ExpenseCategory) {
    if (
      !confirm(
        `Excluir a categoria "${cat.name}"? As despesas vinculadas a ela não serão apagadas, mas ficarão sem categoria.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", cat.id);
      if (error) throw error;
      toast.success(`Categoria "${cat.name}" excluída.`);
      await Promise.all([loadCategories(), loadExpenses()]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir categoria");
    }
  }

  // ─── Filtered Expenses & Calculations ─────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Category filter
      if (categoryFilter !== "all") {
        if (categoryFilter === "none" && exp.category_id !== null) return false;
        if (categoryFilter !== "none" && exp.category_id !== categoryFilter) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesNotes = exp.notes?.toLowerCase().includes(q) ?? false;
        const matchesCategory =
          exp.expense_categories?.name.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesNotes && !matchesCategory) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, searchQuery]);

  // Total for the entire month
  const totalMonthAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  // Filtered total
  const filteredTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  // Daily Chart Data Generator for the selected month
  const chartData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const pad = (n: number) => String(n).padStart(2, "0");

    // Group expenses by day
    const expensesByDay: Record<string, { total: number; items: Expense[] }> = {};
    for (const exp of expenses) {
      const datePart = exp.expense_date; // "YYYY-MM-DD"
      if (!expensesByDay[datePart]) {
        expensesByDay[datePart] = { total: 0, items: [] };
      }
      expensesByDay[datePart].total += Number(exp.amount || 0);
      expensesByDay[datePart].items.push(exp);
    }

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(day)}`;
      const dayData = expensesByDay[dateStr] || { total: 0, items: [] };
      const formattedDate = `${pad(day)}/${pad(selectedMonth + 1)}`;

      data.push({
        day,
        label: `Dia ${day}`,
        formattedDate: `${pad(day)} de ${MONTH_NAMES[selectedMonth]}`,
        amount: dayData.total,
        items: dayData.items,
      });
    }

    return data;
  }, [expenses, selectedYear, selectedMonth]);

  // Find day with highest expense
  const maxDaySpending = useMemo(() => {
    let max = 0;
    let maxDayLabel = "";
    chartData.forEach((d) => {
      if (d.amount > max) {
        max = d.amount;
        maxDayLabel = d.formattedDate;
      }
    });
    return { max, label: maxDayLabel };
  }, [chartData]);

  // Daily average
  const dailyAverage = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return totalMonthAmount / daysInMonth;
  }, [totalMonthAmount, selectedYear, selectedMonth]);

  // Category breakdown for summary progress bars
  const categoryBreakdown = useMemo(() => {
    const map: Record<
      string,
      { name: string; color: string; total: number; count: number }
    > = {};

    expenses.forEach((exp) => {
      const catId = exp.category_id || "uncategorized";
      const catName = exp.expense_categories?.name || "Sem Categoria";
      const catColor = exp.expense_categories?.color || "#71717a";

      if (!map[catId]) {
        map[catId] = { name: catName, color: catColor, total: 0, count: 0 };
      }
      map[catId].total += Number(exp.amount || 0);
      map[catId].count += 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header & Top Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f1f23] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Controle de Despesas
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Financeiro
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Gerencie custos com contas, proxies, ferramentas e acompanhe seus gastos diários.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCategoryModal(true)}
            className="border-[#27272a] bg-[#141417] hover:bg-[#1f1f24] text-zinc-300 text-xs gap-1.5 h-9"
          >
            <Tag className="size-3.5 text-amber-400" />
            Categorias
            {categories.length > 0 && (
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                {categories.length}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            onClick={openNewExpenseModal}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs gap-1.5 h-9 shadow-lg shadow-amber-500/10"
          >
            <Plus className="size-4 stroke-[2.5]" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* ─── Period Selector (Month / Year) ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111114] border border-[#1f1f23] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="size-8 text-zinc-400 hover:text-white hover:bg-[#1a1a1f]"
            title="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2 px-2">
            <CalendarIcon className="size-4 text-amber-400" />
            <span className="text-sm font-bold text-white tracking-wide">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="size-8 text-zinc-400 hover:text-white hover:bg-[#1a1a1f]"
            title="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="text-xs h-7 border-[#27272a] bg-[#16161a] text-zinc-300 hover:text-white"
            >
              Ir para Mês Atual
            </Button>
          )}

          <div className="text-xs text-zinc-400 bg-[#16161a] px-3 py-1 rounded-md border border-[#27272a]">
            Total do Mês:{" "}
            <span className="font-bold text-amber-400">{formatBRL(totalMonthAmount)}</span>
          </div>
        </div>
      </div>

      {/* ─── Metrics Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gasto no Mês */}
        <div className="bg-[#111114] border border-[#1f1f23] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Gasto</span>
            <div className="size-7 rounded-md bg-amber-500/10 text-amber-400 grid place-items-center">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatBRL(totalMonthAmount)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {expenses.length} {expenses.length === 1 ? "lançamento" : "lançamentos"} em{" "}
            {MONTH_NAMES[selectedMonth]}
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl pointer-events-none" />
        </div>

        {/* Média Diária */}
        <div className="bg-[#111114] border border-[#1f1f23] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Média Diária</span>
            <div className="size-7 rounded-md bg-blue-500/10 text-blue-400 grid place-items-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatBRL(dailyAverage)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Gasto médio por dia no mês
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl pointer-events-none" />
        </div>

        {/* Pico de Gasto */}
        <div className="bg-[#111114] border border-[#1f1f23] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Maior Dia de Gasto</span>
            <div className="size-7 rounded-md bg-rose-500/10 text-rose-400 grid place-items-center">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatBRL(maxDaySpending.max)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            {maxDaySpending.max > 0 ? maxDaySpending.label : "Sem gastos no período"}
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl pointer-events-none" />
        </div>

        {/* Categorias Ativas */}
        <div className="bg-[#111114] border border-[#1f1f23] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Categorias</span>
            <div className="size-7 rounded-md bg-emerald-500/10 text-emerald-400 grid place-items-center">
              <Tag className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {categoryBreakdown.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {categories.length} cadastradas no total
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* ─── Monthly Chart & Category Breakdown ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Bar Chart (2 columns) */}
        <div className="lg:col-span-2 bg-[#111114] border border-[#1f1f23] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-400" />
                Gastos Diários em {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Passe o mouse sobre as barras para ver os detalhes e itens de cada dia.
              </p>
            </div>
            <div className="text-xs font-semibold text-zinc-400 bg-[#16161a] border border-[#27272a] px-2.5 py-1 rounded">
              {new Date(selectedYear, selectedMonth + 1, 0).getDate()} dias
            </div>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, index) => {
                    const isPeak = maxDaySpending.max > 0 && entry.amount === maxDaySpending.max;
                    const hasSpending = entry.amount > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPeak ? "#f59e0b" : hasSpending ? "#f59e0bCC" : "#27272a40"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (1 column) */}
        <div className="bg-[#111114] border border-[#1f1f23] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChartIcon className="size-4 text-amber-400" />
                Por Categoria
              </h2>
              <span className="text-[11px] text-zinc-400 font-medium">
                {totalMonthAmount > 0 ? "100%" : "0%"}
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Nenhuma despesa registrada neste mês.
              </div>
            ) : (
              <div className="space-y-3 mt-4 max-h-56 overflow-y-auto pr-1">
                {categoryBreakdown.map((cat, idx) => {
                  const percent = totalMonthAmount > 0 ? (cat.total / totalMonthAmount) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-zinc-300">
                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate font-medium">{cat.name}</span>
                          <span className="text-[10px] text-zinc-500">({cat.count})</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-white">{formatBRL(cat.total)}</span>
                          <span className="text-[10px] text-zinc-400 w-10 text-right">
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-[#1e1e24] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(percent, 2)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCategoryModal(true)}
            className="w-full mt-4 text-xs text-zinc-400 hover:text-white border border-[#27272a] bg-[#16161a] hover:bg-[#1f1f24]"
          >
            Gerenciar Categorias
          </Button>
        </div>
      </div>

      {/* ─── Expenses List / Table Section ───────────────────────────────────── */}
      <div className="bg-[#111114] border border-[#1f1f23] rounded-xl overflow-hidden">
        {/* Filters and search header */}
        <div className="p-4 border-b border-[#1f1f23] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h3 className="text-sm font-bold text-white whitespace-nowrap">
              Lançamentos ({filteredExpenses.length})
            </h3>
            {categoryFilter !== "all" || searchQuery.trim() ? (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Filtro ativo: {formatBRL(filteredTotalAmount)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="size-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar despesa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 bg-[#161619] border-[#27272a] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-amber-500/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category Select Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 h-8 text-xs bg-[#161619] border-[#27272a] text-zinc-300">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="bg-[#161619] border-[#27272a] text-zinc-300">
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={openNewExpenseModal}
              className="h-8 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs gap-1 shadow"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
            <div className="size-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Carregando despesas...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-3">
            <div className="size-10 rounded-full bg-[#18181c] border border-[#27272a] grid place-items-center text-zinc-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-300">Nenhuma despesa encontrada</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                {searchQuery || categoryFilter !== "all"
                  ? "Tente ajustar os filtros acima."
                  : `Nenhum gasto registrado em ${MONTH_NAMES[selectedMonth]} de ${selectedYear}.`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={openNewExpenseModal}
              className="mt-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold gap-1.5"
            >
              <Plus className="size-3.5" />
              Adicionar Primeiro Gasto
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f23] text-zinc-500 uppercase tracking-wider text-[10px] bg-[#141417]/50">
                  <th className="py-2.5 px-4 font-semibold">Data</th>
                  <th className="py-2.5 px-4 font-semibold">Descrição</th>
                  <th className="py-2.5 px-4 font-semibold">Categoria</th>
                  <th className="py-2.5 px-4 font-semibold">Observações</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Valor</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {filteredExpenses.map((exp) => {
                  const [y, m, d] = exp.expense_date.split("-");
                  const formattedDate = `${d}/${m}/${y}`;
                  const cat = exp.expense_categories;

                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-[#16161a] transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="size-3 text-zinc-600" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-4 font-semibold text-white">
                        <span className="line-clamp-1">{exp.title}</span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {cat ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border transition"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              borderColor: `${cat.color}35`,
                              color: cat.color,
                            }}
                          >
                            <span
                              className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 italic">
                            Sem categoria
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate text-[11px]">
                        {exp.notes ? (
                          <span className="text-zinc-400 italic">"{exp.notes}"</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-bold text-white whitespace-nowrap text-sm">
                        <span className="text-amber-400 font-mono">
                          {formatBRL(Number(exp.amount))}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditExpenseModal(exp)}
                            className="size-7 text-zinc-400 hover:text-white hover:bg-[#202026]"
                            title="Editar despesa"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExpense(exp)}
                            className="size-7 text-zinc-400 hover:text-rose-400 hover:bg-[#202026]"
                            title="Excluir despesa"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Novo / Editar Lançamento ──────────────────────────────── */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="bg-[#111114] border-[#27272a] text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <Receipt className="size-4 text-amber-400" />
              {editingExpense ? "Editar Despesa" : "Novo Lançamento de Despesa"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Preencha os dados do gasto para registrar no controle financeiro.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExpenseSubmit} className="space-y-4 mt-2">
            {/* Title / Description */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300 font-medium">
                Descrição da Despesa <span className="text-amber-400">*</span>
              </Label>
              <Input
                placeholder="Ex: Compra de 20 contas Instagram, Proxies..."
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="bg-[#161619] border-[#27272a] text-xs text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/30"
                required
              />
            </div>

            {/* Amount and Date in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Valor */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">
                  Valor (R$) <span className="text-amber-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="pl-8 bg-[#161619] border-[#27272a] text-xs font-semibold text-white focus-visible:ring-amber-500/30"
                    required
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">
                  Data <span className="text-amber-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="bg-[#161619] border-[#27272a] text-xs text-white focus-visible:ring-amber-500/30"
                  required
                />
              </div>
            </div>

            {/* Category Select with quick creation button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-300 font-medium">Categoria</Label>
                <button
                  type="button"
                  onClick={() => {
                    openCreateCategory();
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Plus className="size-3" />
                  Nova Categoria
                </button>
              </div>
              <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                <SelectTrigger className="bg-[#161619] border-[#27272a] text-xs text-white h-9">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#161619] border-[#27272a] text-zinc-200">
                  <SelectItem value="none">
                    <span className="text-zinc-500 italic">Sem categoria</span>
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações / Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300 font-medium">
                Observações <span className="text-zinc-500 text-[10px]">(Opcional)</span>
              </Label>
              <Textarea
                placeholder="Ex: Pagamento via Pix, comprovante arquivado, etc."
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="bg-[#161619] border-[#27272a] text-xs text-white placeholder:text-zinc-600 resize-none h-20 focus-visible:ring-amber-500/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f23]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowExpenseModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingExpense}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs gap-1.5 shadow"
              >
                {savingExpense ? (
                  <div className="size-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Check className="size-3.5 stroke-[2.5]" />
                )}
                {editingExpense ? "Salvar Alterações" : "Adicionar Despesa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Gerenciar Categorias ──────────────────────────────────── */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="bg-[#111114] border-[#27272a] text-zinc-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base">
              <Tag className="size-4 text-amber-400" />
              Categorias de Despesas
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Crie categorias com cores personalizadas para classificar seus custos.
            </DialogDescription>
          </DialogHeader>

          {/* Create or Edit Category Form */}
          <form
            onSubmit={handleCategorySubmit}
            className="p-3 bg-[#161619] border border-[#27272a] rounded-lg space-y-3 mt-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FolderPlus className="size-3.5 text-amber-400" />
                {editingCategory ? `Editar: "${editingCategory.name}"` : "Adicionar Nova Categoria"}
              </span>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategoryColor(CATEGORY_COLORS[0].value);
                  }}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                placeholder="Nome da categoria (Ex: Proxies, Chips 4G, Ferramentas)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="bg-[#111114] border-[#27272a] text-xs text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/30 h-8"
                required
              />
            </div>

            {/* Color Palette Picker */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-zinc-400">Escolha uma Cor</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCategoryColor(c.value)}
                    className="size-6 rounded-full transition-transform flex items-center justify-center cursor-pointer border"
                    style={{
                      backgroundColor: c.value,
                      borderColor:
                        categoryColor === c.value ? "#ffffff" : "transparent",
                      transform: categoryColor === c.value ? "scale(1.15)" : "scale(1)",
                    }}
                    title={c.label}
                  >
                    {categoryColor === c.value && (
                      <Check className="size-3.5 text-white stroke-[3] drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={savingCategory}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-8 gap-1 shadow"
            >
              {savingCategory ? (
                <div className="size-3 border-2 border-black border-t-transparent animate-spin rounded-full" />
              ) : (
                <Check className="size-3.5 stroke-[2.5]" />
              )}
              {editingCategory ? "Atualizar Categoria" : "Salvar Categoria"}
            </Button>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-1 mt-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
              Categorias Existentes ({categories.length})
            </span>

            {categories.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Nenhuma categoria cadastrada ainda.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded bg-[#161619] border border-[#27272a] text-xs hover:border-[#3f3f46] transition"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-white">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditCategory(cat)}
                        className="size-6 text-zinc-400 hover:text-white"
                        title="Editar nome ou cor"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat)}
                        className="size-6 text-zinc-400 hover:text-rose-400"
                        title="Excluir categoria"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

