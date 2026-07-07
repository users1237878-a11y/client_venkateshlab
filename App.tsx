import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Student, PaymentRecord, ViewState, Expense } from './types';
import { getStudents, saveStudents, exportData, importData } from './services/storage';
import TableGrid from './components/TableGrid';
import StudentForm from './components/StudentForm';
import StudentDetails from './components/StudentDetails';
import { AppIcon } from './components/AppIcon';
import { SplashScreen } from './components/SplashScreen';
import FloatingBubbleBackground from './components/FloatingBubbleBackground';
import { motion, AnimatePresence } from 'motion/react';
import { 
  subscribeToStudents, 
  fbSaveStudent, 
  fbDeleteStudent,
  subscribeToDeletedStudents,
  fbSaveDeletedStudent,
  DeletedStudent
} from './services/firebase';
import { 
  Users, 
  LayoutGrid, 
  BarChart3, 
  Search, 
  Plus, 
  Library,
  Bell,
  Wallet,
  IndianRupee,
  PieChart,
  ArrowUpRight,
  Code,
  Heart,
  Trash2,
  Eye,
  MessageCircle,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Filter,
  Calendar as CalendarIcon,
  Settings,
  Database,
  Download,
  Upload,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Layers,
  Cloud,
  Sparkles,
  FileText,
  TrendingUp,
  Activity,
  Percent
} from 'lucide-react';

