import React, { useMemo, useState } from "react";
import Panel from "../Panel";
import SectionShell from "../ui/SectionShell";

/**
 * DrawerCounter — End-of-Day Cash Count SOP (v2.1)
 * Audience: Front Desk staff at close.
 *
 * Review (TJS)
 * - Purpose-first framing: bills are simple; the tool standardizes coin math.
 * - Sticky-note policy is explicit and unconditional: always include in total.
 * - “Pulled cash” is disclosure only; final total logic is unaffected.
 * - Evidence requirement and Slack comms are codified.
 * - Full v2.1 developer script is available to copy or download.
 */

export default function DrawerCounter() {
  // Authoritative PowerShell (full source) appears in the Developer Script section.
  const [script] =
    useState<string>(String.raw`#########################################################
# Author: Tiana Schwarz
# Date: April 4, 2025
# Purpose: GUI for counting the drawer at the EOD
#########################################################

#########################################################
# Version: 2.1
# Date: November 3, 2026
# Updates:
#   + Default screenshot folder: Desktop/TS/Drawer Screenshots
#   + Create screenshot folder if missing
#   + Screenshot save error handling and cleanup
#   + Existing themes, calculations, and logging retained
#   > TODO: Fix logo rendering across theme toggles
#########################################################

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# === Theme Colors ===
$redColor     = [System.Drawing.Color]::FromArgb(0xCE, 0x02, 0x01)
$blackColor   = [System.Drawing.Color]::Black
$whiteColor   = [System.Drawing.Color]::White
$retroTeal    = [System.Drawing.ColorTranslator]::FromHtml("#26b5bd")
$retroPink    = [System.Drawing.ColorTranslator]::FromHtml("#d363ac")

# === Create Form ===
$form = New-Object System.Windows.Forms.Form
$form.Text = "Springs Climbing Center - Cash Count"
$form.Size = New-Object System.Drawing.Size(420, 740)
$form.StartPosition = "CenterScreen"
$form.BackColor = $blackColor
$form.Topmost = $true

$font      = New-Object System.Drawing.Font("Segoe UI", 10)
$labelFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)

# === Theme Toggle ===
$themeToggle = New-Object System.Windows.Forms.CheckBox
$themeToggle.Text = "Retro Theme"
$themeToggle.Location = New-Object System.Drawing.Point(20, 10)
$themeToggle.Size = New-Object System.Drawing.Size(120, 20)
$themeToggle.ForeColor = $whiteColor
$themeToggle.BackColor = $blackColor
$form.Controls.Add($themeToggle)

# === GUI Version Display Label ===
$versionLabel = New-Object System.Windows.Forms.Label
$versionLabel.Text = "Version 2.1: Retro and Classic GUI theme (logos WIP)"
$versionLabel.Location = New-Object System.Drawing.Point(20, 35)
$versionLabel.Size = New-Object System.Drawing.Size(380, 20)
$versionLabel.ForeColor = $whiteColor
$versionLabel.BackColor = $form.BackColor
$versionLabel.Font = $font
$form.Controls.Add($versionLabel)

# === Timestamp ===
$timestamp = New-Object System.Windows.Forms.Label
$timestamp.Text = "Count started: " + (Get-Date).ToString("dddd, MMMM dd, yyyy h:mm tt")
$timestamp.Location = New-Object System.Drawing.Point(20, 60)
$timestamp.Size = New-Object System.Drawing.Size(380, 20)
$timestamp.ForeColor = $whiteColor
$timestamp.Font = $font
$form.Controls.Add($timestamp)

# === Input Fields and Labels ===
$inputs = @{}
$labels = @()

function Add-InputField {
    param ([string]$labelText, [int]$y, [string]$key)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $labelText
    $label.Location = New-Object System.Drawing.Point(20, $y)
    $label.Size = New-Object System.Drawing.Size(250, 20)
    $label.Font = $labelFont
    $label.BackColor = $form.BackColor
    $label.ForeColor = $redColor
    $form.Controls.Add($label)

    $textbox = New-Object System.Windows.Forms.TextBox
    $textbox.Location = New-Object System.Drawing.Point(280, $y)
    $textbox.Size = New-Object System.Drawing.Size(90, 20)
    $textbox.Text = "0"
    $textbox.ForeColor = $blackColor
    $textbox.BackColor = $whiteColor
    $textbox.BorderStyle = 'FixedSingle'
    $form.Controls.Add($textbox)

    $inputs[$key] = @{ Label = $label; TextBox = $textbox }
    $labels += $label
}

$y = 90
Add-InputField 'How many $100 bills?'     $y 'hundreds'; $y += 30
Add-InputField 'How many $20 bills?'      $y 'twenties'; $y += 30
Add-InputField 'How many $10 bills?'      $y 'tens';     $y += 30
Add-InputField 'How many $5 bills?'       $y 'fives';    $y += 30
Add-InputField 'How many $1 bills?'       $y 'ones';     $y += 30

# === Note for $1's ===
$note = New-Object System.Windows.Forms.Label
$note.Text = "* 1's should be paperclipped into 25 dollar stacks"
$note.Location = New-Object System.Drawing.Point(20, $y)
$note.Size = New-Object System.Drawing.Size(360, 20)
$note.ForeColor = $whiteColor
$note.Font = $font
$note.BackColor = $form.BackColor
$form.Controls.Add($note)
$labels += $note
$y += 30

Add-InputField 'How many quarters?'        $y 'quarters'; $y += 30
Add-InputField 'How many dimes?'           $y 'dimes';    $y += 30
Add-InputField 'How many nickels?'         $y 'nickels';  $y += 30
Add-InputField 'How many pennies?'         $y 'pennies';  $y += 30
Add-InputField 'Sticky Note Amount? ($)'   $y 'sticky';   $y += 30
Add-InputField 'Cash pulled out? ($)'      $y 'pulled';   $y += 40

# === Result Label ===
$resultLabel = New-Object System.Windows.Forms.Label
$resultLabel.Location = New-Object System.Drawing.Point(20, $y)
$resultLabel.Size = New-Object System.Drawing.Size(360, 60)
$resultLabel.ForeColor = $whiteColor
$resultLabel.Font = $labelFont
$form.Controls.Add($resultLabel)
$y += 60

# === Buttons ===
$calcButton = New-Object System.Windows.Forms.Button
$calcButton.Text = "Calculate"
$calcButton.Location = New-Object System.Drawing.Point(30, $y)
$calcButton.Size = New-Object System.Drawing.Size(100, 30)
$calcButton.BackColor = $redColor
$calcButton.ForeColor = $whiteColor
$calcButton.Font = $labelFont
$form.Controls.Add($calcButton)

$resetButton = New-Object System.Windows.Forms.Button
$resetButton.Text = "Reset"
$resetButton.Location = New-Object System.Drawing.Point(140, $y)
$resetButton.Size = New-Object System.Drawing.Size(100, 30)
$resetButton.BackColor = $blackColor
$resetButton.ForeColor = $whiteColor
$resetButton.Font = $labelFont
$form.Controls.Add($resetButton)

$screenshotButton = New-Object System.Windows.Forms.Button
$screenshotButton.Text = "Screenshot"
$screenshotButton.Location = New-Object System.Drawing.Point(250, $y)
$screenshotButton.Size = New-Object System.Drawing.Size(130, 30)
$screenshotButton.BackColor = $blackColor
$screenshotButton.ForeColor = $whiteColor
$screenshotButton.Font = $labelFont
$form.Controls.Add($screenshotButton)

# === Calculate Logic ===
$calcButton.Add_Click({
    try {
        $total = 0
        $total += [int]$inputs['hundreds'].TextBox.Text * 100
        $total += [int]$inputs['twenties'].TextBox.Text * 20
        $total += [int]$inputs['tens'].TextBox.Text * 10
        $total += [int]$inputs['fives'].TextBox.Text * 5
        $total += [int]$inputs['ones'].TextBox.Text * 1
        $total += [int]$inputs['quarters'].TextBox.Text * 0.25
        $total += [int]$inputs['dimes'].TextBox.Text * 0.10
        $total += [int]$inputs['nickels'].TextBox.Text * 0.05
        $total += [int]$inputs['pennies'].TextBox.Text * 0.01
        $total += [double]$inputs['sticky'].TextBox.Text

        $pulled = [double]$inputs['pulled'].TextBox.Text
        $expected = 200
        $diff = [Math]::Round($total - $expected, 2)

        if ($diff -eq 0) {
            $msg = "Perfect! Drawer is at $" + $total
        } elseif ($diff -gt 0) {
            $msg = "↑ Over by: $" + $diff + " (Drawer: $" + $total + ")"
        } else {
            $msg = "↓ Under by: $" + (-1 * $diff) + " (Drawer: $" + $total + ")"
        }

        $resultLabel.Text = $msg + " | Pulled: $" + $pulled
        "$((Get-Date).ToString('yyyy-MM-dd HH:mm')) - $msg | Pulled: $$pulled" | Out-File -Append "$PSScriptRoot\count_log.txt"
    } catch {
        $resultLabel.Text = "⚠️ Please enter valid numbers."
    }
})

# === Reset Logic ===
$resetButton.Add_Click({
    foreach ($item in $inputs.Values) {
        $item.TextBox.Text = "0"
    }
    $resultLabel.Text = ""
    $timestamp.Text = "Count restarted: " + (Get-Date).ToString("dddd, MMMM dd, yyyy h:mm tt")
})


# === Screenshot Logic ===
$screenshotFolder = 'C:\Users\sport\OneDrive\Desktop\TS\Drawer Screenshots'

$screenshotButton.Add_Click({
    $dialog = $null
    try {
        # Create folder if it doesn't exist
        if (-not (Test-Path -LiteralPath $screenshotFolder)) {
            New-Item -ItemType Directory -Path $screenshotFolder -Force | Out-Null
        }

        $dialog = New-Object System.Windows.Forms.SaveFileDialog
        $dialog.Filter = "PNG Image|*.png"
        $dialog.DefaultExt = "png"
        $dialog.AddExtension = $true
        $dialog.Title = "Save Drawer Screenshot"
        $dialog.InitialDirectory = $screenshotFolder
        $dialog.RestoreDirectory = $true
        $dialog.FileName = "DrawerCount_" + (Get-Date -Format "yyyyMMdd_HHmm") + ".png"

        # Open the save dialog in the screenshot folder
        if ($dialog.ShowDialog($form) -eq [System.Windows.Forms.DialogResult]::OK) {
            $bmp = New-Object System.Drawing.Bitmap($form.Width, $form.Height)
            $gfx = [System.Drawing.Graphics]::FromImage($bmp)

            try {
                $gfx.CopyFromScreen(
                    $form.Location,
                    [System.Drawing.Point]::Empty,
                    $form.Size
                )

                $bmp.Save(
                    $dialog.FileName,
                    [System.Drawing.Imaging.ImageFormat]::Png
                )
            }
            finally {
                $gfx.Dispose()
                $bmp.Dispose()
            }
        }
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show(
            "Could not save screenshot: $($_.Exception.Message)",
            "Drawer Counter",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
    }
    finally {
        if ($null -ne $dialog) {
            $dialog.Dispose()
        }
    }
})

# === Theme Toggle Logic ===
$themeToggle.Add_CheckedChanged({
    $isRetro = $themeToggle.Checked
    $form.BackColor = if ($isRetro) { $retroTeal } else { $blackColor }
    $labelColor = if ($isRetro) { $retroPink } else { $redColor }

    foreach ($item in $inputs.Values) {
        $item.Label.ForeColor = $labelColor
        $item.Label.BackColor = $form.BackColor
        $item.TextBox.BackColor = $whiteColor
        $item.TextBox.ForeColor = $blackColor
    }

    $note.ForeColor         = $labelColor
    $note.BackColor         = $form.BackColor
    $timestamp.ForeColor    = $whiteColor
    $timestamp.BackColor    = $form.BackColor
    $versionLabel.ForeColor = $whiteColor
    $versionLabel.BackColor = $form.BackColor
    $resultLabel.ForeColor  = $whiteColor
    $resultLabel.BackColor  = $form.BackColor

    foreach ($ctrl in $form.Controls) {
        if ($ctrl -is [System.Windows.Forms.Button] -or $ctrl -is [System.Windows.Forms.CheckBox]) {
            $ctrl.BackColor = $form.BackColor
            $ctrl.ForeColor = $whiteColor
        }
    }
})

# === Show GUI ===
$form.Add_Shown({ $form.Activate() })
[void]$form.ShowDialog()`);

  return (
    <SectionShell
      toc={[
        { id: "overview", label: "Overview" },
        { id: "run", label: "Run Options" },
        { id: "updates", label: "Version 2.1" },
        { id: "screenshots", label: "Save Screenshots" },
        { id: "troubleshoot", label: "Troubleshooting" },
        { id: "dev", label: "Developer Script" },
      ]}
      standard={
        <ul style={{ margin: "8px 0 0 18px" }}>
          <li>
            Target drawer: <b>$200</b>.
          </li>
          <li>
            <b>Always</b> include the sticky-note amount in the total.
          </li>
          <li>Save proof to Desktop → TS → Drawer Screenshots.</li>
        </ul>
      }
    >
      {/* ================= STAFF-FACING ================= */}
      <section id="overview">
        <h1>Drawer Counter (v2.1) — End of Day</h1>
        <div className="accent" />
        <p className="muted">
          This tool exists to make counting the drawer faster. And to save
          screenshots if the drawer is under the target.
        </p>

        <div className="grid2">
          <Panel title="Why this exists">
            <ul>
              <li>
                Standardizes coin math so totals are consistent across staff and
                nights.
              </li>
              <li>
                Shows exactly how far from the <b>$200</b> target you are.
              </li>
              <li>
                Produces a screenshot and a small log entry for traceability.
              </li>
            </ul>
          </Panel>
          <Panel title="What you’ll need">
            <ul>
              <li>Register sticky note amount (write it down if missing).</li>
              <li>
                A quick visual sweep of bills, then focus on coin quantities.
              </li>
            </ul>
          </Panel>
        </div>
      </section>

      <section id="run">
        <h2>Run Options</h2>

        <Panel title="Option A — Rainmeter (Computer 1)">
          <ol>
            <li>Find the <b>SOP HUB</b> widget on the desktop.</li>
            <li>Click <b>RUN DRAWER COUNTER</b>.</li>
            <li>The Drawer Counter opens in PowerShell.</li>
          </ol>
          <p className="muted small">
            This button runs the script on the computer you are using. It is
            configured for SCC Computer 1.
          </p>
        </Panel>

        <Panel title="Option B — PowerShell ISE">
          <ol>
            <li>Open <b>Windows PowerShell ISE</b> from the Start menu.</li>
            <li>
              Press <b>Ctrl + O</b> and select:
              <div style={{ marginTop: 6 }}>
                <code>{String.raw`C:\Users\sport\OneDrive\Desktop\TS\Working Scripts\DrawerCountv2.ps1`}</code>
              </div>
            </li>
            <li>Press <b>F5</b> or click the green Run button.</li>
          </ol>
        </Panel>

        <Panel title="Option C — File Explorer">
          <ol>
            <li>
              Open <code>{String.raw`C:\Users\sport\OneDrive\Desktop\TS\Working Scripts`}</code>.
            </li>
            <li>
              Right-click <code>DrawerCountv2.ps1</code> and select <b>Run with PowerShell</b>.
            </li>
          </ol>
          <p className="muted small">If Windows blocks the script, contact the person who manages the SCC computers.</p>
        </Panel>
      </section>

      <section id="updates">
        <h2>What Changed — v2.1</h2>
        <Panel title="November 3, 2026">
          <ul>
            <li>The Screenshot button now opens the Save As window in the Drawer Screenshots folder by default.</li>
            <li>The folder is created automatically if it does not exist.</li>
            <li>Screenshot names include a date and time.</li>
            <li>Added an error message if a screenshot cannot be saved.</li>
            <li>Kept the $200 target, sticky-note amount, theme toggle, and count log.</li>
            <li>Added the SOP Hub Rainmeter shortcut for Computer 1.</li>
          </ul>
        </Panel>
      </section>

      <section id="screenshots">
        <h2>Save Screenshots</h2>
        <Panel title="Record what you did:">
          <ol>
            <li>Enter quantities for bills and coins.</li>
            <li>
              In the app, fill in <b>Sticky Note Amount</b>. This value is{" "}
              <b>always counted</b> in the final total, because the note
              represents cash reserved to meet the standard drawer level.
            </li>
            <li>
              If cash was removed during the shift, put that dollar value in{" "}
              <b>Cash pulled out</b>. This is disclosure only - it does{" "}
              <b>not</b> modify the final total.
            </li>
            <li>
              Click <b>Screenshot</b>. The Save As window opens in this folder by default:
              <div style={{ marginTop: 6 }}>
                <code>
                  C:\Users\sport\OneDrive\Desktop\TS\Drawer Screenshots
                </code>
              </div>
              A filename like <code>DrawerCount_YYYYMMDD_HHMMSS.png</code> is filled in automatically. You can choose another folder if needed.
            </li>
            <li>
              Post the screenshot in Slack if the drawer is under the target
              $200 in channel: <b>#desk-staff</b> with a short note (example:{" "}
              <i>“2025-04-14 close - drawer at $180, under by $20”</i>).
            </li>
          </ol>
        </Panel>
      </section>

      <section id="troubleshoot">
        <h2>Troubleshooting</h2>
        <Panel title="Common Fixes">
          <ul>
            <li>
              Window won’t open: right-click → <b>Run with PowerShell</b>.
            </li>
            <li>
              Script blocked by Windows: contact the person who manages the SCC computers.
            </li>
            <li>Validation error: ensure fields contain numbers only.</li>
            <li>Screenshot not saving: confirm OneDrive is available and check the Drawer Screenshots folder.</li>
          </ul>
        </Panel>
      </section>

      {/* ================= DEVELOPER SCRIPT (VISIBLE) ================= */}
      <section id="dev">
        <h2>Developer Script (Full Source, v2.1)</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Keep the authoritative copy at{" "}
          <code>{String.raw`C:\Users\sport\OneDrive\Desktop\TS\Working Scripts\DrawerCountv2.ps1`}</code>.
          Use the buttons to copy or download a reference copy. Back up the file
          before replacing the version on Computer 1.
        </p>

        <ScriptViewerLite
          filename="DrawerCountv2.ps1"
          value={script}
          onChange={() => {}}
          maxHeight={640}
        />
      </section>
    </SectionShell>
  );
}

