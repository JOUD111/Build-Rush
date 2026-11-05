import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Activity, ArrowUpLeft, Check, CheckCircle2, Circle, ClipboardList, Clock3, Layers3, Plus, Sparkles, Users, WandSparkles } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type TaskStatus = 'قيد الانتظار' | 'قيد التنفيذ' | 'مكتملة';
type Task = { id: string; title: string; detail: string; owner: string; status: TaskStatus };
type BoardState = { description: string; tasks: Task[]; members: string[] };

const initialBoard: BoardState = {
  description: 'منصة تساعد طلاب الجامعة على تبادل الكتب والمراجع الدراسية بسهولة، مع نظام بحث ومراجعات موثوقة.',
  members: ['أحمد', 'سارة', 'جود'],
  tasks: [
    { id: 'req-analysis', title: 'تحليل المتطلبات', detail: 'تحديد احتياجات المستخدمين ورسم نطاق النسخة الأولى.', owner: 'أحمد', status: 'مكتملة' },
    { id: 'data-interface', title: 'تصميم قاعدة البيانات والواجهات', detail: 'بناء مخطط البيانات وتدفق الشاشات الأساسية.', owner: 'سارة', status: 'قيد التنفيذ' },
    { id: 'system-build', title: 'تنفيذ النظام', detail: 'تطوير الوظائف الأساسية وربط أجزاء المنصة.', owner: 'جود', status: 'قيد الانتظار' },
  ],
};

function readBoard(): BoardState {
  try {
    const raw = localStorage.getItem('student-project-board-v1');
    if (!raw) return initialBoard;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return initialBoard;
    const candidate = value as Partial<BoardState>;
    const validStatuses: TaskStatus[] = ['قيد الانتظار', 'قيد التنفيذ', 'مكتملة'];
    const validMembers = Array.isArray(candidate.members) && candidate.members.every((name) => typeof name === 'string');
    const validTasks = Array.isArray(candidate.tasks) && candidate.tasks.every((task) =>
      !!task && typeof task === 'object' &&
      typeof task.id === 'string' && typeof task.title === 'string' &&
      typeof task.detail === 'string' && typeof task.owner === 'string' &&
      validStatuses.includes(task.status),
    );
    if (!validMembers || !validTasks || typeof candidate.description !== 'string') return initialBoard;
    return { description: candidate.description, members: candidate.members as string[], tasks: candidate.tasks as Task[] };
  } catch {
    return initialBoard;
  }
}

