// src/components/pages/FinalsTimer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   Finals Timer — Projector up top, SOP + Dev panel below
   - Big 3–2–1, drift-free countdown (ceiling seconds)
   - Pause/Resume, Apply (MM:SS), ±10s in any phase
   - Fullscreen (entire page, F / Esc), Blackout (B / Esc / click)
   - Dev panel shows the exact PS1 (embedded) with wrap/copy/download
   ============================================================ */

/* ---------------- Embedded developer script (verbatim) ---------------- */

const PS_TIMER = String.raw`<# ================================================================
   SCC Finals Timer — v6.4 (NO FLASH, ±10s FIXED)
   • Big 3–2–1 in the main clock, then exact countdown
   • Beeps: start (short), 60s (subtle), end (triple)
   • Pause/Resume, Apply (MM:SS), ±10s (works in idle/run/paused), Fullscreen
   • Drift-free seconds (Stopwatch + absolute end anchor + CEILING)
================================================================ #>

if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') {
  powershell -STA -File $PSCommandPath; exit
}

# ---------- CONFIG ----------
$script:DefaultSeconds = 240       # 4:00 default
$script:RoundTotal     = 240
$script:UpdateMs       = 33        # ~30 Hz UI refresh
$script:PreSeconds     = 3         # 3–2–1

# ---------- THEME ----------
$Theme = @{
  WindowBg    = "#111111"
  PrimaryText = "#FF2B2B"
  AccentText  = "#FFFFFF"
  ButtonBg    = "#8A0000"
  ButtonFg    = "#FFFFFF"
  Border      = "#444444"
}

# ---------- AUDIO ----------
Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase
Add-Type -AssemblyName System.Windows.Forms
function Invoke-Beep([int]$f=850,[int]$d=140){ try{[Console]::Beep($f,$d)}catch{[System.Media.SystemSounds]::Beep.Play()} }
function Beep-Start(){ Invoke-Beep 1000 180 }
function Beep-60()   { Invoke-Beep 900  140 }
function Beep-End()  { Invoke-Beep 700 160; Start-Sleep 0.12; Invoke-Beep 650 160; Start-Sleep 0.12; Invoke-Beep 600 220 }

# ---------- UI ----------
$Xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="SCC Finals Timer" Height="640" Width="1120"
        WindowStartupLocation="CenterScreen" ResizeMode="CanResize"
        Background="$($Theme.WindowBg)">
  <DockPanel LastChildFill="True">
    <StackPanel DockPanel.Dock="Top" Orientation="Vertical" Margin="0,10,0,6">
      <TextBlock Text="SCC Finals Timer" HorizontalAlignment="Center"
                 Foreground="$($Theme.AccentText)" FontFamily="Segoe UI" FontSize="22"/>
    </StackPanel>

    <Grid>
      <Grid.RowDefinitions>
        <RowDefinition Height="*"/>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="Auto"/>
      </Grid.RowDefinitions>

      <!-- BIG CLOCK -->
      <StackPanel Grid.Row="0" HorizontalAlignment="Center" VerticalAlignment="Center">
        <TextBlock x:Name="TimeText" Text="04:00" HorizontalAlignment="Center"
                   Foreground="$($Theme.PrimaryText)" FontFamily="Segoe UI"
                   FontSize="240" FontWeight="Bold"/>
        <TextBlock x:Name="StatusText" Text="" HorizontalAlignment="Center"
                   Foreground="$($Theme.AccentText)" FontFamily="Segoe UI"
                   FontSize="44" Margin="0,8,0,0"/>
      </StackPanel>

      <!-- Controls Row 1 -->
      <StackPanel Grid.Row="1" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,18,0,12">
        <Button x:Name="StartInstantBtn" Content="Start" Width="160" Height="54" Margin="8,0"
                Background="$($Theme.ButtonBg)" Foreground="$($Theme.ButtonFg)" FontSize="18"/>
        <Button x:Name="StartPrepBtn" Content="Start w/ 3–2–1" Width="200" Height="54" Margin="8,0"
                Background="$($Theme.ButtonBg)" Foreground="$($Theme.ButtonFg)" FontSize="18"/>
        <Button x:Name="PauseBtn" Content="Pause" Width="140" Height="54" Margin="8,0"
                Background="$($Theme.ButtonBg)" Foreground="$($Theme.ButtonFg)" FontSize="18" IsEnabled="False"/>
        <Button x:Name="ResetBtn" Content="Reset" Width="140" Height="54" Margin="8,0"
                Background="$($Theme.ButtonBg)" Foreground="$($Theme.ButtonFg)" FontSize="18"/>
        <Button x:Name="FullscreenBtn" Content="Fullscreen" Width="160" Height="54" Margin="8,0"
                Background="$($Theme.ButtonBg)" Foreground="$($Theme.ButtonFg)" FontSize="18"/>
      </StackPanel>

      <!-- Controls Row 2 -->
      <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,16">
        <TextBox x:Name="ManualTimeBox" Width="140" Height="44" Margin="8,0"
                 Background="#1C1C1C" Foreground="#FFFFFF"
                 FontSize="20" TextAlignment="Center" BorderBrush="#444444"
                 BorderThickness="1" Text="04:00"/>
        <Button x:Name="ApplyTimeBtn" Content="Apply Time (MM:SS)" Width="210" Height="44" Margin="8,0"
                Background="#8A0000" Foreground="#FFFFFF" FontSize="16"/>
        <Button x:Name="Minus10Btn" Content="-10s" Width="110" Height="44" Margin="16,0,8,0"
                Background="#8A0000" Foreground="#FFFFFF" FontSize="18"/>
        <Button x:Name="Plus10Btn" Content="+10s" Width="110" Height="44" Margin="8,0"
                Background="#8A0000" Foreground="#FFFFFF" FontSize="18"/>
      </StackPanel>
    </Grid>
  </DockPanel>
</Window>
"@

# ---------- Build UI ----------
$reader = New-Object System.Xml.XmlNodeReader ([xml]$Xaml)
$Window        = [System.Windows.Markup.XamlReader]::Load($reader)
$TimeText      = $Window.FindName('TimeText')
$StatusText    = $Window.FindName('StatusText')
$StartInstantBtn=$Window.FindName('StartInstantBtn')
$StartPrepBtn  = $Window.FindName('StartPrepBtn')
$PauseBtn      = $Window.FindName('PauseBtn')
$ResetBtn      = $Window.FindName('ResetBtn')
$FullscreenBtn = $Window.FindName('FullscreenBtn')
$ManualTimeBox = $Window.FindName('ManualTimeBox')
$ApplyTimeBtn  = $Window.FindName('ApplyTimeBtn')
$Minus10Btn    = $Window.FindName('Minus10Btn')
$Plus10Btn     = $Window.FindName('Plus10Btn')

# ---------- STATE ----------
$script:phase        = 'idle'     # idle | pre | run | paused_run | done
$script:runSW        = [System.Diagnostics.Stopwatch]::new()
$script:RoundEndTick = 0.0
$script:beepedAt60   = $false
$script:preRemaining = 0

# ---------- HELPERS ----------
function Set-TimeText([int]$s){
  if ($s -lt 0) { $s = 0 }
  $m = [math]::Floor($s/60); $sec = $s % 60
  $TimeText.Text = "{0:00}:{1:00}" -f $m,$sec
}
function Parse-Time{
  $txt = $ManualTimeBox.Text.Trim()
  if ($txt -match '^(?<m>\d{1,3}):(?<s>\d{2})$') {
    $m = [int]$Matches.m; $s = [int]$Matches.s
    if ($s -ge 60) { $s = 59 }          # e.g., 6:77 -> 6:59
    return [math]::Max(0, $m*60 + $s)
  } else { return $script:DefaultSeconds }
}
function GetRemaining {
  if ($script:phase -in 'run','paused_run') {
    $freq = [double][System.Diagnostics.Stopwatch]::Frequency
    $now  = [double]$script:runSW.ElapsedTicks
    $r    = ($script:RoundEndTick - $now) / $freq
    return [math]::Ceiling([math]::Max(0, $r))
  } else {
    return $script:RoundTotal
  }
}
function SetRemaining([int]$sec) {
  $sec = [math]::Max(0,$sec)
  if ($script:phase -eq 'run') {
    # re-anchor to now
    $script:RoundEndTick = [double]$script:runSW.ElapsedTicks + ($sec * [System.Diagnostics.Stopwatch]::Frequency)
  } elseif ($script:phase -eq 'paused_run') {
    # store paused remaining; will re-anchor on resume
    $script:paused = $sec
  } else {
    # idle/pre/done: set baseline
    $script:RoundTotal = $sec
  }
  $script:beepedAt60 = ($sec -le 60)   # guard 60s beep if already under 60
  Set-TimeText $sec
}

# ---------- PRE COUNTDOWN (3-2-1) ----------
$preTimer = New-Object System.Windows.Threading.DispatcherTimer
$preTimer.Interval = [TimeSpan]::FromSeconds(1)
$preTimer.Add_Tick({
  if ($script:phase -ne 'pre') { $preTimer.Stop(); return }
  $script:preRemaining--
  if ($script:preRemaining -gt 0) {
    $TimeText.Text = "{0}" -f $script:preRemaining
  } else {
    $preTimer.Stop()
    $StatusText.Text = ""
    # start run
    $script:phase = 'run'; $script:beepedAt60 = $false; Beep-Start
    $script:runSW.Restart()
    $script:RoundEndTick = [double]$script:runSW.ElapsedTicks + ($script:RoundTotal * [System.Diagnostics.Stopwatch]::Frequency)
    Set-TimeText (GetRemaining)
  }
})

# ---------- UI LOOP ----------
$ui = New-Object System.Windows.Threading.DispatcherTimer
$ui.Interval = [TimeSpan]::FromMilliseconds($script:UpdateMs)
$ui.Add_Tick({
  if ($script:phase -eq 'run') {
    $r = GetRemaining
    Set-TimeText $r
    if (-not $script:beepedAt60 -and $r -le 60) {
      $script:beepedAt60 = $true
      Beep-60
      $StatusText.Text = ""
    }
    if ($r -le 0) {
      $script:runSW.Stop()
      $script:phase = 'done'
      $StatusText.Text = "TIME!"
      Beep-End
      $StartInstantBtn.IsEnabled = $true; $StartPrepBtn.IsEnabled = $true
      $PauseBtn.IsEnabled = $false; $PauseBtn.Content = "Pause"
    }
  }
})
$ui.Start()

# ---------- BUTTONS ----------
# Start immediately using MM:SS box
$StartInstantBtn.Add_Click({
  if ($script:phase -in 'pre','run','paused_run') { return }
  $script:RoundTotal = Parse-Time
  $script:phase = 'run'; $script:beepedAt60 = $false; Beep-Start
  $script:runSW.Restart()
  $script:RoundEndTick = [double]$script:runSW.ElapsedTicks + ($script:RoundTotal * [System.Diagnostics.Stopwatch]::Frequency)
  $StartInstantBtn.IsEnabled = $false; $StartPrepBtn.IsEnabled = $false; $PauseBtn.IsEnabled = $true
  Set-TimeText (GetRemaining)
})

# Start with BIG 3–2–1, then timer starts
$StartPrepBtn.Add_Click({
  if ($script:phase -in 'pre','run','paused_run') { return }
  $script:RoundTotal = Parse-Time
  $script:phase = 'pre'
  $StartInstantBtn.IsEnabled = $false; $StartPrepBtn.IsEnabled = $false; $PauseBtn.IsEnabled = $true
  $script:preRemaining = $script:PreSeconds
  $TimeText.Text = "{0}" -f $script:preRemaining
  $StatusText.Text = ""
  $preTimer.Start()
})

# Pause/Resume (run phase)
$PauseBtn.Add_Click({
  if ($script:phase -eq 'run') {
    $script:paused = GetRemaining
    $script:runSW.Stop()
    $script:phase = 'paused_run'; $PauseBtn.Content = "Resume"; $StatusText.Text = "Paused"
  } elseif ($script:phase -eq 'paused_run') {
    $script:phase = 'run'; $PauseBtn.Content = "Pause"; $StatusText.Text = ""
    $script:runSW.Restart()
    $script:RoundEndTick = [double]$script:runSW.ElapsedTicks + ($script:paused * [System.Diagnostics.Stopwatch]::Frequency)
  }
})

# Reset
$ResetBtn.Add_Click({
  $script:phase = 'idle'
  $preTimer.Stop()
  $script:runSW.Reset(); $script:beepedAt60 = $false
  $StartInstantBtn.IsEnabled = $true; $StartPrepBtn.IsEnabled = $true
  $PauseBtn.IsEnabled = $false; $PauseBtn.Content = "Pause"
  Set-TimeText $script:DefaultSeconds; $StatusText.Text = ""
  $script:RoundTotal = $script:DefaultSeconds
})

# Apply Time (authoritative: sets remaining immediately)
$ApplyTimeBtn.Add_Click({
  $sec = Parse-Time
  SetRemaining $sec
})

# +10s / -10s (work in all states)
$Plus10Btn.Add_Click({
  $new = (GetRemaining) + 10
  SetRemaining $new
})
$Minus10Btn.Add_Click({
  $new = [math]::Max(0, (GetRemaining) - 10)
  SetRemaining $new
})

# ---------- FULLSCREEN (robust toggle + Esc exits) ----------
$script:IsFullscreen = $false
function Toggle-Fullscreen {
  if (-not $script:IsFullscreen) {
    $Window.Topmost = $true
    $Window.WindowStyle = 'None'
    $Window.WindowState = 'Maximized'
    $FullscreenBtn.Content = "Exit Fullscreen"
    $script:IsFullscreen = $true
    $TimeText.FontSize = 280
  } else {
    $Window.Topmost = $false
    $Window.WindowState = 'Normal'
    [System.Windows.Application]::Current.Dispatcher.Invoke(
      { param($w) $w.WindowStyle = 'SingleBorderWindow' },
      [System.Windows.Threading.DispatcherPriority]::Background,
      $Window
    ) | Out-Null
    $FullscreenBtn.Content = "Fullscreen"
    $script:IsFullscreen = $false
    $TimeText.FontSize = 240
  }
}
$FullscreenBtn.Add_Click({ Toggle-Fullscreen })
$Window.Add_KeyDown({
  param($s,$e)
  switch ($e.Key) {
    'Space' { $PauseBtn.RaiseEvent((New-Object System.Windows.RoutedEventArgs([System.Windows.Controls.Button]::ClickEvent))) }
    'F'     { Toggle-Fullscreen }
    'Escape'{ if ($script:IsFullscreen) { Toggle-Fullscreen } }
  }
})

# ---------- SHOW ----------
$null = $Window.ShowDialog()`;

