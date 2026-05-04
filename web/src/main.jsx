import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Brain,
  BriefcaseBusiness,
  Check,
  Flame,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Dumbbell,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'aura:v1:daily-checkin';

const AURA_AREAS = [
  {
    id: 'mind',
    name: 'Mind',
    icon: Brain,
    color: '#4f8cff',
    prompt: 'Mental health, clarity, emotional control, and rest.',
    actions: ['10-minute reset walk', 'Write one honest thought', 'No-phone wind down'],
  },
  {
    id: 'body',
    name: 'Body',
    icon: Dumbbell,
    color: '#22a06b',
    prompt: 'Movement, nutrition, sleep, and physical confidence.',
    actions: ['Move for 20 minutes', 'Drink two full waters', 'Protein with next meal'],
  },
  {
    id: 'work',
    name: 'Work/School',
    icon: BriefcaseBusiness,
    color: '#8a63d2',
    prompt: 'Focus, discipline, learning, and momentum.',
    actions: ['Finish one priority block', 'Clean your task list', 'Study for 25 minutes'],
  },
  {
    id: 'social',
    name: 'Social',
    icon: HeartHandshake,
    color: '#e86f51',
    prompt: 'Friendships, family, communication, and presence.',
    actions: ['Text someone back', 'Give one real compliment', 'Make one plan'],
  },
  {
    id: 'purpose',
    name: 'Purpose',
    icon: Sun,
    color: '#d99221',
    prompt: 'Meaning, direction, values, and future self.',
    actions: ['Write tomorrow’s main aim', 'Do one thing your future self wants', 'Read 5 pages'],
  },
  {
    id: 'style',
    name: 'Style/Confidence',
    icon: ShieldCheck,
    color: '#0f9aa7',
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
      <section className="topbar" aria-label="Aura overview">
        <div>
          <p className="eyebrow">Aura Life OS</p>
          <h1>Raise every part of your life.</h1>
        </div>
        <button className="icon-button" type="button" onClick={resetToday} aria-label="Reset today's check-in">
          <RefreshCw size={18} />
        </button>
      </section>

      <section className="hero-panel">
        <div className="score-block">
          <div className="score-ring" aria-label={`Aura score ${auraScore}`}>
            <span>{auraScore}</span>
          </div>
          <div>
            <p className="eyebrow">Today’s aura</p>
            <h2>{scoreLabel(auraScore)}</h2>
            <p className="muted">Built from your area ratings and completed actions.</p>
          </div>
        </div>

        <div className="stat-grid">
          <Metric icon={Check} label="Actions" value={`${completedActions}/${totalActions}`} />
          <Metric icon={Star} label="Strongest" value={strongestArea.name} />
          <Metric icon={Flame} label="Focus" value={focusArea.name} />
        </div>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Daily check-in</p>
          <h2>Balance the six areas</h2>
        </div>
        <p className="muted">Rate honestly, then pick actions small enough to actually do today.</p>
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
          <h2>One line for the day</h2>
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
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AreaCard({ area, rating, completed, onRating, onAction }) {
  const Icon = area.icon;
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
      </header>

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