/* === Lightweight helpers; duplicated here for self-containment. Consider extracting. === */

function CodeRowLite({ label, text }: { label: string; text: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      alert("Copy failed. Please select and copy manually.");
    }
  };
  return (
    <div className="coderow">
      <div className="label">{label}</div>
      <pre>
        <code>{text}</code>
      </pre>
      <div className="copy">
        <button className="btn tiny" onClick={copy}>
          Copy
        </button>
      </div>
    </div>
  );
}

function ScriptViewerLite({
  filename,
  value,
  onChange,
  maxHeight = 520,
}: {
  filename: string;
  value: string;
  onChange: (v: string) => void;
  maxHeight?: number;
}) {
  const [wrap, setWrap] = useState(false);
  const lines = useMemo(() => value.split("\n"), [value]);

  const download = () => {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copied full script to clipboard.");
    } catch {
      alert("Copy failed. Please select and copy manually.");
    }
  };

  return (
    <>
      <div className="script-controls">
        <button className="btn tiny" onClick={() => setWrap((w) => !w)}>
          {wrap ? "Disable wrap" : "Enable wrap"}
        </button>
        <button className="btn tiny" onClick={copyAll}>
          Copy all
        </button>
        <button className="btn tiny" onClick={download}>
          Download .ps1
        </button>
      </div>

      <div
        className={`codebox ${wrap ? "wrap" : ""}`}
        role="region"
        aria-label="Script block"
        style={{ maxHeight }}
      >
        <ol className="gutter" aria-hidden="true">
          {lines.map((_, i) => (
            <li key={i}>{i + 1}</li>
          ))}
        </ol>
        <pre>
          <code>{value}</code>
        </pre>
      </div>
    </>
  );
}
