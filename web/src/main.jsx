import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  HeartHandshake,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Dumbbell,
  Zap,
} from 'lucide-react';
import heroImage from './assets/aura-hero.png';
import './styles.css';

const STORAGE_KEY = 'aura:v1:daily-checkin';
const PROFILE_KEY = 'aura:v1:profile';

const AURA_AREAS = [
  {
    id: 'mind',
    name: 'Mind',
    icon: Brain,
    color: '#4d7cff',
    prompt: 'Mental health, clarity, emotional control, and rest.',
    actions: ['10-minute reset walk', 'Write one honest thought', 'No-phone wind down'],
  },
  {
    id: 'body',
    name: 'Body',
    icon: Dumbbell,
    color: '#18a86b',
    prompt: 'Movement, nutrition, sleep, and physical confidence.',
    actions: ['Move for 20 minutes', 'Drink two full waters', 'Protein with next meal'],
  },
  {
    id: 'work',
    name: 'Work/School',
    icon: BriefcaseBusiness,
    color: '#8d5cf6',
    prompt: 'Focus, discipline, learning, and momentum.',
    actions: ['Finish one priority block', 'Clean your task list', 'Study for 25 minutes'],
  },
  {
    id: 'social',
    name: 'Social',
    icon: HeartHandshake,
    color: '#ff6b4a',
    prompt: 'Friendships, family, communication, and presence.',
    actions: ['Text someone back', 'Give one real compliment', 'Make one plan'],
  },
  {
    id: 'purpose',
    name: 'Purpose',
    icon: Sun,
    color: '#f2a51a',
    prompt: 'Meaning, direction, values, and future self.',
    actions: ['Write tomorrow’s main aim', 'Do one thing your future self wants', 'Read 5 pages'],
  },
  {
    id: 'style',
    name: 'Style/Confidence',
    icon: ShieldCheck,
    color: '#00a9b7',
    prompt: 'Self-respect, grooming, style, and how you carry yourself.',
    actions: ['Reset your room fit', 'Clean up one personal detail', 'Stand tall for the day'],
  },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultState() {
  return {
    date: todayKey(),
    ratings: Object.fromEntries(AURA_AREAS.map((area) => [area.id, 5])),
    completed: {},
    reflection: '',
  };
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(10, Math.max(1, Math.round(rating)));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return createDefaultState();
    const defaultState = createDefaultState();
    return {
      ...defaultState,
      ...parsed,
      ratings: Object.fromEntries(
        AURA_AREAS.map((area) => [area.id, normalizeRating(parsed.ratings?.[area.id] ?? defaultState.ratings[area.id])]),
      ),
      completed: parsed.completed || {},
    };
  } catch {
    return createDefaultState();
  }
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.name?.trim()) return null;
    return {
      name: parsed.name.trim(),
      createdAt: parsed.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function scoreLabel(score) {
  if (score >= 86) return 'Radiating';
  if (score >= 70) return 'Locked in';
  if (score >= 55) return 'Building';
  return 'Reset';
}

function buildAuraDiagnosis({ auraScore, completed, completedActions, focusArea, hasReflection, ratings, strongestArea }) {
  const ratingsByArea = AURA_AREAS.map((area) => ({
    area,
    doneCount: area.actions.filter((_, index) => completed[`${area.id}:${index}`]).length,
    rating: normalizeRating(ratings[area.id]),
  }));
  const highestRating = Math.max(...ratingsByArea.map((item) => item.rating));
  const lowestRating = Math.min(...ratingsByArea.map((item) => item.rating));
  const ratingSpread = highestRating - lowestRating;
  const balanced = ratingSpread <= 1;
  const label = scoreLabel(auraScore);
  const focusData = ratingsByArea.find((item) => item.area.id === focusArea.id);

  const incompleteFromFocus = focusArea.actions
    .map((action, index) => ({ action, key: `${focusArea.id}:${index}` }))
    .filter((item) => !completed[item.key])
    .map((item) => item.action);

  const lowestCompletionAreas = [...ratingsByArea].sort((a, b) => {
    if (a.doneCount !== b.doneCount) return a.doneCount - b.doneCount;
    return a.rating - b.rating;
  });

  const backupMoves = lowestCompletionAreas.flatMap(({ area }) =>
    area.actions.filter((_, index) => !completed[`${area.id}:${index}`]),
  );
  const recommendedMoves = [...new Set([...incompleteFromFocus, ...backupMoves])];
  const nextMoves = recommendedMoves.length ? recommendedMoves.slice(0, 3) : ['Lock tomorrow’s main move'];

  const summary = balanced
    ? `${strongestArea.name} is steady, and nothing is wildly leaking energy. Now make the day real with action.`
    : `${strongestArea.name} is carrying you, but ${focusArea.name} is dragging the signal. That is the lever today.`;

  const coachLine =
    completedActions === 0
      ? `Your aura is in ${label.toLowerCase()} mode. Do one move before you negotiate with the day.`
      : `You have ${completedActions} move${completedActions === 1 ? '' : 's'} logged. Keep pressure on ${focusArea.name}.`;

  const reflectionPrompt = hasReflection
    ? 'Reflection is locked. Now prove it with one clean move.'
    : `Before you close the loop, write one line on why ${focusArea.name} needs attention.`;

  return {
    coachLine,
    focusArea,
    focusRating: focusData?.rating ?? lowestRating,
    nextMoves,
    reflectionPrompt,
    strongestArea,
    summary,
    title: `${label} aura`,
  };
}

function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totalActions = AURA_AREAS.reduce((sum, area) => sum + area.actions.length, 0);
  const completedActions = AURA_AREAS.reduce(
    (sum, area) => sum + area.actions.filter((_, index) => state.completed[`${area.id}:${index}`]).length,
    0,
  );
  const ratingAverage = useMemo(() => {
    const total = AURA_AREAS.reduce((sum, area) => sum + Number(state.ratings[area.id] || 0), 0);
    return total / AURA_AREAS.length;
  }, [state.ratings]);
  const auraScore = Math.round(ratingAverage * 8 + (completedActions / totalActions) * 20);
  const progressPercent = Math.round((completedActions / totalActions) * 100);
  const strongestArea = AURA_AREAS.reduce((best, area) =>
    state.ratings[area.id] > state.ratings[best.id] ? area : best,
  );
  const focusArea = AURA_AREAS.reduce((low, area) =>
    state.ratings[area.id] < state.ratings[low.id] ? area : low,
  );
  const diagnosis = buildAuraDiagnosis({
    auraScore,
    completed: state.completed,
    completedActions,
    focusArea,
    hasReflection: state.reflection.trim().length > 0,
    ratings: state.ratings,
    strongestArea,
  });

  function updateRating(areaId, value) {
    setState((current) => ({
      ...current,
      ratings: { ...current.ratings, [areaId]: normalizeRating(value) },
    }));
  }

  function toggleAction(areaId, actionIndex) {
    const key = `${areaId}:${actionIndex}`;
    setState((current) => ({
      ...current,
      completed: { ...current.completed, [key]: !current.completed[key] },
    }));
  }

  function resetToday() {
    setState(createDefaultState());
  }

  function createProfile(name) {
    const nextProfile = {
      name: name.trim() || 'You',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }

  function signOut() {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }

  if (!profile) {
    return <SplashPage onCreateProfile={createProfile} />;
  }

  return (
    <main className="app-shell">
      <nav className="app-nav" aria-label="Aura account">
        <div className="brand-mark">
          <Sparkles size={18} />
          <span>Aura</span>
        </div>
        <div className="nav-profile">
          <span>{profile.name}</span>
          <button className="icon-action" type="button" onClick={signOut} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </nav>

      <section className="hero" style={{ '--hero-image': `url(${heroImage})` }} aria-label="Aura overview">
        <div className="hero-overlay">
          <p className="hero-kicker">Welcome back, {profile.name}</p>
          <h1>Refine the life behind your aura.</h1>
          <a className="primary-action" href="#daily-check-in">
            Begin today
          </a>
        </div>
      </section>

      <section className="dashboard-overview" aria-label="Today's aura dashboard">
        <div className="overview-copy">
          <p className="eyebrow">Today</p>
          <h2>A quiet command center for your next level.</h2>
          <p className="muted">
            Bring your mind, body, ambition, relationships, purpose, and confidence into one daily rhythm.
          </p>
        </div>
        <aside className="score-console">
          <div className="console-header">
            <span>Aura score</span>
            <strong>{auraScore}/100</strong>
          </div>
          <div
            className="score-ring"
            style={{ '--score-deg': `${auraScore * 3.6}deg` }}
            aria-label={`Aura score ${auraScore}`}
          >
            <span>{auraScore}</span>
            <small>/100</small>
          </div>
          <div className="momentum-bar" aria-label={`${progressPercent}% of actions completed`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>{completedActions} of {totalActions} actions complete today</p>
        </aside>
        <div className="stat-grid">
          <Metric icon={Activity} label="Action flow" value={`${completedActions}/${totalActions}`} />
          <Metric icon={Trophy} label="Strongest signal" value={strongestArea.name} />
          <Metric icon={Target} label="Next focus" value={focusArea.name} />
        </div>
        <DiagnosisPanel diagnosis={diagnosis} />
        <button className="reset-action" type="button" onClick={resetToday}>
          <RefreshCw size={16} />
          Reset today
        </button>
      </section>

      <section className="section-heading" id="daily-check-in">
        <div>
          <p className="eyebrow">Daily check-in</p>
          <h2>Dial in the six signals.</h2>
        </div>
        <p className="muted">Rate honestly, then stack actions that make the day feel earned.</p>
      </section>

      <section className="area-grid">
        {AURA_AREAS.map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            rating={state.ratings[area.id]}
            completed={state.completed}
            onRating={updateRating}
            onAction={toggleAction}
          />
        ))}
      </section>

      <section className="reflection-panel">
        <div>
          <p className="eyebrow">Reflection</p>
          <h2>Lock one insight</h2>
        </div>
        <textarea
          value={state.reflection}
          onChange={(event) => setState((current) => ({ ...current, reflection: event.target.value }))}
          placeholder="What would make tomorrow feel one point better?"
          aria-label="Daily reflection"
        />
      </section>
    </main>
  );
}