type DateRange = 'this-month' | 'last-month' | 'all-time' | 'custom';
type PaymentModeFilter = 'all' | 'Cash' | 'Online';
type SortKey = 'name' | 'tableNumber' | 'nextDueDate';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>([]);
  const hasCleanedUp = useRef(false);
  const [view, setView] = useState<ViewState>('grid');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  
  // Analytical Filters
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentModeFilter>('all');

  // Transaction history filter states for last 2 months list
  const [txSearch, setTxSearch] = useState('');
  const [txMode, setTxMode] = useState<'all' | 'Cash' | 'Online'>('all');

  const currentMonthName = useMemo(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthNames[new Date().getMonth()];
  }, []);

  const prevMonthName = useMemo(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const prevIdx = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
    return monthNames[prevIdx];
  }, []);

  // Expense Management State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('shrivenkatesh_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Expense Form State
  const [expCategory, setExpCategory] = useState('💡 Light Bill');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Persist expenses in local storage
  useEffect(() => {
    localStorage.setItem('shrivenkatesh_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const performTransactionCleanup = async (currentStudents: Student[]) => {
    const now = new Date();
    // Start of the previous month
    const thresholdDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    for (const student of currentStudents) {
      if (!student.paymentHistory || student.paymentHistory.length === 0) continue;
      
      // Filter out payment records that are older than the threshold date
      const filteredHistory = student.paymentHistory.filter(p => {
        if (!p.date) return false;
        const pDate = new Date(p.date);
        return pDate >= thresholdDate;
      });
      
      // If we deleted some previous month history, update the student in Firestore
      if (filteredHistory.length !== student.paymentHistory.length) {
        const updatedStudent: Student = {
          ...student,
          paymentHistory: filteredHistory
        };
        try {
          await fbSaveStudent(updatedStudent);
          console.log(`Cleaned up old transaction history for student: ${student.name}`);
        } catch (err) {
          console.error(`Failed to clean up transactions for student ${student.name}:`, err);
        }
      }
    }
  };

  // Single robust hook to listen to Real-time Firestore
  useEffect(() => {
    setIsLoading(true);
    
    // Start listening to live updates from the shared Firestore 'students' collection
    const unsubscribe = subscribeToStudents(
      async (cloudStudents) => {
        setStudents(cloudStudents);
        setIsLoading(false);

        // Only run cleanup once per session to avoid infinite loops and duplicate checks
        if (!hasCleanedUp.current && cloudStudents && cloudStudents.length > 0) {
          hasCleanedUp.current = true;
          await performTransactionCleanup(cloudStudents);
        }
      },
      (error) => {
        console.error("Firestore synchronisation failed:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Single robust hook to listen to Real-time Deleted Students Firestore
  useEffect(() => {
    const unsubscribe = subscribeToDeletedStudents(
      (cloudDeletedStudents) => {
        setDeletedStudents(cloudDeletedStudents || []);
      },
      (error) => {
        console.error("Firestore deleted students synchronisation failed:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const getYearAndMonth = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return { year: 0, month: 0 };
      const parts = dateStr.split('T')[0].split('-');
      return {
        year: parseInt(parts[0], 10) || 0,
        month: (parseInt(parts[1], 10) - 1) ?? 0
      };
    };

    const filterPayment = (p: PaymentRecord) => {
      if (!p || !p.date || typeof p.date !== 'string') return false;
      const pDateStr = p.date.split('T')[0];
      let datePass = true;
      if (dateRange === 'this-month') {
        const parsed = getYearAndMonth(p.date);
        datePass = parsed.year === currentYear && parsed.month === currentMonth;
      } else if (dateRange === 'last-month') {
        const parsed = getYearAndMonth(p.date);
        datePass = parsed.year === prevYear && parsed.month === prevMonth;
      } else if (dateRange === 'custom') {
        if (startDate) datePass = datePass && pDateStr >= startDate;
        if (endDate) datePass = datePass && pDateStr <= endDate;
      }

      let modePass = true;
      if (paymentModeFilter !== 'all') {
        modePass = p.mode === paymentModeFilter;
      }

      return datePass && modePass;
    };

    const total = students.length;
    const overdue = students.filter(s => s.nextDueDate && new Date(s.nextDueDate) < new Date()).length;
    const monthlyRevenue = students.reduce((acc, curr) => acc + (curr.monthlyFee || 0), 0);
    
    const allFilteredPayments = students.flatMap(s => s.paymentHistory || []).filter(filterPayment);
    const totalCash = allFilteredPayments.filter(p => p && p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0);
    const totalOnline = allFilteredPayments.filter(p => p && p.mode === 'Online').reduce((sum, p) => sum + p.amount, 0);

    const studentCollections = students.map(s => {
      const filteredStudentPayments = (s.paymentHistory || []).filter(filterPayment);
      const cash = filteredStudentPayments.filter(p => p && p.mode === 'Cash').reduce((sum, p) => sum + p.amount, 0);
      const online = filteredStudentPayments.filter(p => p && p.mode === 'Online').reduce((sum, p) => sum + p.amount, 0);
      return {
        id: s.id,
        name: s.name,
        table: s.tableNumber,
        cash,
        online,
        total: cash + online
      };
    }).sort((a, b) => b.total - a.total);

    const recentPayments = students
      .flatMap(s => s.paymentHistory || [])
      .filter(filterPayment)
      .sort((a, b) => {
        const timeA = a && a.date ? new Date(a.date).getTime() : 0;
        const timeB = b && b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 4);

    const activeTx = students.flatMap(s => 
      (s.paymentHistory || []).map(p => ({ 
        id: p.id,
        amount: p.amount,
        date: p.date,
        mode: p.mode,
        forMonth: p.forMonth,
        studentName: s.name,
        tableNumber: s.tableNumber,
        isDeletedStudent: false
      }))
    );

    const deletedTx = (deletedStudents || []).flatMap(s => 
      (s.p || []).map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        mode: p.mode,
        forMonth: p.forMonth,
        studentName: s.n + " (Deleted)",
        tableNumber: s.t,
        isDeletedStudent: true
      }))
    );

    const twoMonthsPayments = [...activeTx, ...deletedTx]
      .filter(p => {
        if (!p || !p.date) return false;
        const parsed = getYearAndMonth(p.date);
        const isCurrentMonth = parsed.year === currentYear && parsed.month === currentMonth;
        const isPrevMonth = parsed.year === prevYear && parsed.month === prevMonth;
        return isCurrentMonth || isPrevMonth;
      })
      .sort((a, b) => {
        const timeA = a && a.date ? new Date(a.date).getTime() : 0;
        const timeB = b && b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });

    const currentMonthSum = twoMonthsPayments
      .filter(p => {
        const parsed = getYearAndMonth(p.date);
        return parsed.year === currentYear && parsed.month === currentMonth;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const prevMonthSum = twoMonthsPayments
      .filter(p => {
        const parsed = getYearAndMonth(p.date);
        return parsed.year === prevYear && parsed.month === prevMonth;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const filterExpense = (e: Expense) => {
      if (!e || !e.date || typeof e.date !== 'string') return false;
      const eDateStr = e.date.split('T')[0];
      let datePass = true;
      if (dateRange === 'this-month') {
        const parsed = getYearAndMonth(e.date);
        datePass = parsed.year === currentYear && parsed.month === currentMonth;
      } else if (dateRange === 'last-month') {
        const parsed = getYearAndMonth(e.date);
        datePass = parsed.year === prevYear && parsed.month === prevMonth;
      } else if (dateRange === 'custom') {
        if (startDate) datePass = datePass && eDateStr >= startDate;
        if (endDate) datePass = datePass && eDateStr <= endDate;
      }
      return datePass;
    };

    const filteredExpenses = expenses.filter(filterExpense);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = (totalCash + totalOnline) - totalExpenses;

    return { 
      total, 
      overdue, 
      monthlyRevenue, 
      totalCash, 
      totalOnline, 
      studentCollections, 
      recentPayments,
      twoMonthsPayments,
      currentMonthSum,
      prevMonthSum,
      filteredExpenses,
      totalExpenses,
      profit
    };
  }, [students, deletedStudents, dateRange, startDate, endDate, paymentModeFilter, expenses]);

  const zoneStats = useMemo(() => {
    const zones = [
      { name: "Tables 10-18", start: 10, end: 18, bgSoft: "bg-indigo-50/85", text: "text-indigo-800", border: "border-indigo-150", bg: "from-indigo-400 to-indigo-650", icon: "⚡" },
      { name: "Tables 19-27", start: 19, end: 27, bgSoft: "bg-purple-50/85", text: "text-purple-800", border: "border-purple-150", bg: "from-purple-400 to-purple-650", icon: "🔮" },
      { name: "Tables 28-36", start: 28, end: 36, bgSoft: "bg-pink-50/85", text: "text-pink-800", border: "border-pink-150", bg: "from-pink-400 to-pink-650", icon: "💖" },
      { name: "Tables 37-42", start: 37, end: 42, bgSoft: "bg-blue-50/85", text: "text-blue-800", border: "border-blue-150", bg: "from-blue-400 to-blue-650", icon: "⚓" },
      { name: "Tables 43-51", start: 43, end: 51, bgSoft: "bg-emerald-50/85", text: "text-emerald-800", border: "border-emerald-150", bg: "from-emerald-400 to-emerald-650", icon: "🍀" },
      { name: "Tables 52-60", start: 52, end: 60, bgSoft: "bg-amber-50/85", text: "text-amber-800", border: "border-amber-150", bg: "from-amber-400 to-amber-650", icon: "🍊" },
    ];

    return zones.map(z => {
      let occupiedCount = 0;
      let overdueCount = 0;
      for (let i = z.start; i <= z.end; i++) {
        const student = students.find(s => s.tableNumber === i);
        if (student) {
          occupiedCount++;
          const isOverdue = new Date(student.nextDueDate) < new Date();
          if (isOverdue) {
            overdueCount++;
          }
        }
      }
      const totalSeats = z.end - z.start + 1;
      const pct = Math.round((occupiedCount / totalSeats) * 100) || 0;
      return {
        ...z,
        occupiedCount,
        totalSeats,
        overdueCount,
        pct
      };
    });
  }, [students]);

  const displayTransactions = useMemo(() => {
    return stats.twoMonthsPayments.filter((p: any) => {
      const matchesSearch = !txSearch || 
        (p.studentName || '').toLowerCase().includes(txSearch.toLowerCase()) ||
        String(p.tableNumber || '').includes(txSearch) ||
        String(p.amount || '').includes(txSearch);
        
      const matchesMode = txMode === 'all' || p.mode === txMode;
      return matchesSearch && matchesMode;
    });
  }, [stats.twoMonthsPayments, txSearch, txMode]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const payments = stats.twoMonthsPayments;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const currentMonthName = monthNames[currentMonth];
    const prevMonthName = monthNames[prevMonth];

    const getYearAndMonthHelper = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return { year: 0, month: 0 };
      const parts = dateStr.split('T')[0].split('-');
      return {
        year: parseInt(parts[0], 10) || 0,
        month: (parseInt(parts[1], 10) - 1) ?? 0
      };
    };

    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const onlinePayments = payments.filter(p => p.mode === 'Online');
    const cashPayments = payments.filter(p => p.mode === 'Cash');
    const onlineTotal = onlinePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const cashTotal = cashPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const ongoingOnline = payments
      .filter(p => {
        const parsed = getYearAndMonthHelper(p.date);
        return parsed.year === currentYear && parsed.month === currentMonth && p.mode === 'Online';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const ongoingCash = payments
      .filter(p => {
        const parsed = getYearAndMonthHelper(p.date);
        return parsed.year === currentYear && parsed.month === currentMonth && p.mode === 'Cash';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const prevOnline = payments
      .filter(p => {
        const parsed = getYearAndMonthHelper(p.date);
        return parsed.year === prevYear && parsed.month === prevMonth && p.mode === 'Online';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const prevCash = payments
      .filter(p => {
        const parsed = getYearAndMonthHelper(p.date);
        return parsed.year === prevYear && parsed.month === prevMonth && p.mode === 'Cash';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const drawPageHeader = (pageNumber: number) => {
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.line(15, 12, 195, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("ATHERON LABS", 15, 19);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("STUDY LAB MANAGEMENT SYSTEMS", 15, 23);

      doc.setFontSize(8);
      doc.text(`Page ${pageNumber}`, 180, 19);
      doc.text(`Generated: ${now.toLocaleString()}`, 145, 23);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 26, 195, 26);
    };

    drawPageHeader(1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text("FINANCIAL PERFORMANCE REPORT", 15, 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Auditing Period: ${prevMonthName} ${prevYear} (Last Month) & ${currentMonthName} ${currentYear} (Ongoing Month)`, 15, 41);

    const boxY = 46;
    const boxHeight = 22;
    const boxWidth = 54;

    doc.setFillColor(248, 250, 252);
    doc.rect(15, boxY, boxWidth, boxHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, boxY, boxWidth, boxHeight, "D");
    doc.setFillColor(59, 130, 246);
    doc.rect(15, boxY, boxWidth, 1.5, "F");

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL REVENUE", 19, boxY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${totalCollected.toLocaleString()}`, 19, boxY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`${payments.length} Success Transactions`, 19, boxY + 18);

    const card2X = 15 + boxWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.rect(card2X, boxY, boxWidth, boxHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(card2X, boxY, boxWidth, boxHeight, "D");
    doc.setFillColor(16, 185, 129);
    doc.rect(card2X, boxY, boxWidth, 1.5, "F");

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ONLINE PAYMENTS", card2X + 4, boxY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${onlineTotal.toLocaleString()}`, card2X + 4, boxY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const onlinePct = totalCollected > 0 ? Math.round((onlineTotal / totalCollected) * 100) : 0;
    doc.text(`${onlinePayments.length} Payments (${onlinePct}%)`, card2X + 4, boxY + 18);

    const card3X = card2X + boxWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.rect(card3X, boxY, boxWidth, boxHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(card3X, boxY, boxWidth, boxHeight, "D");
    doc.setFillColor(245, 158, 11);
    doc.rect(card3X, boxY, boxWidth, 1.5, "F");

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CASH PAYMENTS", card3X + 4, boxY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`INR ${cashTotal.toLocaleString()}`, card3X + 4, boxY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const cashPct = totalCollected > 0 ? Math.round((cashTotal / totalCollected) * 100) : 0;
    doc.text(`${cashPayments.length} Payments (${cashPct}%)`, card3X + 4, boxY + 18);

    const chartY = 75;
    const chartHeight = 44;
    const chartWidth = 180;

    doc.setFillColor(248, 250, 252);
    doc.rect(15, chartY, chartWidth, chartHeight + 10, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, chartY, chartWidth, chartHeight + 10, "D");

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("MONTH-OVER-MONTH PERFORMANCE GRAPH", 20, chartY + 6);

    const axisXStart = 38;
    const axisYEnd = chartY + 12;
    const axisYStart = chartY + chartHeight;
    const axisXEnd = 180;

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(axisXStart, axisYStart, axisXStart, axisYEnd);
    doc.line(axisXStart, axisYStart, axisXEnd, axisYStart);

    const maxValue = Math.max(prevOnline, prevCash, ongoingOnline, ongoingCash, 5000);
    const getRoundedMax = (val: number) => {
      if (val <= 10000) return 10000;
      if (val <= 30000) return 30000;
      if (val <= 50000) return 50000;
      if (val <= 100000) return 100000;
      return Math.ceil(val / 50000) * 50000;
    };
    const scaleMax = getRoundedMax(maxValue);

    const gridTicks = [0, scaleMax / 2, scaleMax];
    gridTicks.forEach(tick => {
      const tickY = axisYStart - ((tick / scaleMax) * (axisYStart - axisYEnd));
      doc.setDrawColor(148, 163, 184);
      doc.line(axisXStart - 2, tickY, axisXStart, tickY);

      if (tick > 0) {
        doc.setDrawColor(241, 245, 249);
        doc.line(axisXStart, tickY, axisXEnd, tickY);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`INR ${tick.toLocaleString()}`, axisXStart - 20, tickY + 2.5);
    });

    const barWidth = 12;
    const barGap = 3;

    const g1CenterX = axisXStart + 35;
    const g1CashX = g1CenterX - barWidth - (barGap / 2);
    const g1OnlineX = g1CenterX + (barGap / 2);
    const g1CashH = (prevCash / scaleMax) * (axisYStart - axisYEnd);
    const g1OnlineH = (prevOnline / scaleMax) * (axisYStart - axisYEnd);

    doc.setFillColor(245, 158, 11);
    doc.rect(g1CashX, axisYStart - g1CashH, barWidth, g1CashH, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(g1OnlineX, axisYStart - g1OnlineH, barWidth, g1OnlineH, "F");

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(prevMonthName.toUpperCase(), g1CenterX - 8, axisYStart + 5);

    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    if (prevCash > 0) doc.text(`INR ${prevCash}`, g1CashX - 1, axisYStart - g1CashH - 1.5);
    if (prevOnline > 0) doc.text(`INR ${prevOnline}`, g1OnlineX - 1, axisYStart - g1OnlineH - 1.5);

    const g2CenterX = axisXStart + 105;
    const g2CashX = g2CenterX - barWidth - (barGap / 2);
    const g2OnlineX = g2CenterX + (barGap / 2);
    const g2CashH = (ongoingCash / scaleMax) * (axisYStart - axisYEnd);
    const g2OnlineH = (ongoingOnline / scaleMax) * (axisYStart - axisYEnd);

    doc.setFillColor(245, 158, 11);
    doc.rect(g2CashX, axisYStart - g2CashH, barWidth, g2CashH, "F");
    doc.setFillColor(16, 185, 129);
    doc.rect(g2OnlineX, axisYStart - g2OnlineH, barWidth, g2OnlineH, "F");

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${currentMonthName.toUpperCase()} (ONGOING)`, g2CenterX - 18, axisYStart + 5);

    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    if (ongoingCash > 0) doc.text(`INR ${ongoingCash}`, g2CashX - 1, axisYStart - g2CashH - 1.5);
    if (ongoingOnline > 0) doc.text(`INR ${ongoingOnline}`, g2OnlineX - 1, axisYStart - g2OnlineH - 1.5);

    const legendX = axisXEnd - 32;
    const legendY = chartY + 15;

    doc.setFillColor(245, 158, 11);
    doc.rect(legendX, legendY, 3.5, 3.5, "F");
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("Cash payments", legendX + 5, legendY + 3);

    doc.setFillColor(16, 185, 129);
    doc.rect(legendX, legendY + 5.5, 3.5, 3.5, "F");
    doc.text("Online payments", legendX + 5, legendY + 8.5);

    let tableY = chartY + chartHeight + 17;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("DETAILED TRANSACTION AUDIT LEDGER", 15, tableY);

    tableY += 4;

    const colDateW = 25;
    const colStudentW = 45;
    const colSeatW = 20;
    const colAmountW = 25;
    const colModeW = 25;
    const colMonthW = 40;

    const colXDate = 15;
    const colXStudent = colXDate + colDateW;
    const colXSeat = colXStudent + colStudentW;
    const colXAmount = colXSeat + colSeatW;
    const colXMode = colXAmount + colAmountW;
    const colXMonth = colXMode + colModeW;

    doc.setFillColor(15, 23, 42);
    doc.rect(15, tableY, 180, 7, "F");

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("DATE", colXDate + 2, tableY + 4.5);
    doc.text("STUDENT", colXStudent + 2, tableY + 4.5);
    doc.text("SEAT", colXSeat + 2, tableY + 4.5);
    doc.text("AMOUNT", colXAmount + 2, tableY + 4.5);
    doc.text("PAY MODE", colXMode + 2, tableY + 4.5);
    doc.text("BILLING MONTH", colXMonth + 2, tableY + 4.5);

    tableY += 7;

    let pageNum = 1;

    payments.forEach((p, idx) => {
      if (tableY > 265) {
        doc.setDrawColor(226, 232, 240);
        doc.line(15, tableY, 195, tableY);

        doc.addPage();
        pageNum++;
        drawPageHeader(pageNum);

        tableY = 40;

        doc.setFillColor(15, 23, 42);
        doc.rect(15, tableY, 180, 7, "F");

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("DATE", colXDate + 2, tableY + 4.5);
        doc.text("STUDENT", colXStudent + 2, tableY + 4.5);
        doc.text("SEAT", colXSeat + 2, tableY + 4.5);
        doc.text("AMOUNT", colXAmount + 2, tableY + 4.5);
        doc.text("PAY MODE", colXMode + 2, tableY + 4.5);
        doc.text("BILLING MONTH", colXMonth + 2, tableY + 4.5);

        tableY += 7;
      }

      doc.setFillColor(idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 250 : 255);
      doc.rect(15, tableY, 180, 6.5, "F");

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(15, tableY + 6.5, 195, tableY + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      const fDate = p.date ? new Date(p.date).toLocaleDateString('en-GB') : '-';
      const name = p.studentName || 'Unknown Student';
      const seat = p.tableNumber ? `#${p.tableNumber}` : '-';
      const amt = `INR ${p.amount}`;
      const mode = p.mode || 'Cash';
      const month = p.forMonth || '-';

      doc.text(fDate, colXDate + 2, tableY + 4.2);
      const shortName = name.length > 24 ? name.substring(0, 22) + '..' : name;
      doc.text(shortName, colXStudent + 2, tableY + 4.2);
      doc.text(seat, colXSeat + 2, tableY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.text(amt, colXAmount + 2, tableY + 4.2);
      doc.setFont('helvetica', 'normal');

      if (mode === 'Online') {
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setTextColor(5, 150, 105);
      }
      doc.text(mode, colXMode + 2, tableY + 4.2);

      doc.setTextColor(51, 65, 85);
      doc.text(month, colXMonth + 2, tableY + 4.2);

      tableY += 6.5;
    });

    if (tableY > 260) {
      doc.addPage();
      pageNum++;
      drawPageHeader(pageNum);
      tableY = 40;
    }

    tableY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, tableY, 195, tableY);

    tableY += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("End of Financial Audit Report. Generated by Atheron Labs. All rights reserved.", 15, tableY);
    doc.text("Study Lab Management platform secure financial records synchronization.", 15, tableY + 3);

    doc.save(`Atheron_Labs_Transaction_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  const filteredStudents = useMemo(() => {
    const result = students.filter(s => {
      if (!s) return false;
      const nameMatch = (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const mobileMatch = (s.mobile || '').includes(searchTerm || '');
      const tableMatch = (s.tableNumber !== undefined && s.tableNumber !== null) ? s.tableNumber.toString() === searchTerm : false;
      return nameMatch || mobileMatch || tableMatch;
    });

    result.sort((a, b) => {
      if (!a || !b) return 0;
      let comparison = 0;
      if (sortConfig.key === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortConfig.key === 'tableNumber') {
        comparison = (a.tableNumber || 0) - (b.tableNumber || 0);
      } else if (sortConfig.key === 'nextDueDate') {
        const timeA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : 0;
        const timeB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : 0;
        comparison = timeA - timeB;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleTableClick = (tableNum: number) => {
    const student = students.find(s => s.tableNumber === tableNum);
    if (student) {
      setSelectedStudentId(student.id);
    } else {
      setSelectedTable(tableNum);
      setIsFormOpen(true);
    }
  };

  const handleSaveStudent = async (newStudent: Student) => {
    setIsSaving(true);
    try {
      await fbSaveStudent(newStudent);
      setIsFormOpen(false);
      setSelectedTable(null);
    } catch (error) {
      alert("Failed to save student: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    if (studentToDelete) {
      setIsSaving(true);
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const getYearAndMonth = (dateStr: string) => {
          if (!dateStr || typeof dateStr !== 'string') return { year: 0, month: 0 };
          const parts = dateStr.split('T')[0].split('-');
          return {
            year: parseInt(parts[0], 10) || 0,
            month: (parseInt(parts[1], 10) - 1) ?? 0
          };
        };

        // Minimize storage by filtering to only last 2 months of payments
        const filteredPayments = (studentToDelete.paymentHistory || [])
          .filter(p => {
            if (!p || !p.date) return false;
            const parsed = getYearAndMonth(p.date);
            const isCurrentMonth = parsed.year === currentYear && parsed.month === currentMonth;
            const isPrevMonth = parsed.year === prevYear && parsed.month === prevMonth;
            return isCurrentMonth || isPrevMonth;
          })
          .map(p => ({
            id: p.id,
            amount: p.amount,
            date: p.date,
            mode: p.mode,
            forMonth: p.forMonth
          }));

        // Archive as exactly 1 document with compact keys & TTL timestamp for Spark Plan Optimization
        await fbSaveDeletedStudent({
          id: studentToDelete.id,
          userId: studentToDelete.userId || 'shared',
          n: studentToDelete.name,
          t: studentToDelete.tableNumber,
          p: filteredPayments,
          deletedAt: now,
          expireAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60-day TTL expiration
        });
      } catch (err) {
        console.error("Failed to archive deleted student record:", err);
      }
    }

    setIsSaving(true);
    try {
      await fbDeleteStudent(id);
      setSelectedStudentId(null);
      setIsFormOpen(false);
    } catch (error) {
      alert("Failed to delete student: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = () => {
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid expense amount!");
      return;
    }
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      category: expCategory,
      title: expTitle.trim() || `${expCategory} Outflow`,
      amount: amt,
      date: expDate || new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExpense, ...prev]);
    setExpTitle('');
    setExpAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const sendWhatsAppReminder = (student: Student) => {
    const hasDueDate = student && student.nextDueDate && typeof student.nextDueDate === 'string';
    const formattedDate = hasDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-GB') : '';
    const message = `Hi ${student.name || 'Student'}, this is a reminder from *SHRI VENKATESH LIBRARY* regarding your subscription for *Table #${student.tableNumber || ''}*. Your monthly fee of *₹${student.monthlyFee || 0}* was due on *${formattedDate}*. Please clear the dues soon.

Payment Details:
•  UPI No.: 9325121145
•  *QR Code Link*: https://drive.google.com/file/d/1qFzh2WSyKtt26SL9rJ_NH8I9yrakiRL-/view?usp=drivesdk

For any assistance or payment-related queries, feel free to contact us anytime.

Thank you for being a valued member of *SHRI VENKATESH LIBRARY*.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${(student.mobile || '').replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const isNewStudent = (student: Student) => {
    if (!student || !student.paymentHistory || student.paymentHistory.length === 0) return true;
    const joiningTime = student.joiningDate ? new Date(student.joiningDate).getTime() : 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return joiningTime > oneWeekAgo;
  };

  const sendWhatsAppWelcome = (student: Student) => {
    const hasJoiningDate = student && student.joiningDate && typeof student.joiningDate === 'string';
    const hasDueDate = student && student.nextDueDate && typeof student.nextDueDate === 'string';
    const formattedJoining = hasJoiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB') : '';
    const formattedDue = hasDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-GB') : '';
    const message = `Dear *${student.name || 'Student'}*,

*Welcome to SHRI VENKATESH LIBRARY!* 📚✨

We are delighted to welcome you to our peaceful and disciplined study lab. Here are your enrollment details:

•  *Table Assigned*: Table #${student.tableNumber || ''}
•  *Monthly Subscription*: ₹${student.monthlyFee || 0}
•  *Admission Date*: ${formattedJoining}
•  *Next Fee Due Date*: ${formattedDue}

*Important Rules & Policies:*
1. Please maintain absolute silence inside the study cabin.
2. Ensure you occupy only your assigned Table #${student.tableNumber}.
3. Fees must be deposited before or on the due date (*${formattedDue}*).

*Payment Address details for future references:*
•  UPI ID / Mobile: 9325121145
•  *QR Code Link for direct scan*: https://drive.google.com/file/d/1qFzh2WSyKtt26SL9rJ_NH8I9yrakiRL-/view?usp=drivesdk

If you need any technical assistance or seat adjustments, our help desk is always ready to support you.

Happy studying! Let's work hard together to achieve your academic/career goals! 🎯🎓

Best regards,
*SHRI VENKATESH LIBRARY*
📞 Helpdesk: 7972055505`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${(student.mobile || '').replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePayment = async (studentId: string, payment: Omit<PaymentRecord, 'id'>) => {
    setIsSaving(true);
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) {
      setIsSaving(false);
      return;
    }

    const currentDue = new Date(targetStudent.nextDueDate);
    const nextDue = new Date(currentDue.setMonth(currentDue.getMonth() + 1)).toISOString();
    
    const newRecord: PaymentRecord = {
      ...payment,
      id: crypto.randomUUID()
    };

    const updatedStudent: Student = {
      ...targetStudent,
      lastPaidDate: new Date().toISOString(),
      nextDueDate: nextDue,
      paymentHistory: [...targetStudent.paymentHistory, newRecord]
    };

    try {
      await fbSaveStudent(updatedStudent);
    } catch (error) {
      alert("Failed to record payment: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shrivenkatesh_library_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to export data: " + error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Import will overwrite all local settings. Continue?")) {
      e.target.value = '';
      return;
    }

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importData(content);
        const updated = await getStudents();
        setStudents(updated);
        alert("Data imported successfully!");
      } catch (error) {
        alert(error);
      } finally {
        setIsSaving(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (confirm("CRITICAL: Wipe ALL library records permanently?")) {
      const input = prompt("Type 'DELETE' to confirm action:");
      if (input === 'DELETE') {
        setIsSaving(true);
        await saveStudents([]);
        setStudents([]);
        setIsSaving(false);
        alert("Database cleared.");
      }
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center py-0 sm:py-6 px-0 sm:px-4 font-sans antialiased select-none">
      {/* Smartphone frame container on desktops, full-screen on mobile devices */}
      <div className="w-full sm:max-w-md bg-slate-50 sm:rounded-[32px] sm:shadow-2xl sm:border border-slate-200/80 overflow-hidden flex flex-col h-screen sm:h-[820px] relative">
        
        {isSaving && (
          <div className="absolute inset-0 z-[100] bg-white/65 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="font-bold text-slate-800 text-xs">Saving details...</p>
            </div>
          </div>
        )}

        {/* Compact App Header */}
        <header className="bg-white border-b border-slate-100 shrink-0 px-4 py-3 flex items-center justify-between sticky top-0 z-45">
          <div className="flex items-center gap-2.5">
            <AppIcon size={34} className="shrink-0" />
            <div>
              <h1 className="text-slate-900 font-black text-sm tracking-tight leading-none">SHRI VENKATESH LIBRARY</h1>
              <p className="text-[8px] text-slate-400 font-extrabold tracking-widest uppercase mt-1">by Atheron Labs</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => { setSelectedTable(null); setIsFormOpen(true); }}
              className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors shadow-xs active:scale-95"
              title="Add Student"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className="p-1.5 bg-slate-50 border border-slate-150 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative active:scale-95"
              title="Dues Alert"
            >
              <Bell className="w-4 h-4" />
              {stats.overdue > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* Quick Metrics Dashboard Bar */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white px-2 py-2.5 text-center rounded-xl border border-slate-150 shadow-3xs">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Occupied</p>
              <p className="text-sm font-extrabold text-slate-800 leading-tight">{stats.total} / 50</p>
            </div>
            <div className="bg-white px-2 py-2.5 text-center rounded-xl border border-slate-150 shadow-3xs">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Overdue</p>
              <p className={`text-sm font-extrabold leading-tight ${stats.overdue > 0 ? 'text-rose-500 bg-rose-50/50 rounded-md py-0.5' : 'text-slate-800'}`}>
                {stats.overdue}
              </p>
            </div>
            <div className="bg-white px-2 py-2.5 text-center rounded-xl border border-slate-150 shadow-3xs">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Revenue</p>
              <p className="text-sm font-extrabold text-slate-800 leading-tight">₹{stats.monthlyRevenue}</p>
            </div>
          </div>



          <div className="min-h-0">
            <AnimatePresence mode="wait">
              {/* VIEW 1: Grid Seats Layout */}
              {view === 'grid' && (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-blue-600" /> Interactive Seat Plan
                    </h2>
                    <div className="flex gap-2 text-[8px] font-extrabold uppercase text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Okay</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Due</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Vacant</span>
                    </div>
                  </div>
                  
                  <TableGrid students={students} onTableClick={handleTableClick} />
                </motion.div>
              )}

              {/* VIEW 2: Student Directory Directory List */}
              {view === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="space-y-3"
                >
                  {/* Search box inside student tab */}
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search students, mobile or seat..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs font-semibold"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 hover:bg-slate-300 font-extrabold px-1.5 py-0.5 rounded text-slate-500"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Sorting Controls */}
                  <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-150">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400">Sort by</span>
                    <div className="flex gap-1">
                      {[
                        { key: 'name', label: 'Name' },
                        { key: 'tableNumber', label: 'Seat' },
                        { key: 'nextDueDate', label: 'Dues' }
                      ].map(opt => {
                        const isSel = sortConfig.key === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSort(opt.key as SortKey)}
                            className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-0.5
                              ${isSel ? 'bg-blue-50 text-blue-600 font-extrabold' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            {opt.label}
                            {isSel && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Student Cards Loop */}
                  <div className="space-y-2">
                    {filteredStudents.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 font-medium italic text-xs">
                        No matching records found.
                      </div>
                    ) : (
                      filteredStudents.map((s, sIdx) => {
                        const hasDueDate = s && s.nextDueDate && typeof s.nextDueDate === 'string';
                        const isOverdue = hasDueDate ? new Date(s.nextDueDate) < new Date() : false;
                        const formattedDueDate = hasDueDate ? new Date(s.nextDueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '—';
                        const initialChar = (s.name || ' ').slice(0, 1).toUpperCase() || '?';
                        return (
                          <div key={`${s.id || 'student'}-${sIdx}`} className="bg-white p-3 rounded-xl border border-slate-150 shadow-3xs flex items-center justify-between hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 font-extrabold text-slate-500 flex items-center justify-center relative shrink-0 text-sm">
                                {initialChar}
                                <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                                  #{s.tableNumber}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-extrabold text-slate-800 text-xs truncate leading-none mb-1">{s.name || 'No Name'}</h3>
                                <p className="text-[9px] text-slate-400 font-bold mb-0.5">{s.mobile || '—'}</p>
                                <p className={`text-[8px] font-black uppercase inline-block font-mono tracking-tight leading-none
                                  ${isOverdue ? 'text-rose-500' : 'text-emerald-500'}`}
                                >
                                  {isOverdue 
                                    ? `Overdue (${formattedDueDate})` 
                                    : `Next Due: ${formattedDueDate}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {isNewStudent(s) && (
                                <button 
                                  onClick={() => sendWhatsAppWelcome(s)}
                                  className="p-1 px-1.5 bg-sky-50 text-sky-650 hover:bg-sky-100 border border-sky-100/50 rounded-lg transition-colors active:scale-95"
                                  title="Send WhatsApp Welcome"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isOverdue && (
                                <button 
                                  onClick={() => sendWhatsAppReminder(s)}
                                  className="p-1 px-1.5 bg-emerald-50 text-[#25D366] hover:bg-emerald-100 border border-emerald-100/50 rounded-lg transition-colors active:scale-95"
                                  title="Send WhatsApp Reminder"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              <button 
                                onClick={() => setSelectedStudentId(s.id)}
                                className="p-1 px-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100/50 rounded-lg transition-all active:scale-95"
                                title="Invoice details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteStudent(s.id)}
                                className="p-1 px-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100/50 rounded-lg transition-all active:scale-95"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 3: Insights & Analytics */}
              {view === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="space-y-6 pb-6 relative min-h-[600px]"
                >
                  {/* Floating Bubbles Background (Interactive & Animated) */}
                  <FloatingBubbleBackground />

                  {/* Glassmorphic Live Library Seat Occupancy & Density Dashboard */}
                  <div className="bg-white/75 backdrop-blur-xl p-4 rounded-2xl border border-white/40 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100/60">
                      <div>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> LIVE SEAT DENSITY & LAYOUT
                        </span>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">Real-time occupancy visualization across 51 seats</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-100/40">
                        {Math.round((students.length / 51) * 100)}% Occupied
                      </span>
                    </div>

                    {/* Occupancy stats summary */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-indigo-50/30 p-2 rounded-xl border border-indigo-100/30 flex flex-col justify-between">
                        <span className="text-[7.5px] font-black text-indigo-800 uppercase tracking-wider">Total Seats</span>
                        <span className="text-sm font-black text-indigo-900 mt-0.5">51</span>
                      </div>
                      <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/30 flex flex-col justify-between">
                        <span className="text-[7.5px] font-black text-emerald-800 uppercase tracking-wider">Filled Seats</span>
                        <span className="text-sm font-black text-emerald-700 mt-0.5">{students.length}</span>
                      </div>
                      <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 flex flex-col justify-between">
                        <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider">Available</span>
                        <span className="text-sm font-black text-slate-600 mt-0.5">{Math.max(0, 51 - students.length)}</span>
                      </div>
                    </div>

                    {/* Interactive Real-Time Layout Visual Map */}
                    <div className="p-3 bg-slate-900/5 rounded-xl border border-slate-200/50 space-y-2">
                      <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider pl-0.5">
                        <span>Library Seat Matrix Map (Tables 10-60)</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>Filled</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full border border-slate-400 bg-white"></span>Empty</span>
                        </div>
                      </div>
                      
                      {/* Grid representation */}
                      <div className="grid grid-cols-10 gap-1.5 p-1 bg-white/50 rounded-lg border border-slate-200/30">
                        {Array.from({ length: 51 }, (_, index) => {
                          const tableNumber = 10 + index;
                          const studentAtSeat = students.find(s => s.tableNumber === tableNumber);
                          const isOccupied = !!studentAtSeat;
                          
                          return (
                            <div 
                              key={tableNumber}
                              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[7.5px] font-black transition-all duration-300 relative group cursor-help
                                ${isOccupied 
                                  ? 'bg-indigo-600 text-white shadow-3xs hover:bg-indigo-700 scale-102' 
                                  : 'bg-white text-slate-400 border border-slate-300/80 hover:border-slate-500'}`}
                              title={isOccupied ? `Seat ${tableNumber}: ${studentAtSeat.name}` : `Seat ${tableNumber}: Available`}
                            >
                              <span>{tableNumber}</span>
                              {isOccupied && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
                              )}
                              
                              {/* Hover tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[8px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                {isOccupied ? `Seat ${tableNumber}: ${studentAtSeat.name} (₹${studentAtSeat.monthlyFee || 0}/m)` : `Seat ${tableNumber}: Available`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Comprehensive Profit & Expenses Calculator */}
                  <div className="bg-white/75 backdrop-blur-xl p-3.5 rounded-2xl border border-white/40 shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex flex-col gap-2 bg-gradient-to-r from-slate-50 to-indigo-50/20 -mx-3.5 -mt-3.5 p-3 rounded-t-2xl border-b border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-indigo-600" /> Net Profit & Expense Calculator
                        </span>
                        <select 
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value as DateRange)}
                          className="text-[9px] font-black bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded border border-indigo-150/50 outline-none cursor-pointer"
                        >
                          <option value="this-month">This Month</option>
                          <option value="last-month">Last Month</option>
                          <option value="all-time">All Time</option>
                          <option value="custom">Custom Period</option>
                        </select>
                      </div>

                      {dateRange === 'custom' && (
                        <div className="pt-2 border-t border-indigo-100/30 grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase mb-0.5">Start Date</span>
                            <input 
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="p-1 px-1.5 bg-white border border-indigo-100 rounded-md text-[9px] text-slate-705 outline-none"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7.5px] font-black text-slate-400 uppercase mb-0.5">End Date</span>
                            <input 
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="p-1 px-1.5 bg-white border border-indigo-100 rounded-md text-[9px] text-slate-705 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Profit/Loss Display Block */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-between">
                        <span className="text-[7.5px] font-black text-emerald-800 uppercase tracking-wider">Fees Collected</span>
                        <span className="text-sm font-black text-emerald-700 mt-1">₹{stats.totalCash + stats.totalOnline}</span>
                      </div>
                      <div className="bg-rose-50/40 p-2.5 rounded-xl border border-rose-100 flex flex-col justify-between">
                        <span className="text-[7.5px] font-black text-rose-800 uppercase tracking-wider">Other Expenses</span>
                        <span className="text-sm font-black text-rose-700 mt-1">₹{stats.totalExpenses}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-300
                        ${stats.profit >= 0 
                          ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200' 
                          : 'bg-gradient-to-br from-rose-500/10 to-red-500/5 border-rose-200'}`}
                      >
                        <span className={`text-[7.5px] font-black uppercase tracking-wider 
                          ${stats.profit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                          Net Profit
                        </span>
                        <span className={`text-sm font-black tracking-tight mt-1
                          ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          ₹{stats.profit}
                        </span>
                      </div>
                    </div>

                    {/* Add Expense Form Panel */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2.5">
                      <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider block">💸 Log New Library Expense</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Category</label>
                          <select
                            value={expCategory}
                            onChange={(e) => setExpCategory(e.target.value)}
                            className="text-[9px] font-bold p-1 bg-white border border-slate-200 rounded-md outline-none cursor-pointer text-slate-800"
                          >
                            <option value="💡 Light Bill">💡 Light Bill</option>
                            <option value="🏠 Rent">🏠 Rent</option>
                            <option value="🌐 Internet">🌐 Internet</option>
                            <option value="🧹 Helper Salary">🧹 Helper Salary</option>
                            <option value="📦 Miscellaneous">📦 Miscellaneous</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 3500"
                            value={expAmount}
                            onChange={(e) => setExpAmount(e.target.value)}
                            className="p-1 px-2 border border-slate-200 rounded-md text-[9px] text-slate-800 focus:border-indigo-300 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Title / Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. May electricity"
                            value={expTitle}
                            onChange={(e) => setExpTitle(e.target.value)}
                            className="p-1 px-2 border border-slate-200 rounded-md text-[9px] text-slate-800 focus:border-indigo-300 outline-none font-medium"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Expense Date</label>
                          <input
                            type="date"
                            value={expDate}
                            onChange={(e) => setExpDate(e.target.value)}
                            className="p-1 px-1.5 border border-slate-200 rounded-md text-[9px] text-slate-705 outline-none focus:border-indigo-300"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddExpense}
                        className="w-full bg-slate-900 hover:bg-indigo-650 text-white font-black py-1.5 text-[9px] rounded-lg transition-all shadow-sm uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-indigo-400" /> Save Expense Record
                      </button>
                    </div>

                    {/* Expense History List filtered by Date Period */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">
                        <span>Logged Expenses ({stats.filteredExpenses.length})</span>
                        <span>Filtered Total: ₹{stats.totalExpenses}</span>
                      </div>

                      <div className="max-h-[160px] overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
                        {stats.filteredExpenses.length === 0 ? (
                          <div className="text-center py-6 bg-slate-25/50 border border-dashed border-slate-150 rounded-xl">
                            <p className="text-[9px] text-slate-400 italic">No expenses recorded for this period.</p>
                          </div>
                        ) : (
                          stats.filteredExpenses.map((exp: Expense, expIdx: number) => (
                            <div key={`${exp.id || 'expense'}-${expIdx}`} className="flex justify-between items-center p-2 bg-gradient-to-r from-white to-slate-50/55 rounded-lg border border-slate-150 text-[9.5px] hover:border-slate-350 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded border border-rose-100 text-[8.5px] shrink-0 leading-none">
                                  {exp.category}
                                </span>
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-slate-750">{exp.title}</p>
                                  <p className="text-[7.5px] text-slate-400 font-semibold">{exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : ''}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-bold text-rose-650">₹{exp.amount}</span>
                                {deletingExpenseId === exp.id ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        handleDeleteExpense(exp.id);
                                        setDeletingExpenseId(null);
                                      }}
                                      className="bg-red-500 hover:bg-red-650 text-white font-black px-2 py-0.5 rounded text-[8px] cursor-pointer leading-tight"
                                      title="Confirm delete"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeletingExpenseId(null)}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-extrabold px-1.5 py-0.5 rounded text-[8px] cursor-pointer leading-tight"
                                      title="Cancel"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingExpenseId(exp.id)}
                                    className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                                    title="Delete Expense"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Highly Polished Transaction Audits Dashboard Panel */}
                  <div className="bg-white/75 backdrop-blur-xl p-4 rounded-2xl border border-white/40 shadow-sm space-y-3.5">
                    {/* Header with Branding and PDF Download Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> TRANSACTION AUDITS
                        </span>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">Last 1 Month & Ongoing ledger sync</p>
                      </div>

                      {/* Download PDF Form Button branded by Atheron Labs */}
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white hover:from-blue-600 hover:to-indigo-650 rounded-xl text-[9.5px] font-black shadow-3xs hover:shadow-xs transition-all duration-200 active:scale-95 border border-slate-700/30 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-sky-400" />
                        <span>Atheron PDF Report</span>
                      </button>
                    </div>

                    {/* Quick Financial Overview Bar for the 2 Months */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                      <div className="text-center border-r border-slate-150 last:border-none">
                        <p className="text-[7.5px] font-bold text-slate-400 uppercase">2M Volume</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">₹{stats.twoMonthsPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)}</p>
                      </div>
                      <div className="text-center border-r border-slate-150 last:border-none">
                        <p className="text-[7.5px] font-bold text-blue-500 uppercase">Online</p>
                        <p className="font-extrabold text-blue-600 mt-0.5">₹{stats.twoMonthsPayments.filter((p: any) => p.mode === 'Online').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)}</p>
                      </div>
                      <div className="text-center last:border-none">
                        <p className="text-[7.5px] font-bold text-emerald-500 uppercase">Cash</p>
                        <p className="font-extrabold text-emerald-600 mt-0.5">₹{stats.twoMonthsPayments.filter((p: any) => p.mode === 'Cash').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)}</p>
                      </div>
                    </div>

                    {/* Separate Monthly Collections Sums */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60 flex flex-col justify-between">
                        <div className="text-[7.5px] font-black text-blue-600 uppercase tracking-widest">{currentMonthName} (Ongoing)</div>
                        <p className="text-[11px] font-black text-blue-800 mt-0.5">₹{stats.currentMonthSum.toLocaleString()}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 flex flex-col justify-between">
                        <div className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest">{prevMonthName}</div>
                        <p className="text-[11px] font-black text-emerald-800 mt-0.5">₹{stats.prevMonthSum.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Search & Mode Filters Toolbar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          type="text"
                          value={txSearch}
                          onChange={(e) => setTxSearch(e.target.value)}
                          placeholder="Search student, seat or amount..."
                          className="w-full bg-slate-50 border border-slate-150 pl-7 pr-2 py-1 rounded-xl text-[9.5px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="flex p-0.5 bg-slate-100/80 border border-slate-150 rounded-xl gap-0.5 shrink-0">
                        {(['all', 'Cash', 'Online'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setTxMode(mode)}
                            className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wide uppercase transition-all cursor-pointer
                              ${txMode === mode
                                ? 'bg-white text-slate-900 shadow-3xs font-extrabold'
                                : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {mode === 'all' ? 'All' : mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Elegant list of items */}
                    <div className="max-h-[220px] overflow-y-auto pr-0.5 space-y-2 custom-scrollbar">
                      {displayTransactions.map((p: any, pIdx) => {
                        const isOnline = p.mode === 'Online';
                        return (
                          <motion.div 
                            key={`${p.id || 'payment'}-${pIdx}`} 
                            whileHover={{ scale: 1.008, x: 2, backgroundColor: '#fbfcfe' }}
                            className={`flex justify-between items-center p-3 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-150/80 text-[10px] shadow-3xs transition-shadow duration-150 hover:shadow-2xs
                              ${isOnline 
                                ? 'border-l-4 border-l-blue-500' 
                                : 'border-l-4 border-l-emerald-500'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Round circular currency indicator */}
                              <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-transform duration-200 hover:rotate-12
                                ${isOnline 
                                  ? 'bg-blue-50/70 text-blue-600 border border-blue-100/50 shadow-3xs' 
                                  : 'bg-emerald-50/70 text-emerald-600 border border-emerald-100/50 shadow-3xs'}`}
                              >
                                ₹
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-slate-800 truncate text-[10.5px]">
                                    ₹{p.amount}
                                  </p>
                                  <span className="text-[7.5px] font-black px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wider leading-none">
                                    Seat #{p.tableNumber}
                                  </span>
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold mt-0.5 truncate">
                                  by {p.studentName || 'Student'} • {p.date ? new Date(p.date).toLocaleDateString('en-GB') : ''}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                              <span className={`px-2 py-0.5 rounded-md font-black text-[7.5px] uppercase tracking-wider border leading-none
                                ${isOnline 
                                  ? 'bg-blue-50/50 text-blue-700 border-blue-100/50' 
                                  : 'bg-emerald-50/50 text-emerald-800 border-emerald-110'}`}
                              >
                                {p.mode || 'Payment'}
                              </span>
                              <span className="text-[7.5px] text-slate-400 font-black tracking-tight leading-none">
                                {(p.forMonth || '').split(' ')[0] || 'Month'}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      {displayTransactions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-[10.5px] text-slate-400 font-extrabold">No transactions matched your filters.</p>
                          <p className="text-[8px] text-slate-400 font-bold mt-0.5">Try searching for a different student, seat or mode.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Minimal Smart Dock Navigation bar - ultra clean, tight, and compact */}
        <nav className="bg-white border-t border-slate-100 shrink-0 flex justify-around items-center py-1.5 z-40">
          {[
            { id: 'grid', label: 'Seats', icon: LayoutGrid },
            { id: 'list', label: 'Students', icon: Users },
            { id: 'analytics', label: 'Insights', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as ViewState)}
                className={`flex flex-col items-center justify-center py-0.5 px-6 rounded-xl transition-all duration-150 active:scale-95
                  ${isActive 
                    ? 'text-blue-600 scale-102 font-extrabold' 
                    : 'text-slate-400 font-semibold hover:text-slate-500'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[8px] mt-0.5 tracking-tight leading-none">{tab.label}</span>
                {isActive && (
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5 animate-bounce"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Modern Smartphone Home Sweep Indicator */}
        <div className="bg-white h-2 w-full shrink-0 flex justify-center items-center pb-0.5">
          <div className="w-16 h-0.5 bg-slate-200 rounded-full"></div>
        </div>

      </div>

      {isFormOpen && (
        <StudentForm 
          student={selectedStudent}
          tableNumber={selectedTable || undefined}
          existingStudents={students}
          onSave={handleSaveStudent}
          onClose={() => { 
            setIsFormOpen(false); 
            setSelectedTable(null);
            setSelectedStudentId(null);
          }}
          onDelete={handleDeleteStudent}
          isSaving={isSaving}
        />
      )}

      {selectedStudent && !isFormOpen && (
        <StudentDetails 
          student={selectedStudent}
          onClose={() => setSelectedStudentId(null)}
          onEdit={() => setIsFormOpen(true)}
          onPayment={(p) => handlePayment(selectedStudent.id, p)}
          onDelete={handleDeleteStudent}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default App;