/* ---------------- Reusable dev panel (wrap/copy/download) ---------------- */

const btnStyle: React.CSSProperties = {
  background: "#222",
  color: "white",
  border: "1px solid #333",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};

const DeveloperPanel: React.FC<{ source: string; filename: string }> = ({
  source,
  filename,
}) => {
  const [wrap, setWrap] = useState(false);

  const download = () => {
    const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      style={{
        margin: "28px 24px 36px",
        background: "#0f0f0f",
        borderRadius: 12,
        border: "1px solid #262626",
      }}
    >
      <div
        style={{ padding: "14px 16px 10px", borderBottom: "1px solid #262626" }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Developer Script (Full Source)
        </h2>
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        >
          <button style={btnStyle} onClick={() => setWrap((w) => !w)}>
            {wrap ? "Disable wrap" : "Enable wrap"}
          </button>
          <button
            style={btnStyle}
            onClick={() => navigator.clipboard.writeText(source)}
          >
            Copy all
          </button>
          <button style={btnStyle} onClick={download}>
            Download .ps1
          </button>
        </div>
      </div>
      <div style={{ padding: 12, maxHeight: 420, overflow: "auto" }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: wrap ? "pre-wrap" : "pre",
            wordBreak: wrap ? "break-word" : "normal",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {source}
        </pre>
      </div>
    </section>
  );
};

/* ---------------- Timer logic + UI ---------------- */

function parseMMSS(s: string, fallbackSec = 240): number {
  const m = s.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!m) return fallbackSec;
  const mm = Math.max(0, parseInt(m[1], 10));
  let ss = Math.max(0, parseInt(m[2], 10));
  if (ss >= 60) ss = 59;
  return mm * 60 + ss;
}

function useBeeps() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ensure = () =>
    (ctxRef.current ??= new (window.AudioContext ||
      (window as any).webkitAudioContext)());
  const beep = (freq = 850, durMs = 140) => {
    try {
      const ctx = ensure();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
      o.start(t0);
      o.stop(t0 + durMs / 1000 + 0.02);
    } catch {}
  };
  return {
    start: () => beep(1000, 180),
    sixty: () => beep(900, 140),
    end: async () => {
      beep(700, 160);
      await new Promise((r) => setTimeout(r, 120));
      beep(650, 160);
      await new Promise((r) => setTimeout(r, 120));
      beep(600, 220);
    },
  };
}

