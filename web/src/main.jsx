import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Dumbbell,
} from 'lucide-react';
import heroImage from './assets/aura-hero.png';
import './styles.css';

const STORAGE_KEY = 'aura:v1:daily-checkin';

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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return createDefaultState();
    return {
      ...createDefaultState(),
      ...parsed,
      ratings: { ...createDefaultState().ratings, ...parsed.ratings },
      completed: parsed.completed || {},
    };
  } catch {
    return createDefaultState();
  }
}

function App() {
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

  function updateRating(areaId, value) {
    setState((current) => ({
      ...current,
      ratings: { ...current.ratings, [areaId]: Number(value) },
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

  return (
    <main className="app-shell">
      <section className="hero" style={{ '--hero-image': `url(${heroImage})` }} aria-label="Aura overview">
        <div className="hero-overlay">
          <div className="brand-mark">
            <Sparkles size={18} />
            <span>Aura</span>
          </div>
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

function scoreLabel(score) {
  if (score >= 86) return 'Radiating';
  if (score >= 70) return 'Locked in';
  if (score >= 55) return 'Building momentum';
  if (score >= 40) return 'Needs attention';
  return 'Reset day';
}

createRoot(document.getElementById('root')).render(<App />);
