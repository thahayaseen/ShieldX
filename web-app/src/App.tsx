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
import { heroesApi, missionsApi, incidentsApi } from './lib/api';
import type { Hero, Mission, Incident, HeroStatus, MissionStatus } from './types';

const INITIAL_HEROES: Hero[] = [
  {
    id: 'h-spiderman-1',
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
    id: 'h-thor-1',
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
    id: 'h-ironman-1',
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
    id: 'h-hulk-1',
    name: 'Bruce Banner',
    codename: 'Hulk',
    powers: ['Strength', 'Durability', 'Leaping', 'Rage'],
    status: 'busy',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    brandColor: '#2e7d32',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'h-cap-1',
    name: 'Steve Rogers',
    codename: 'Captain America',
    powers: ['Shield Mastery', 'Tactics', 'Peak Human Strength'],
    status: 'offline',
    location: { lat: 11.2912, lng: 75.795, label: 'Kozhikode Beach' },
    brandColor: '#0277bd',
    createdAt: '',
    updatedAt: '',
  },
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-01',
    title: 'Commercial Complex Structural Failure',
    description: 'Catastrophic beam collapse at Calicut Commercial Complex. Multiple civilians trapped in lower levels.',
    severity: 'critical',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    status: 'reported',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inc-02',
    title: 'High-Voltage Harbor Anomaly',
    description: 'Surge of unexplained electrical discharge near deep-water terminal.',
    severity: 'high',
    location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
    status: 'dispatched',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inc-03',
    title: 'Chemical Tanker Breach on Highway',
    description: 'Tanker collision on NH66 Bypass spilling volatile liquid. Hazardous perimeter required.',
    severity: 'medium',
    location: { lat: 11.2721, lng: 75.8112, label: 'NH66 Bypass' },
    status: 'reported',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-101',
    title: 'BUILDING COLLAPSE RESCUE',
    description: 'Provide immediate structural stabilization and extract civilians from Sector 1.',
    priority: 'critical',
    status: 'pending',
    location: { lat: 11.2588, lng: 75.7804, label: 'Calicut City Center' },
    requiredPowers: ['Strength', 'Rescue', 'Durability'],
    assignedHeroId: 'h-hulk-1',
    assignedHero: INITIAL_HEROES[3],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm-102',
    title: 'HARBOR ELECTRICAL ISOLATION',
    description: 'Absorb and neutralize lightning discharges at Beypore Port terminal.',
    priority: 'high',
    status: 'en_route',
    location: { lat: 11.2411, lng: 75.7725, label: 'Beypore Port' },
    requiredPowers: ['Energy Absorption', 'Flight'],
    assignedHeroId: 'h-thor-1',
    assignedHero: INITIAL_HEROES[1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function CommandDashboard() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  const fetchLiveState = async () => {
    try {
      const [h, m, inc] = await Promise.allSettled([
        heroesApi.getAll(),
        missionsApi.getAll(),
        incidentsApi.getAll(),
      ]);
      if (h.status === 'fulfilled' && h.value?.length) setHeroes(h.value);
      if (m.status === 'fulfilled' && m.value?.length) setMissions(m.value);
      if (inc.status === 'fulfilled' && inc.value?.length) setIncidents(inc.value);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchLiveState();

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
      await heroesApi.updateStatus(heroId, status);
    } catch {
      // ignore
    }
  };

  const handleUpdateMissionStatus = async (missionId: string, status: MissionStatus) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status } : m))
    );
    try {
      await missionsApi.updateStatus(missionId, status);
    } catch {
      // ignore
    }
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
    setMissions((prev) => [newMission, ...prev]);
    setIncidents((prev) =>
      prev.map((i) => (i.id === newMission.incidentId ? { ...i, status: 'dispatched' } : i))
    );
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
            <Heroes heroes={heroes} onUpdateStatus={handleUpdateHeroStatus} />
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
