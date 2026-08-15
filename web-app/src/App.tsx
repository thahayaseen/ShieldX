import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { PageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Overview } from './pages/Overview';
import { Heroes } from './pages/Heroes';
import { Missions } from './pages/Missions';
import { Incidents } from './pages/Incidents';
import { AiDispatch } from './pages/AiDispatch';
import { AIChat } from './pages/AIChat';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { onSocketEvent } from './lib/socket';
import { heroesApi, incidentsApi } from './lib/api';
import {
  fetchHeroesFromSupabase,
  fetchMissionsFromSupabase,
  createMissionInSupabase,
  updateMissionStatusInSupabase,
  subscribeToHeroesRealtime,
  subscribeToMissionsRealtime,
  updateHeroInSupabase,
  formatDbHero,
  formatDbMission,
} from './lib/supabase';
import type { Hero, Mission, Incident, HeroStatus, MissionStatus } from './types';

const INITIAL_HEROES: Hero[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Peter Parker',
    codename: 'Spider-Man',
    powers: ['Agility', 'Web-Slinging', 'Spider-Sense', 'Wall-Crawling'],
    status: 'online',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut Sector 4' },
    brandColor: '#e53935',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '22222222-0000-0000-0000-000000000002',
    name: 'Thor Odinson',
    codename: 'Thor',
    powers: ['Lightning', 'Flight', 'Super Strength'],
    status: 'on_mission',
    location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
    brandColor: '#1565c0',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '33333333-0000-0000-0000-000000000003',
    name: 'Tony Stark',
    codename: 'Iron Man',
    powers: ['Flight', 'Repulsors', 'Genius Intellect', 'Armor Systems'],
    status: 'online',
    location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
    brandColor: '#ff8f00',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '44444444-0000-0000-0000-000000000004',
    name: 'Bruce Banner',
    codename: 'Hulk',
    powers: ['Strength', 'Durability', 'Leaping', 'Rage'],
    status: 'busy',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    brandColor: '#2e7d32',
    createdAt: '',
    updatedAt: '',
  },
];