function Home() {
  const [board, setBoard] = useState<BoardState>(readBoard);
  const [memberInput, setMemberInput] = useState('');
  const [memberError, setMemberError] = useState('');
  const [demoNote, setDemoNote] = useState('');
  useEffect(() => {
    try { localStorage.setItem('student-project-board-v1', JSON.stringify(board)); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [board]);
  const completed = board.tasks.filter((task) => task.status === 'مكتملة').length;
  const inProgress = board.tasks.filter((task) => task.status === 'قيد التنفيذ').length;
  const progress = board.tasks.length ? Math.round((completed / board.tasks.length) * 100) : 0;
  const sortedTasks = useMemo(() => board.tasks, [board.tasks]);
  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = memberInput.trim();
    if (!name) { setMemberError('أدخل اسم العضو أولاً.'); return; }
    if (board.members.some((member) => member.toLocaleLowerCase() === name.toLocaleLowerCase())) { setMemberError('هذا الاسم موجود ضمن الفريق بالفعل.'); return; }
    setBoard((current) => ({ ...current, members: [...current.members, name] }));
    setMemberInput('');
    setMemberError('');
  }
  function generateDemoTasks() {
    setBoard((current) => ({
      ...current,
      tasks: [
        { id: 'req-analysis', title: 'تحليل المتطلبات', detail: 'تحديد احتياجات المستخدمين ورسم نطاق النسخة الأولى.', owner: current.members[0] ?? '', status: 'قيد الانتظار' },
        { id: 'data-interface', title: 'تصميم قاعدة البيانات والواجهات', detail: 'بناء مخطط البيانات وتدفق الشاشات الأساسية.', owner: current.members[1] ?? '', status: 'قيد الانتظار' },
        { id: 'system-build', title: 'تنفيذ النظام', detail: 'تطوير الوظائف الأساسية وربط أجزاء المنصة.', owner: current.members[2] ?? '', status: 'قيد الانتظار' },
      ],
    }));
    setDemoNote('تم إنشاء مهام نموذجية محلياً. يمكنك تعديل المسؤول والحالة مباشرة.');
  }
  return (
    <div className="workspace" dir="rtl">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Layers3 size={21} /></div><div><strong>مِحور</strong><span>مساحة فريقك</span></div></div>
        <div className="side-label">مساحة العمل</div>
        <div className="side-current"><span className="side-dot" /><div><strong>مشروع الهاكاثون</strong><small>الفريق الطلابي · مساحة خاصة</small></div><ArrowUpLeft size={16} /></div>
        <div className="side-label side-label-team">الفريق</div>
        <div className="side-members">
          {board.members.length ? board.members.map((member, index) => <div className="side-member" key={`${member}-${index}`} data-testid={`member-sidebar-${index}`}><span className={`avatar avatar-${index % 4}`}>{member.trim().charAt(0)}</span><span>{member}</span><i /></div>) : <p className="side-empty">أضفوا أعضاء فريقكم للبدء.</p>}
        </div>
        <div className="sidebar-foot"><div className="foot-icon"><Activity size={17} /></div><div><strong>كل خطوة تقرّبكم</strong><small>من فكرة إلى أثر</small></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>مساحة العمل</span><span className="crumb-sep">/</span><strong>لوحة المشروع</strong></div>
          <div className="topbar-meta"><span className="live-dot" /> نسخة تجريبية محلية <span className="topbar-divider" /><span className="team-count"><Users size={15} /> {board.members.length} أعضاء</span></div>
        </header>
        <div className="content">
          <section className="page-heading">
            <div className="heading-copy"><div className="eyebrow"><span className="eyebrow-line" /> هاكاثون الطلاب <span className="eyebrow-year">مساحة الفريق</span></div><h1>مرحباً بفريقكم<span className="heading-period">.</span></h1><p>رتّبوا العمل، وخلّوا كل خطوة واضحة للجميع.</p></div>
            <div className="sprint-chip"><span className="sprint-icon"><Activity size={17} /></span><div><small>مرحلة العمل</small><strong>بناء النموذج الأولي</strong></div></div>
          </section>
          <section className="summary-grid" aria-label="ملخص المشروع">
            <article className="summary-card summary-progress" data-testid="summary-progress"><div className="summary-top"><span>إنجاز المشروع</span><span className="summary-icon amber"><CheckCircle2 size={18} /></span></div><div className="summary-number">{progress}<small>%</small></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="summary-foot"><span>{completed} من {board.tasks.length} مهام مكتملة</span><span className="summary-highlight">{progress}%</span></div></article>
            <article className="summary-card" data-testid="summary-active"><div className="summary-top"><span>قيد التنفيذ</span><span className="summary-icon teal"><Activity size={18} /></span></div><div className="summary-number">{inProgress}<small> مهام</small></div><div className="summary-caption">تعمل عليها الآن</div><div className="summary-bottom-line teal-line" /></article>
            <article className="summary-card" data-testid="summary-team"><div className="summary-top"><span>أعضاء الفريق</span><span className="summary-icon navy"><Users size={18} /></span></div><div className="summary-number">{board.members.length}<small> أعضاء</small></div><div className="summary-caption">فريق واحد، هدف مشترك</div><div className="summary-bottom-line navy-line" /></article>
          </section>
          <div className="main-columns">
            <section className="panel project-panel">
              <div className="panel-heading"><div className="section-icon"><ClipboardList size={19} /></div><div><h2>نبذة المشروع</h2><p>الفكرة التي يعمل عليها فريقكم</p></div><span className="demo-badge">مساحة تجريبية</span></div>
              <label className="sr-only" htmlFor="project-description">وصف المشروع</label>
              <textarea id="project-description" className="description-input" value={board.description} onChange={(event) => setBoard((current) => ({ ...current, description: event.target.value }))} placeholder="اكتبوا وصفاً مختصراً لفكرتكم..." data-testid="input-project-description" />
              <div className="description-footer"><span><span className="save-dot" /> يُحفظ تلقائياً على هذا الجهاز</span><span>{board.description.length} حرفاً</span></div>
              <div className="idea-note"><Sparkles size={17} /><p>الوصف هنا يساعد فريقكم على إبقاء الهدف واضحاً أثناء تنفيذ المهام.</p></div>
            </section>
            <section className="panel team-panel">
              <div className="panel-heading"><div className="section-icon team-icon"><Users size={19} /></div><div><h2>أعضاء الفريق</h2><p>أضيفوا زملاءكم إلى مساحة العمل</p></div><span className="member-count">{board.members.length}</span></div>
              <form className="member-form" onSubmit={addMember} noValidate>
                <label className="sr-only" htmlFor="member-name">اسم العضو الجديد</label>
                <input id="member-name" value={memberInput} onChange={(event) => { setMemberInput(event.target.value); if (memberError) setMemberError(''); }} placeholder="اكتب اسم العضو" data-testid="input-member-name" aria-describedby={memberError ? 'member-error' : undefined} />
                <button type="submit" className="add-button" data-testid="button-add-member"><Plus size={17} /><span>إضافة</span></button>
              </form>
              {memberError && <p className="form-error" id="member-error" role="alert" data-testid="status-member-error">{memberError}</p>}
              <div className="member-list" aria-label="قائمة أعضاء الفريق">
                {board.members.length ? board.members.map((member, index) => <div className="member-row" key={`${member}-${index}`} data-testid={`row-member-${index}`}><span className={`avatar avatar-${index % 4}`}>{member.trim().charAt(0)}</span><span className="member-name">{member}</span><span className="member-role">{index === 0 ? 'قائد الفريق' : 'عضو'}</span><span className="member-active"><i /> نشط</span></div>) : <div className="empty-members"><Users size={20} /><strong>الفريق يبدأ من هنا</strong><span>أضيفوا أول عضو باستخدام الحقل أعلاه.</span></div>}
              </div>
            </section>
          </div>
          <section className="panel tasks-panel">
            <div className="tasks-heading">
              <div className="panel-heading task-title"><div className="section-icon task-icon"><ClipboardList size={19} /></div><div><h2>مهام المشروع</h2><p>تابعوا التقدم ووزّعوا المسؤوليات بوضوح</p></div></div>
              <div className="task-heading-end"><span className="task-total">{board.tasks.length} مهام</span><button type="button" onClick={generateDemoTasks} className="generate-button" data-testid="button-generate-tasks"><WandSparkles size={16} /><span>توليد مهام تجريبية</span></button></div>
            </div>
            {demoNote && <p className="demo-note" role="status" data-testid="status-demo-generation">{demoNote}</p>}
            {sortedTasks.length ? <div className="task-table">
              <div className="table-head"><span>المهمة</span><span>المسؤول</span><span>الحالة</span></div>
              {sortedTasks.map((task, index) => <article className="task-row" key={task.id} data-testid={`row-task-${task.id}`}>
                <div className="task-info"><span className={`task-index task-index-${index % 3}`}>{String(index + 1).padStart(2, '0')}</span><div><strong data-testid={`text-task-title-${task.id}`}>{task.title}</strong><small>{task.detail}</small></div></div>
                <div className="task-owner"><span className={`avatar avatar-${Math.max(0, board.members.indexOf(task.owner)) % 4}`}>{task.owner ? task.owner.trim().charAt(0) : '?'}</span><label className="sr-only" htmlFor={`owner-${task.id}`}>المسؤول عن {task.title}</label><select id={`owner-${task.id}`} value={task.owner} onChange={(event) => setBoard((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, owner: event.target.value } : item) }))} data-testid={`select-owner-${task.id}`}><option value="">غير معيّن</option>{board.members.map((member, memberIndex) => <option value={member} key={`${member}-${memberIndex}`}>{member}</option>)}</select></div>
                <div className="task-status"><span className={`status-pill ${task.status === 'مكتملة' ? 'status-done' : task.status === 'قيد التنفيذ' ? 'status-active' : 'status-waiting'}`} data-testid={`status-task-${task.id}`}><i />{task.status}</span><label className="sr-only" htmlFor={`status-${task.id}`}>حالة {task.title}</label><select id={`status-${task.id}`} value={task.status} onChange={(event) => setBoard((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: event.target.value as TaskStatus } : item) }))} data-testid={`select-status-${task.id}`} aria-label={`تغيير حالة ${task.title}`}><option value="قيد الانتظار">قيد الانتظار</option><option value="قيد التنفيذ">قيد التنفيذ</option><option value="مكتملة">مكتملة</option></select></div>
              </article>)}
            </div> : <div className="empty-tasks"><div className="empty-task-mark"><Circle size={24} /></div><strong>لا توجد مهام بعد</strong><p>استخدموا زر توليد المهام التجريبية لعرض خطوات مقترحة لمشروعكم.</p><button type="button" onClick={generateDemoTasks} className="empty-generate" data-testid="button-generate-empty"><WandSparkles size={16} /> توليد مهام تجريبية</button></div>}
            <div className="tasks-footer"><span><Clock3 size={15} /> تتحدث المؤشرات تلقائياً عند تغيير الحالة</span><span><Check size={15} /> البيانات محفوظة محلياً</span></div>
          </section>
          <footer className="page-footer"><span>مساحة عمل تجريبية للهاكاثون</span><span>صُممت لتبقي الفريق على المسار</span></footer>
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