function SplashPage({ onCreateProfile }) {
  const [name, setName] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onCreateProfile(name);
  }

  return (
    <main className="splash-page">
      <section className="splash-hero" style={{ '--hero-image': `url(${heroImage})` }} aria-label="Aura sign in">
        <nav className="splash-nav">
          <div className="brand-mark">
            <Sparkles size={18} />
            <span>Aura</span>
          </div>
          <span>Local profile</span>
        </nav>

        <div className="splash-content">
          <div className="splash-copy">
            <p className="eyebrow">Life OS</p>
            <h1>Build the signal behind your aura.</h1>
            <p>
              Check your mind, body, ambition, relationships, purpose, and confidence before the day starts moving you.
            </p>
          </div>

          <form className="signin-panel" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">Start local</p>
              <h2>Enter Aura</h2>
            </div>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lucas"
                autoComplete="given-name"
              />
            </label>
            <button className="primary-action signin-action" type="submit">
              Continue
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function DiagnosisPanel({ diagnosis }) {
  return (
    <aside className="diagnosis-panel" aria-label="Daily aura diagnosis">
      <div className="diagnosis-copy">
        <p className="eyebrow">Daily diagnosis</p>
        <h3>{diagnosis.title}</h3>
        <p>{diagnosis.summary}</p>
      </div>
      <div className="diagnosis-pulse" style={{ '--area-color': diagnosis.focusArea.color }}>
        <span>Focus</span>
        <strong>{diagnosis.focusArea.name}</strong>
        <small>{diagnosis.focusRating}/10 signal</small>
      </div>
      <div className="diagnosis-coach">
        <div className="coach-icon">
          <Zap size={18} />
        </div>
        <p>{diagnosis.coachLine}</p>
      </div>
      <div className="diagnosis-moves">
        <span>Next moves</span>
        {diagnosis.nextMoves.map((move) => (
          <div className="diagnosis-move" key={move}>
            <Check size={14} />
            {move}
          </div>
        ))}
      </div>
      <p className="diagnosis-reflection">{diagnosis.reflectionPrompt}</p>
    </aside>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AreaCard({ area, rating, completed, onRating, onAction }) {
  const Icon = area.icon;
  const doneCount = area.actions.filter((_, index) => completed[`${area.id}:${index}`]).length;
  return (
    <article className="area-card" style={{ '--area-color': area.color }}>
      <header>
        <div className="area-icon">
          <Icon size={20} />
        </div>
        <div>
          <h3>{area.name}</h3>
          <p>{area.prompt}</p>
        </div>
        <div className="area-score">{rating}</div>
      </header>

      <div className="area-progress" aria-label={`${area.name} level ${rating} out of 10`}>
        <span style={{ width: `${rating * 10}%` }} />
      </div>

      <label className="rating-row">
        <span>Current level</span>
        <strong>{rating}/10</strong>
        <input
          type="range"
          min="1"
          max="10"
          value={rating}
          onChange={(event) => onRating(area.id, event.target.value)}
          aria-label={`${area.name} rating`}
        />
      </label>

      <div className="action-list">
        <div className="action-meta">
          <span>Today’s moves</span>
          <strong>{doneCount}/{area.actions.length}</strong>
        </div>
        {area.actions.map((action, index) => {
          const key = `${area.id}:${index}`;
          return (
            <button
              className={completed[key] ? 'action done' : 'action'}
              key={action}
              type="button"
              onClick={() => onAction(area.id, index)}
            >
              <span>{completed[key] ? <Check size={15} /> : <Sparkles size={15} />}</span>
              {action}
              <ChevronRight className="action-arrow" size={15} />
            </button>
          );
        })}
      </div>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