function CommandDashboard() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const reloadHeroesFromSupabase = async () => {
    const liveHeroes = await fetchHeroesFromSupabase();
    if (liveHeroes && liveHeroes.length > 0) {
      setHeroes(liveHeroes);
    }
  };

  const reloadMissionsFromSupabase = async () => {
    const liveMissions = await fetchMissionsFromSupabase();
    if (liveMissions && liveMissions.length > 0) {
      setMissions(liveMissions);
    }
  };

  const fetchLiveState = async () => {
    try {
      await Promise.allSettled([
        reloadHeroesFromSupabase(),
        reloadMissionsFromSupabase(),
      ]);

      const [inc] = await Promise.allSettled([
        incidentsApi.getAll(),
      ]);
      if (inc.status === 'fulfilled' && inc.value?.length) setIncidents(inc.value);
    } catch {
      // fallback to initial state
    }
  };

  useEffect(() => {
    fetchLiveState();

    // Subscribe to realtime Supabase hero updates (new signups / approvals / status toggles)
    const unsubRealtimeHeroes = subscribeToHeroesRealtime((payload) => {
      if (payload?.new && payload?.new?.id) {
        const updatedHero = formatDbHero(payload.new);
        setHeroes((prev) => {
          const exists = prev.some((h) => h.id === updatedHero.id);
          if (exists) {
            return prev.map((h) => (h.id === updatedHero.id ? updatedHero : h));
          }
          return [updatedHero, ...prev];
        });
      }
    });

    // Subscribe to realtime Supabase mission updates (new dispatches)
    const unsubRealtimeMissions = subscribeToMissionsRealtime((payload) => {
      if (payload?.new && payload?.new?.id) {
        const updatedMission = formatDbMission(payload.new);
        setMissions((prev) => [
          updatedMission,
          ...prev.filter((m) => m.id !== updatedMission.id),
        ]);
      }
    });

    const unsubMission = onSocketEvent('mission:assigned', ({ mission }) => {
      setMissions((prev) => [mission, ...prev.filter((m) => m.id !== mission.id)]);
    });

    const unsubMissionStatus = onSocketEvent('mission:statusChanged', ({ missionId, status }) => {
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, status } : m))
      );
    });

    const unsubHero = onSocketEvent('hero:statusChanged', ({ heroId, status }) => {
      setHeroes((prev) =>
        prev.map((h) => (h.id === heroId ? { ...h, status } : h))
      );
    });

    const unsubInc = onSocketEvent('incident:created', ({ incident }) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    return () => {
      unsubRealtimeHeroes();
      unsubRealtimeMissions();
      unsubMission();
      unsubMissionStatus();
      unsubHero();
      unsubInc();
    };
  }, []);

  const handleUpdateHeroStatus = async (heroId: string, status: HeroStatus) => {
    setHeroes((prev) =>
      prev.map((h) => (h.id === heroId ? { ...h, status } : h))
    );
    try {
      await updateHeroInSupabase(heroId, { status });
      await heroesApi.updateStatus(heroId, status);
    } catch {
      // ignore
    }
  };

  const handleUpdateHeroLocal = (updatedHero: Hero) => {
    setHeroes((prev) => [
      updatedHero,
      ...prev.filter((h) => h.id !== updatedHero.id),
    ]);
  };

  const handleUpdateMissionStatus = async (missionId: string, status: MissionStatus) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status } : m))
    );
    await updateMissionStatusInSupabase(missionId, status);
  };

  const handleReportIncident = async (inc: Partial<Incident>) => {
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      title: inc.title || 'Untitled Emergency',
      description: inc.description || '',
      severity: inc.severity || 'critical',
      location: inc.location || { lat: 11.2588, lng: 75.7804, label: 'Sector' },
      status: 'reported',
      createdAt: new Date().toISOString(),
    };
    setIncidents((prev) => [newInc, ...prev]);
    try {
      await incidentsApi.report(newInc);
    } catch {
      // ignore
    }
  };

  const handleDispatchMission = async (newMission: Mission) => {
    // 1. Optimistic UI update on Command Center dashboard
    setMissions((prev) => [newMission, ...prev]);
    setIncidents((prev) =>
      prev.map((i) => (i.id === newMission.incidentId ? { ...i, status: 'dispatched' } : i))
    );

    // 2. Persist to Supabase DB -> broadcasts Realtime WebSocket to Mobile Hero Wristband!
    const created = await createMissionInSupabase({
      title: newMission.title,
      description: newMission.description,
      priority: newMission.priority,
      location: newMission.location,
      requiredPowers: newMission.requiredPowers,
      assignedHeroId: newMission.assignedHeroId || newMission.assignedHero?.id,
      aiReasoning: newMission.aiReasoning,
    });

    if (created) {
      setMissions((prev) => [created, ...prev.filter((m) => m.id !== newMission.id)]);
    }
  };

  const criticalAlerts = incidents.filter((i) => i.severity === 'critical').length;
  const onlineCount = heroes.filter((h) => h.status === 'online').length;
  const activeCount = missions.filter((m) => m.status !== 'complete').length;

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activeMissionCount={activeCount}
        onlineHeroCount={onlineCount}
      />

      <div className="main-content">
        <TopBar criticalAlertCount={criticalAlerts} />

        <main className="page-container">
          {activePage === 'overview' && (
            <Overview
              heroes={heroes}
              missions={missions}
              incidents={incidents}
              onNavigateToDispatch={() => setActivePage('dispatch')}
              onNavigateToChat={() => setActivePage('chat')}
            />
          )}

          {activePage === 'heroes' && (
            <Heroes
              heroes={heroes}
              onUpdateStatus={handleUpdateHeroStatus}
              onRefreshHeroes={reloadHeroesFromSupabase}
              onUpdateHeroLocal={handleUpdateHeroLocal}
            />
          )}

          {activePage === 'missions' && (
            <Missions missions={missions} onUpdateStatus={handleUpdateMissionStatus} />
          )}

          {activePage === 'incidents' && (
            <Incidents incidents={incidents} onReportIncident={handleReportIncident} />
          )}

          {activePage === 'dispatch' && (
            <AiDispatch
              incidents={incidents}
              heroes={heroes}
              onDispatchMission={handleDispatchMission}
            />
          )}

          {activePage === 'chat' && <AIChat />}
        </main>
      </div>
    </div>
  );
}

function MainAppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#05070f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00d4ff',
          fontFamily: 'monospace',
          fontSize: '14px',
          letterSpacing: '2px',
        }}>
        INITIALIZING A.E.G.I.S. GUARDIAN AUTHENTICATION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <CommandDashboard />;
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
