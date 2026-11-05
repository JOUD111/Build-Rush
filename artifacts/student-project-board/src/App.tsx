import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Activity, ArrowUpRight, Check, CheckCircle2, Circle, ClipboardList, Clock3, Layers3, Plus, Sparkles, Users, WandSparkles } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type TaskStatus = 'To do' | 'In progress' | 'Completed';
type Task = { id: string; title: string; detail: string; owner: string; status: TaskStatus };
type BoardState = { description: string; tasks: Task[]; members: string[] };

const legacyProjectDescription = 'منصة تساعد طلاب الجامعة على تبادل الكتب والمراجع الدراسية بسهولة، مع نظام بحث ومراجعات موثوقة.';
const statusTranslations: Record<string, TaskStatus> = {
  'To do': 'To do',
  'To Do': 'To do',
  'In progress': 'In progress',
  'In Progress': 'In progress',
  Completed: 'Completed',
  'قيد الانتظار': 'To do',
  'قيد التنفيذ': 'In progress',
  مكتملة: 'Completed',
};
const memberTranslations: Record<string, string> = {
  أحمد: 'Ahmed',
  سارة: 'Sarah',
  جود: 'Joud',
};
const taskTitleTranslations: Record<string, string> = {
  'تحليل المتطلبات': 'Requirements analysis',
  'تحليل المتطلبات وقراءة الواجب': 'Analyze requirements and review the syllabus',
  'تصميم قاعدة البيانات والواجهات': 'Database and interface design',
  'تنفيذ النظام': 'System implementation',
  'برمجة النظام والربط': 'Implement the system and connect its parts',
};
const taskDetailTranslations: Record<string, string> = {
  'تحديد احتياجات المستخدمين ورسم نطاق النسخة الأولى.': 'Define user needs and scope the first release.',
  'بناء مخطط البيانات وتدفق الشاشات الأساسية.': 'Map the data model and essential user flows.',
  'تطوير الوظائف الأساسية وربط أجزاء المنصة.': 'Build core features and connect the product.',
};

const initialBoard: BoardState = {
  description: 'A platform that helps university students exchange textbooks and study resources, with search and trusted reviews.',
  members: ['Ahmed', 'Sarah', 'Joud'],
  tasks: [
    { id: 'req-analysis', title: 'Requirements analysis', detail: 'Define user needs and scope the first release.', owner: 'Ahmed', status: 'Completed' },
    { id: 'data-interface', title: 'Database and interface design', detail: 'Map the data model and essential user flows.', owner: 'Sarah', status: 'In progress' },
    { id: 'system-build', title: 'System implementation', detail: 'Build core features and connect the product.', owner: 'Joud', status: 'To do' },
  ],
};

function normalizeStatus(status: unknown): TaskStatus | null {
  return typeof status === 'string' ? statusTranslations[status] ?? null : null;
}