type Phase = "idle" | "pre" | "run" | "paused" | "done";

export default function FinalsTimer() {
  const { start: beepStart, sixty: beep60, end: beepEnd } = useBeeps();

  // visuals
  const [titleOffsetY, setTitleOffsetY] = useState(20);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [blackout, setBlackout] = useState(false);

  // fullscreen state (entire page)
  const [isFs, setIsFs] = useState<boolean>(false);
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // timer state
  const [phase, setPhase] = useState<Phase>("idle");
  const [defaultSec] = useState(240);
  const [roundTotal, setRoundTotal] = useState(240);
  const [preRemaining, setPreRemaining] = useState(0);
  const [manualBox, setManualBox] = useState("04:00");

  const anchorEndMs = useRef<number>(0);
  const pausedRemaining = useRef<number>(0);
  const beeped60 = useRef<boolean>(false);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000 / 30);
    return () => clearInterval(id);
  }, []);

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b") setBlackout((b) => !b);
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key === "Escape") {
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
        setBlackout(false);
      }
      if (e.key === " ") {
        e.preventDefault();
        if (phase === "run" || phase === "paused") onPause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // helpers
  const nowMs = () => performance.now();
  const ceilSec = (ms: number) => Math.max(0, Math.ceil(ms / 1000));

  const getRemaining = (): number => {
    if (phase === "run") return ceilSec(anchorEndMs.current - nowMs());
    if (phase === "paused") return pausedRemaining.current;
    return roundTotal;
  };

  const setRemainingAuthoritative = (sec: number) => {
    sec = Math.max(0, sec);
    if (phase === "run") {
      anchorEndMs.current = nowMs() + sec * 1000;
    } else if (phase === "paused") {
      pausedRemaining.current = sec;
    } else {
      setRoundTotal(sec);
    }
    beeped60.current = sec <= 60;
  };

  // pre
  useEffect(() => {
    if (phase !== "pre") return;
    setPreRemaining(3);
    const id = setInterval(() => {
      setPreRemaining((p) => {
        const next = p - 1;
        if (next > 0) return next;
        clearInterval(id);
        setPhase("run");
        beeped60.current = false;
        beepStart();
        anchorEndMs.current = nowMs() + roundTotal * 1000;
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // beeps & time-up
  useEffect(() => {
    if (phase !== "run") return;
    const r = getRemaining();
    if (!beeped60.current && r <= 60) {
      beeped60.current = true;
      beep60();
    }
    if (r <= 0) {
      setPhase("done");
      beepEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, phase]);

  // strings
  const remaining = getRemaining();
  const timeText = useMemo(() => {
    const s = remaining;
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm.toString().padStart(2, "0")}:${ss
      .toString()
      .padStart(2, "0")}`;
  }, [remaining]);
  const statusText =
    phase === "pre"
      ? preRemaining > 0
        ? `${preRemaining}`
        : ""
      : phase === "paused"
      ? "Paused"
      : phase === "done"
      ? "TIME!"
      : "";

  // actions
  const onStartInstant = () => {
    if (phase === "pre" || phase === "run" || phase === "paused") return;
    const sec = parseMMSS(manualBox, defaultSec);
    setRoundTotal(sec);
    setPhase("run");
    beeped60.current = false;
    beepStart();
    anchorEndMs.current = nowMs() + sec * 1000;
  };
  const onStartPrep = () => {
    if (phase === "pre" || phase === "run" || phase === "paused") return;
    const sec = parseMMSS(manualBox, defaultSec);
    setRoundTotal(sec);
    setPhase("pre");
    setPreRemaining(3);
  };
  const onPause = () => {
    if (phase === "run") {
      pausedRemaining.current = getRemaining();
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("run");
      anchorEndMs.current = nowMs() + pausedRemaining.current * 1000;
    }
  };
  const onReset = () => {
    setPhase("idle");
    setRoundTotal(defaultSec);
    setPreRemaining(0);
    pausedRemaining.current = 0;
    beeped60.current = false;
    setManualBox("04:00");
  };
  const onApply = () =>
    setRemainingAuthoritative(parseMMSS(manualBox, defaultSec));
  const plus10 = () => setRemainingAuthoritative(getRemaining() + 10);
  const minus10 = () =>
    setRemainingAuthoritative(Math.max(0, getRemaining() - 10));

  // clock in footer
  const footerClock = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [tick]);

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100dvh",
        color: "white",
        transform: `skewY(${tiltDeg}deg)`,
        transition: "transform 120ms linear",
      }}
    >
      {/* Title */}
      <div style={{ position: "relative", paddingTop: 10 }}>
        <h1
          style={{
            fontSize: 46,
            fontWeight: 800,
            textAlign: "center",
            margin: 0,
            marginTop: titleOffsetY,
          }}
        >
          SCC Finals Timer
        </h1>
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            opacity: 0.75,
            fontSize: 14,
          }}
        >
          by Ti
        </div>
      </div>

      {/* Big clock */}
      <div
        style={{ display: "grid", placeItems: "center", padding: "8px 24px 0" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: phase === "pre" ? 240 : 220,
              fontWeight: 900,
              color: "#FF2B2B",
              lineHeight: 1.0,
            }}
          >
            {phase === "pre"
              ? preRemaining > 0
                ? preRemaining
                : timeText
              : timeText}
          </div>
          <div style={{ fontSize: 44, height: 54 }}>{statusText}</div>
        </div>
      </div>

      {/* Controls row 1 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          paddingTop: 18,
        }}
      >
        <button
          style={btnStyle}
          onClick={onStartInstant}
          disabled={phase === "pre" || phase === "run" || phase === "paused"}
        >
          Start
        </button>
        <button
          style={btnStyle}
          onClick={onStartPrep}
          disabled={phase === "pre" || phase === "run" || phase === "paused"}
        >
          Start w/ 3–2–1
        </button>
        <button
          style={btnStyle}
          onClick={onPause}
          disabled={!(phase === "run" || phase === "paused")}
        >
          {phase === "paused" ? "Resume" : "Pause"}
        </button>
        <button style={btnStyle} onClick={onReset}>
          Reset
        </button>
        <button style={btnStyle} onClick={toggleFullscreen}>
          {isFs ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        <button style={btnStyle} onClick={() => setBlackout((b) => !b)}>
          Blackout
        </button>
      </div>

      {/* Controls row 2 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "14px 0 6px",
        }}
      >
        <input
          value={manualBox}
          onChange={(e) => setManualBox(e.target.value)}
          onFocus={(e) => (e.target as HTMLInputElement).select()}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          style={{
            width: 140,
            height: 44,
            background: "#1C1C1C",
            color: "#fff",
            fontSize: 20,
            textAlign: "center",
            border: "1px solid #444",
            borderRadius: 6,
          }}
        />
        <button style={btnStyle} onClick={onApply}>
          Apply Time (MM:SS)
        </button>
        <button style={btnStyle} onClick={minus10}>
          -10s
        </button>
        <button style={btnStyle} onClick={plus10}>
          +10s
        </button>
      </div>

      {/* Footer controls + clock */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "center",
          gap: 12,
          padding: "0 24px 18px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
          }}
        >
          <label style={{ marginRight: 6, color: "white", opacity: 0.9 }}>
            Title offset
          </label>
          <input
            type="range"
            min={0}
            max={300}
            value={titleOffsetY}
            onChange={(e) => setTitleOffsetY(Number(e.target.value))}
            style={{ width: 130 }}
          />
          <label
            style={{
              marginLeft: 16,
              marginRight: 6,
              color: "white",
              opacity: 0.9,
            }}
          >
            Tilt
          </label>
          <input
            type="range"
            min={-10}
            max={10}
            value={tiltDeg}
            onChange={(e) => setTiltDeg(Number(e.target.value))}
            style={{ width: 130 }}
          />
        </div>
        <div style={{ textAlign: "right", fontSize: 18 }}>
          updated {footerClock} | Phase:{phase}
        </div>
      </div>

      {/* SOP */}
      <section
        style={{
          margin: "28px 24px 36px",
          background: "#161616",
          borderRadius: 12,
          padding: "20px 20px 18px",
          lineHeight: 1.5,
          border: "1px solid #262626",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
          SOP — Finals Timer
        </h2>
        <p style={{ opacity: 0.9, marginTop: 6 }}>
          Projector-safe timer with big 3–2–1, drift-free countdown, audible
          cues, ±10s, and fast Fullscreen/Blackout.
        </p>
        <h3 style={{ marginTop: 16, fontSize: 18 }}>Quick start</h3>
        <ol style={{ marginTop: 6, paddingLeft: 20 }}>
          <li>
            Set time in <b>MM:SS</b> if needed (default 04:00).
          </li>
          <li>
            Press <b>Start</b> or <b>Start w/ 3–2–1</b>.
          </li>
          <li>
            Use <b>Pause/Resume</b>, <b>±10s</b>, and <b>Apply</b> as needed.
          </li>
          <li>
            <b>Fullscreen</b> toggles the <i>entire page</i> (F / Esc).
          </li>
          <li>
            <b>Blackout</b> to temporarily hide (B / Esc / click).
          </li>
        </ol>
      </section>

      {/* Dev panel with embedded script */}
      <DeveloperPanel source={PS_TIMER} filename="FinalsTimer.ps1" />

      {/* Blackout overlay */}
      {blackout && (
        <div
          onClick={() => setBlackout(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            zIndex: 9999,
          }}
        >
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setBlackout(false);
              }}
              style={btnStyle}
            >
              Esc to Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
