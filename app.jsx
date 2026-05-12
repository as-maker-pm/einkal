// app.jsx — entry point, routing, theme, tweaks

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "builderLayout": "linear"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authStage, setAuthStage] = useStateApp("app");
  const [route, setRoute] = useStateApp("dashboard");
  const [openFlow, setOpenFlow] = useStateApp(null);
  const [navCollapsed, setNavCollapsed] = useStateApp(false);

  useEffectApp(() => {
    document.documentElement.dataset.theme = t.theme;
  }, [t.theme]);

  useEffectApp(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && authStage === "app") {
        e.preventDefault();
        setRoute("sync");
        setOpenFlow("new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authStage]);

  const handleNav = (id, payload) => {
    setRoute(id);
    if (id === "sync") {
      if (payload?.newFlow) setOpenFlow("new");
      else if (payload?.flowId) setOpenFlow(payload.flowId);
      else setOpenFlow(null);
    } else {
      setOpenFlow(null);
    }
  };

  if (authStage === "signin") return <SignIn onContinue={(d) => setAuthStage(d.isNew ? "onboarding" : "app")} onSkip={() => setAuthStage("app")} />;
  if (authStage === "onboarding") return <Onboarding onDone={() => setAuthStage("app")} />;

  return (
    <div className="app" style={{ gridTemplateColumns: navCollapsed ? "48px 1fr" : "240px 1fr", transition: "grid-template-columns 0.2s" }}>
      <Sidebar route={route} onNav={handleNav} collapsed={navCollapsed} onToggle={() => setNavCollapsed(v => !v)} />
      <main style={{ minWidth: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="fade-in" key={route + "-" + (openFlow || "")} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {route === "dashboard" && <DashboardScreen onNav={handleNav} />}
          {route === "calendars" && <CalendarsScreen />}
          {route === "sync"      && <SyncScreen openFlow={openFlow} setOpenFlow={setOpenFlow} builderLayout={t.builderLayout} />}
          {route === "booking"   && <BookingScreen />}
          {route === "team"      && <TeamScreen />}
          {route === "settings"  && <SettingsScreen />}
          {route === "billing"   && <BillingScreen />}
        </div>
      </main>

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme}
          options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Sync flow builder" />
        <TweakRadio label="Layout" value={t.builderLayout}
          options={[{ value: "linear", label: "Linear" }, { value: "canvas", label: "Canvas" }]}
          onChange={(v) => setTweak("builderLayout", v)} />
        <TweakSection label="Flow" />
        <TweakButton label="Restart auth flow" onClick={() => setAuthStage("signin")}>Sign-in screen</TweakButton>
        <TweakButton label="" onClick={() => setAuthStage("onboarding")}>Onboarding</TweakButton>
      </TweaksPanel>
    </div>
  );
}

function Root() {
  return (
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