function readBoard(): BoardState {
  try {
    const raw = localStorage.getItem('student-project-board-v1');
    if (!raw) return initialBoard;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return initialBoard;
    const candidate = value as Partial<BoardState>;
    const validMembers = Array.isArray(candidate.members) && candidate.members.every((name) => typeof name === 'string');
    const validTasks = Array.isArray(candidate.tasks) && candidate.tasks.every((task) =>
      !!task && typeof task === 'object' &&
      typeof task.id === 'string' && typeof task.title === 'string' &&
      typeof task.detail === 'string' && typeof task.owner === 'string' &&
      normalizeStatus(task.status) !== null,
    );
    if (!validMembers || !validTasks || typeof candidate.description !== 'string') return initialBoard;
    return {
      description: candidate.description === legacyProjectDescription ? initialBoard.description : candidate.description,
      members: (candidate.members as string[]).map((member) => memberTranslations[member] ?? member),
      tasks: (candidate.tasks as Task[]).map((task) => ({
        ...task,
        title: taskTitleTranslations[task.title] ?? task.title,
        detail: taskDetailTranslations[task.detail] ?? task.detail,
        owner: memberTranslations[task.owner] ?? task.owner,
        status: normalizeStatus(task.status) ?? 'To do',
      })),
    };
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
  const completed = board.tasks.filter((task) => task.status === 'Completed').length;
  const inProgress = board.tasks.filter((task) => task.status === 'In progress').length;
  const progress = board.tasks.length ? Math.round((completed / board.tasks.length) * 100) : 0;
  const sortedTasks = useMemo(() => board.tasks, [board.tasks]);
  const taskCountLabel = `${board.tasks.length} ${board.tasks.length === 1 ? 'task' : 'tasks'}`;
  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = memberInput.trim();
    if (!name) { setMemberError('Enter a member name first.'); return; }
    if (board.members.some((member) => member.toLocaleLowerCase() === name.toLocaleLowerCase())) { setMemberError('This name is already on the team.'); return; }
    setBoard((current) => ({ ...current, members: [...current.members, name] }));
    setMemberInput('');
    setMemberError('');
  }
  function generateDemoTasks() {
    setBoard((current) => ({
      ...current,
      tasks: [
        { id: 'req-analysis', title: 'Requirements analysis', detail: 'Define user needs and scope the first release.', owner: current.members[0] ?? '', status: 'To do' },
        { id: 'data-interface', title: 'Database and interface design', detail: 'Map the data model and essential user flows.', owner: current.members[1] ?? '', status: 'To do' },
        { id: 'system-build', title: 'System implementation', detail: 'Build core features and connect the product.', owner: current.members[2] ?? '', status: 'To do' },
      ],
    }));
    setDemoNote('Demo tasks created locally. You can update each owner and status below.');
  }
  return (
    <div className="workspace" dir="ltr">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Layers3 size={21} /></div><div><strong>Mihwar</strong><span>Your team workspace</span></div></div>
        <div className="side-label">WORKSPACE</div>
        <div className="side-current"><span className="side-dot" /><div><strong>Hackathon project</strong><small>Student team · Private workspace</small></div><ArrowUpRight size={16} /></div>
        <div className="side-label side-label-team">TEAM</div>
        <div className="side-members">
          {board.members.length ? board.members.map((member, index) => <div className="side-member" key={`${member}-${index}`} data-testid={`member-sidebar-${index}`}><span className={`avatar avatar-${index % 4}`}>{member.trim().charAt(0)}</span><span>{member}</span><i /></div>) : <p className="side-empty">Add teammates to get started.</p>}
        </div>
        <div className="sidebar-foot"><div className="foot-icon"><Activity size={17} /></div><div><strong>Every step moves you forward</strong><small>From idea to impact</small></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>Project dashboard</strong></div>
          <div className="topbar-meta"><span className="live-dot" /> Local demo <span className="topbar-divider" /><span className="team-count"><Users size={15} /> {board.members.length} {board.members.length === 1 ? 'member' : 'members'}</span></div>
        </header>
        <div className="content">
          <section className="page-heading">
            <div className="heading-copy"><div className="eyebrow"><span className="eyebrow-line" /> STUDENT HACKATHON <span className="eyebrow-year">TEAM WORKSPACE</span></div><h1>Welcome, team<span className="heading-period">.</span></h1><p>Bring your work together and keep every next step clear.</p></div>
            <div className="sprint-chip"><span className="sprint-icon"><Activity size={17} /></span><div><small>Current phase</small><strong>Prototype build</strong></div></div>
          </section>
          <section className="summary-grid" aria-label="Project summary">
            <article className="summary-card summary-progress" data-testid="summary-progress"><div className="summary-top"><span>Project completion</span><span className="summary-icon amber"><CheckCircle2 size={18} /></span></div><div className="summary-number">{progress}<small>%</small></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="summary-foot"><span>{completed} of {board.tasks.length} tasks complete</span><span className="summary-highlight">{progress}%</span></div></article>
            <article className="summary-card" data-testid="summary-active"><div className="summary-top"><span>In progress</span><span className="summary-icon teal"><Activity size={18} /></span></div><div className="summary-number">{inProgress}<small>{inProgress === 1 ? ' task' : ' tasks'}</small></div><div className="summary-caption">Work happening now</div><div className="summary-bottom-line teal-line" /></article>
            <article className="summary-card" data-testid="summary-team"><div className="summary-top"><span>Team members</span><span className="summary-icon navy"><Users size={18} /></span></div><div className="summary-number">{board.members.length}<small>{board.members.length === 1 ? ' member' : ' members'}</small></div><div className="summary-caption">One team, one shared goal</div><div className="summary-bottom-line navy-line" /></article>
          </section>
          <div className="main-columns">
            <section className="panel project-panel">
              <div className="panel-heading"><div className="section-icon"><ClipboardList size={19} /></div><div><h2>Project brief</h2><p>The idea your team is working on</p></div><span className="demo-badge">Demo workspace</span></div>
              <label className="sr-only" htmlFor="project-description">Project description</label>
              <textarea id="project-description" className="description-input" value={board.description} onChange={(event) => setBoard((current) => ({ ...current, description: event.target.value }))} placeholder="Write a short summary of your idea..." data-testid="input-project-description" />
              <div className="description-footer"><span><span className="save-dot" /> Saved on this device</span><span>{board.description.length} characters</span></div>
              <div className="idea-note"><Sparkles size={17} /><p>Keep your goal visible while you work through each task.</p></div>
            </section>
            <section className="panel team-panel">
              <div className="panel-heading"><div className="section-icon team-icon"><Users size={19} /></div><div><h2>Team members</h2><p>Add your teammates to this workspace</p></div><span className="member-count">{board.members.length}</span></div>
              <form className="member-form" onSubmit={addMember} noValidate>
                <label className="sr-only" htmlFor="member-name">New member name</label>
                <input id="member-name" value={memberInput} onChange={(event) => { setMemberInput(event.target.value); if (memberError) setMemberError(''); }} placeholder="Enter a member name" data-testid="input-member-name" aria-describedby={memberError ? 'member-error' : undefined} />
                <button type="submit" className="add-button" data-testid="button-add-member"><Plus size={17} /><span>Add</span></button>
              </form>
              {memberError && <p className="form-error" id="member-error" role="alert" data-testid="status-member-error">{memberError}</p>}
              <div className="member-list" aria-label="Team member list">
                {board.members.length ? board.members.map((member, index) => <div className="member-row" key={`${member}-${index}`} data-testid={`row-member-${index}`}><span className={`avatar avatar-${index % 4}`}>{member.trim().charAt(0)}</span><span className="member-name">{member}</span><span className="member-role">{index === 0 ? 'Team lead' : 'Member'}</span><span className="member-active"><i /> Active</span></div>) : <div className="empty-members"><Users size={20} /><strong>Your team starts here</strong><span>Add your first teammate using the field above.</span></div>}
              </div>
            </section>
          </div>
          <section className="panel tasks-panel">
            <div className="tasks-heading">
              <div className="panel-heading task-title"><div className="section-icon task-icon"><ClipboardList size={19} /></div><div><h2>Project tasks</h2><p>Track progress and make ownership clear</p></div></div>
              <div className="task-heading-end"><span className="task-total">{taskCountLabel}</span><button type="button" onClick={generateDemoTasks} className="generate-button" data-testid="button-generate-tasks"><WandSparkles size={16} /><span>Generate demo tasks</span></button></div>
            </div>
            {demoNote && <p className="demo-note" role="status" data-testid="status-demo-generation">{demoNote}</p>}
            {sortedTasks.length ? <div className="task-table">
              <div className="table-head"><span>Task</span><span>Owner</span><span>Status</span></div>
              {sortedTasks.map((task, index) => <article className="task-row" key={task.id} data-testid={`row-task-${task.id}`}>
                <div className="task-info"><span className={`task-index task-index-${index % 3}`}>{String(index + 1).padStart(2, '0')}</span><div><strong data-testid={`text-task-title-${task.id}`}>{task.title}</strong><small>{task.detail}</small></div></div>
                <div className="task-owner"><span className={`avatar avatar-${Math.max(0, board.members.indexOf(task.owner)) % 4}`}>{task.owner ? task.owner.trim().charAt(0) : '?'}</span><label className="sr-only" htmlFor={`owner-${task.id}`}>Assign {task.title}</label><select id={`owner-${task.id}`} value={task.owner} onChange={(event) => setBoard((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, owner: event.target.value } : item) }))} data-testid={`select-owner-${task.id}`}><option value="">Unassigned</option>{board.members.map((member, memberIndex) => <option value={member} key={`${member}-${memberIndex}`}>{member}</option>)}</select></div>
                <div className="task-status"><span className={`status-pill ${task.status === 'Completed' ? 'status-done' : task.status === 'In progress' ? 'status-active' : 'status-waiting'}`} data-testid={`status-task-${task.id}`}><i />{task.status}</span><label className="sr-only" htmlFor={`status-${task.id}`}>Status for {task.title}</label><select id={`status-${task.id}`} value={task.status} onChange={(event) => setBoard((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: event.target.value as TaskStatus } : item) }))} data-testid={`select-status-${task.id}`} aria-label={`Change status for ${task.title}`}><option value="To do">To do</option><option value="In progress">In progress</option><option value="Completed">Completed</option></select></div>
              </article>)}
            </div> : <div className="empty-tasks"><div className="empty-task-mark"><Circle size={24} /></div><strong>No tasks yet</strong><p>Generate demo tasks to see suggested next steps for your project.</p><button type="button" onClick={generateDemoTasks} className="empty-generate" data-testid="button-generate-empty"><WandSparkles size={16} /> Generate demo tasks</button></div>}
            <div className="tasks-footer"><span><Clock3 size={15} /> Dashboard updates when a status changes</span><span><Check size={15} /> Saved locally</span></div>
          </section>
          <footer className="page-footer"><span>Hackathon demo workspace</span><span>Made to keep your team moving</span></footer>
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
