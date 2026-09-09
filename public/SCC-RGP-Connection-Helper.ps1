# =============================================================================
# SCC - ROCK GYM PRO CONNECTION HELPER
# =============================================================================
#
# Created by: Ti Schwarz
# Springs Climbing Center
#
# PURPOSE
# -------
# This program helps front-desk staff recover Rock Gym Pro when Computer 2
# cannot connect to the SCC database on Computer 1.
#
# The most important thing this program does is find Computer 1's CURRENT
# IPv4 address. Rock Gym Pro on Computer 2 must point to that address.
#
# It also performs several checks on Computer 1 so staff can tell whether
# changing Rock Gym Pro on Computer 2 is actually the appropriate next step.
#
#
# WHAT THIS PROGRAM CHECKS
# ------------------------
# 1. Finds an active network adapter.
# 2. Finds Computer 1's current usable IPv4 address.
# 3. Looks for the Rock Gym Pro / MySQL Windows service.
# 4. Checks whether MySQL is listening on TCP port 3306.
#
#
# IMPORTANT
# ---------
# The existing SCC Rock Gym Pro database is:
#
#     springsclimbingcenter
#
# NEVER create a new database while using this helper.
#
# If this script is being tested on a personal computer, the MySQL service
# and TCP 3306 checks may fail. That is expected because a personal computer
# is not the SCC database server.
#
# =============================================================================


# =============================================================================
# LOAD WINDOWS FORMS
# =============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[System.Windows.Forms.Application]::EnableVisualStyles()


# =============================================================================
# BASIC COLORS
# =============================================================================

$ColorBackground = [System.Drawing.Color]::FromArgb(14, 15, 20)
$ColorPanel      = [System.Drawing.Color]::FromArgb(29, 31, 38)
$ColorPanel2     = [System.Drawing.Color]::FromArgb(34, 36, 44)
$ColorText       = [System.Drawing.Color]::FromArgb(242, 242, 245)
$ColorMuted      = [System.Drawing.Color]::FromArgb(190, 195, 205)
$ColorGreen      = [System.Drawing.Color]::FromArgb(67, 220, 130)
$ColorRed        = [System.Drawing.Color]::FromArgb(255, 82, 92)
$ColorYellow     = [System.Drawing.Color]::FromArgb(255, 190, 65)
$ColorDanger     = [System.Drawing.Color]::FromArgb(91, 28, 32)
$ColorButton     = [System.Drawing.Color]::FromArgb(48, 52, 64)
$ColorBorder     = [System.Drawing.Color]::FromArgb(105, 110, 122)


# =============================================================================
# FONTS
# =============================================================================

$FontTitle       = New-Object System.Drawing.Font("Segoe UI", 25, [System.Drawing.FontStyle]::Bold)
$FontSubtitle    = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$FontAuthor      = New-Object System.Drawing.Font("Segoe UI", 10)
$FontSection     = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
$FontBody        = New-Object System.Drawing.Font("Segoe UI", 11)
$FontBodyBold    = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$FontStatus      = New-Object System.Drawing.Font("Segoe UI", 11)
$FontStatusBold  = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$FontIP          = New-Object System.Drawing.Font("Consolas", 19, [System.Drawing.FontStyle]::Bold)
$FontButton      = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$FontBigButton   = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$FontInstructions = New-Object System.Drawing.Font("Segoe UI", 12)


# =============================================================================
# HELPER: CREATE A LABEL
# =============================================================================

function New-SCCLabel {
    param(
        [string]$Text = "",
        [System.Drawing.Font]$Font = $FontBody,
        [System.Drawing.Color]$ForeColor = $ColorText,
        [System.Windows.Forms.DockStyle]$Dock = [System.Windows.Forms.DockStyle]::Top,
        [System.Windows.Forms.Padding]$Padding = (New-Object System.Windows.Forms.Padding(0))
    )

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $Text
    $label.Font = $Font
    $label.ForeColor = $ForeColor
    $label.BackColor = [System.Drawing.Color]::Transparent
    $label.Dock = $Dock
    $label.AutoSize = $true
    $label.Padding = $Padding
    $label.Margin = New-Object System.Windows.Forms.Padding(0)

    return $label
}


# =============================================================================
# HELPER: CREATE A BUTTON
# =============================================================================

function New-SCCButton {
    param(
        [string]$Text,
        [int]$Width = 180,
        [int]$Height = 42
    )

    $button = New-Object System.Windows.Forms.Button

    $button.Text = $Text
    $button.Font = $FontButton
    $button.ForeColor = $ColorText
    $button.BackColor = $ColorButton
    $button.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $button.FlatAppearance.BorderColor = $ColorBorder
    $button.FlatAppearance.BorderSize = 1

    $button.Width = $Width
    $button.Height = $Height

    # AutoSize prevents text such as "Technical Details"
    # or "Refresh" from being cut off.
    $button.AutoSize = $true
    $button.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink

    # Extra space around the button text.
    $button.Padding = New-Object System.Windows.Forms.Padding(14, 4, 14, 4)

    $button.Margin = New-Object System.Windows.Forms.Padding(0, 0, 12, 0)
    $button.Cursor = [System.Windows.Forms.Cursors]::Hand

    return $button
}


# =============================================================================
# HELPER: CREATE A SECTION PANEL
# =============================================================================

function New-SectionPanel {

    $panel = New-Object System.Windows.Forms.Panel

    $panel.BackColor = $ColorPanel
    $panel.Dock = [System.Windows.Forms.DockStyle]::Top
    $panel.AutoSize = $true
    $panel.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
    $panel.Padding = New-Object System.Windows.Forms.Padding(18, 14, 18, 14)
    $panel.Margin = New-Object System.Windows.Forms.Padding(0, 0, 0, 10)

    return $panel
}


# =============================================================================
# GET COMPUTER 1 STATUS
# =============================================================================
#
# This is intentionally separated from the GUI.
#
# The Refresh button simply runs these checks again and updates the screen.
#
# =============================================================================

function Get-SCCStatus {

    $result = [ordered]@{
        AdapterName    = "Not found"
        AdapterOK      = $false

        IPv4           = "Not found"
        IPv4OK         = $false

        MySQLName      = "Not detected"
        MySQLStatus    = "Not detected"
        MySQLOK        = $false

        Port3306       = "Not listening"
        Port3306OK     = $false
    }


    # -------------------------------------------------------------------------
    # CHECK 1 - FIND ACTIVE NETWORK ADAPTER
    # -------------------------------------------------------------------------

    try {

        $adapter = Get-NetAdapter -ErrorAction Stop |
            Where-Object {
                $_.Status -eq "Up" -and
                $_.InterfaceDescription -notmatch "Loopback|Virtual|VPN|Bluetooth"
            } |
            Sort-Object `
                @{Expression = {
                    if ($_.Name -match "Ethernet") { 0 }
                    elseif ($_.Name -match "Wi-Fi|Wireless") { 1 }
                    else { 2 }
                }},
                ifIndex |
            Select-Object -First 1

        if ($adapter) {
            $result.AdapterName = $adapter.Name
            $result.AdapterOK = $true
        }

    }
    catch {
        # Leave the result as Not found.
    }


    # -------------------------------------------------------------------------
    # CHECK 2 - FIND USABLE IPV4 ADDRESS
    # -------------------------------------------------------------------------

    if ($result.AdapterOK) {

        try {

            $ip = Get-NetIPAddress `
                -InterfaceIndex $adapter.ifIndex `
                -AddressFamily IPv4 `
                -ErrorAction Stop |
                Where-Object {
                    $_.IPAddress -notlike "169.254.*" -and
                    $_.IPAddress -ne "127.0.0.1"
                } |
                Select-Object -First 1

            if ($ip) {
                $result.IPv4 = $ip.IPAddress
                $result.IPv4OK = $true
            }

        }
        catch {
            # Leave IP as Not found.
        }
    }


    # -------------------------------------------------------------------------
    # CHECK 3 - LOOK FOR RGP / MYSQL SERVICE
    # -------------------------------------------------------------------------
    #
    # On the real SCC Computer 1, we expect the database service to exist
    # and be running.
    #
    # On a personal laptop used to test this script, this may correctly
    # report "Not detected."
    #
    # -------------------------------------------------------------------------

    try {

        $mysqlService = Get-Service -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -match "mysql" -or
                $_.DisplayName -match "mysql"
            } |
            Select-Object -First 1

        if ($mysqlService) {

            $result.MySQLName = $mysqlService.DisplayName
            $result.MySQLStatus = $mysqlService.Status.ToString()

            if ($mysqlService.Status -eq "Running") {
                $result.MySQLOK = $true
            }
        }

    }
    catch {
        # Leave MySQL as Not detected.
    }


    # -------------------------------------------------------------------------
    # CHECK 4 - CHECK MYSQL PORT 3306
    # -------------------------------------------------------------------------
    #
    # RGP uses MySQL on TCP port 3306.
    #
    # We check whether this computer is LISTENING on that port.
    #
    # -------------------------------------------------------------------------

    try {

        $listener = Get-NetTCPConnection `
            -State Listen `
            -LocalPort 3306 `
            -ErrorAction SilentlyContinue |
            Select-Object -First 1

        if ($listener) {
            $result.Port3306 = "Listening"
            $result.Port3306OK = $true
        }

    }
    catch {
        # Leave as Not listening.
    }


    return [PSCustomObject]$result
}


# =============================================================================
# MAIN WINDOW
# =============================================================================

$form = New-Object System.Windows.Forms.Form

$form.Text = "SCC - RGP Connection Helper"
$form.BackColor = $ColorBackground
$form.ForeColor = $ColorText

$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen

$form.MinimumSize = New-Object System.Drawing.Size(900, 700)
$form.Size = New-Object System.Drawing.Size(1100, 820)

$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::Sizable
$form.MaximizeBox = $true
$form.MinimizeBox = $true

$form.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi


# =============================================================================
# MAIN SCROLL AREA
# =============================================================================
#
# If Windows display scaling or a smaller monitor requires additional room,
# the whole interface can scroll instead of overlapping.
#
# =============================================================================

$mainScroll = New-Object System.Windows.Forms.Panel
$mainScroll.Dock = [System.Windows.Forms.DockStyle]::Fill
$mainScroll.AutoScroll = $true
$mainScroll.BackColor = $ColorBackground
$mainScroll.Padding = New-Object System.Windows.Forms.Padding(20)

$form.Controls.Add($mainScroll)


# =============================================================================
# MAIN RESPONSIVE LAYOUT
# =============================================================================

$mainLayout = New-Object System.Windows.Forms.TableLayoutPanel

$mainLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$mainLayout.AutoSize = $true
$mainLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$mainLayout.ColumnCount = 1
$mainLayout.RowCount = 7

$mainLayout.ColumnStyles.Add(
    (New-Object System.Windows.Forms.ColumnStyle(
        [System.Windows.Forms.SizeType]::Percent,
        100
    ))
)

$mainScroll.Controls.Add($mainLayout)


# =============================================================================
# HEADER
# =============================================================================

$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Dock = [System.Windows.Forms.DockStyle]::Top
$headerPanel.AutoSize = $true
$headerPanel.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$headerPanel.Padding = New-Object System.Windows.Forms.Padding(8, 6, 8, 14)

$headerLayout = New-Object System.Windows.Forms.TableLayoutPanel
$headerLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$headerLayout.AutoSize = $true
$headerLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$headerLayout.ColumnCount = 1
$headerLayout.RowCount = 4

$titleLabel = New-SCCLabel `
    -Text "RGP Connection Helper" `
    -Font $FontTitle

$serverLabel = New-SCCLabel `
    -Text "SPRINGS CLIMBING CENTER  |  COMPUTER 1 DATABASE SERVER" `
    -Font $FontSubtitle `
    -ForeColor $ColorMuted `
    -Padding (New-Object System.Windows.Forms.Padding(0, 6, 0, 0))

$authorLabel = New-SCCLabel `
    -Text "Created by Ti Schwarz" `
    -Font $FontAuthor `
    -ForeColor $ColorMuted `
    -Padding (New-Object System.Windows.Forms.Padding(0, 6, 0, 0))

$headerLayout.Controls.Add($titleLabel, 0, 0)
$headerLayout.Controls.Add($serverLabel, 0, 1)
$headerLayout.Controls.Add($authorLabel, 0, 2)

$headerPanel.Controls.Add($headerLayout)

$mainLayout.Controls.Add($headerPanel)


# =============================================================================
# SECTION 1 - CURRENT IP ADDRESS
# =============================================================================

$ipPanel = New-SectionPanel

$ipLayout = New-Object System.Windows.Forms.TableLayoutPanel
$ipLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$ipLayout.AutoSize = $true
$ipLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$ipLayout.ColumnCount = 1
$ipLayout.RowCount = 5

$ipTitle = New-SCCLabel `
    -Text "CURRENT COMPUTER 1 IP - USE THIS ON COMPUTER 2" `
    -Font $FontSection `
    -ForeColor $ColorGreen `
    -Padding (New-Object System.Windows.Forms.Padding(0, 0, 0, 8))

$ipBox = New-Object System.Windows.Forms.TextBox
$ipBox.Dock = [System.Windows.Forms.DockStyle]::Top
$ipBox.Height = 45
$ipBox.Font = $FontIP
$ipBox.TextAlign = [System.Windows.Forms.HorizontalAlignment]::Center
$ipBox.ReadOnly = $true
$ipBox.BackColor = $ColorBackground
$ipBox.ForeColor = $ColorText
$ipBox.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$ipBox.Margin = New-Object System.Windows.Forms.Padding(0, 0, 0, 8)

$ipExplanation = New-SCCLabel `
    -Text "Computer 2's Rock Gym Pro Database Server field should match this address." `
    -Font $FontBody `
    -ForeColor $ColorMuted `
    -Padding (New-Object System.Windows.Forms.Padding(0, 7, 0, 9))

$ipButtons = New-Object System.Windows.Forms.FlowLayoutPanel
$ipButtons.Dock = [System.Windows.Forms.DockStyle]::Top
$ipButtons.AutoSize = $true
$ipButtons.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$ipButtons.WrapContents = $true
$ipButtons.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$ipButtons.Margin = New-Object System.Windows.Forms.Padding(0)

$copyButton = New-SCCButton `
    -Text "COPY IP FOR COMPUTER 2" `
    -Width 245 `
    -Height 44

$refreshButton = New-SCCButton `
    -Text "REFRESH STATUS" `
    -Width 175 `
    -Height 44

$ipButtons.Controls.Add($copyButton)
$ipButtons.Controls.Add($refreshButton)

$ipLayout.Controls.Add($ipTitle)
$ipLayout.Controls.Add($ipBox)
$ipLayout.Controls.Add($ipExplanation)
$ipLayout.Controls.Add($ipButtons)

$ipPanel.Controls.Add($ipLayout)

$mainLayout.Controls.Add($ipPanel)


# =============================================================================
# SECTION 2 - COMPUTER 1 CONNECTION CHECKS
# =============================================================================

$checksPanel = New-SectionPanel

$checksLayout = New-Object System.Windows.Forms.TableLayoutPanel
$checksLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$checksLayout.AutoSize = $true
$checksLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$checksLayout.ColumnCount = 1

$checksTitle = New-SCCLabel `
    -Text "COMPUTER 1 CONNECTION CHECKS" `
    -Font $FontSection `
    -Padding (New-Object System.Windows.Forms.Padding(0, 0, 0, 4))

$checksDescription = New-SCCLabel `
    -Text "These checks show whether Computer 1 appears ready before Rock Gym Pro is changed on Computer 2." `
    -Font $FontBody `
    -ForeColor $ColorMuted `
    -Padding (New-Object System.Windows.Forms.Padding(0, 0, 0, 12))

$checksLayout.Controls.Add($checksTitle)
$checksLayout.Controls.Add($checksDescription)


# -----------------------------------------------------------------------------
# STATUS GRID
# -----------------------------------------------------------------------------

$statusGrid = New-Object System.Windows.Forms.TableLayoutPanel

$statusGrid.Dock = [System.Windows.Forms.DockStyle]::Top
$statusGrid.AutoSize = $true
$statusGrid.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$statusGrid.ColumnCount = 3
$statusGrid.RowCount = 4

$statusGrid.ColumnStyles.Add(
    (New-Object System.Windows.Forms.ColumnStyle(
        [System.Windows.Forms.SizeType]::Absolute,
        65
    ))
)

$statusGrid.ColumnStyles.Add(
    (New-Object System.Windows.Forms.ColumnStyle(
        [System.Windows.Forms.SizeType]::Percent,
        55
    ))
)

$statusGrid.ColumnStyles.Add(
    (New-Object System.Windows.Forms.ColumnStyle(
        [System.Windows.Forms.SizeType]::Percent,
        45
    ))
)


function Add-StatusRow {
    param(
        [int]$Row,
        [string]$Description
    )

    $symbol = New-SCCLabel `
        -Text "[...]" `
        -Font $FontStatusBold

    $name = New-SCCLabel `
        -Text $Description `
        -Font $FontStatus

    $value = New-SCCLabel `
        -Text "Checking..." `
        -Font $FontStatusBold

    $symbol.Margin = New-Object System.Windows.Forms.Padding(0, 3, 8, 3)
    $name.Margin   = New-Object System.Windows.Forms.Padding(0, 3, 8, 3)
    $value.Margin  = New-Object System.Windows.Forms.Padding(0, 3, 0, 3)

    $statusGrid.Controls.Add($symbol, 0, $Row)
    $statusGrid.Controls.Add($name, 1, $Row)
    $statusGrid.Controls.Add($value, 2, $Row)

    return @{
        Symbol = $symbol
        Value  = $value
    }
}


$adapterStatus = Add-StatusRow `
    -Row 0 `
    -Description "Network adapter connected"

$ipStatus = Add-StatusRow `
    -Row 1 `
    -Description "Usable IPv4 address found"

$mysqlStatus = Add-StatusRow `
    -Row 2 `
    -Description "Rock Gym Pro / MySQL service"

$portStatus = Add-StatusRow `
    -Row 3 `
    -Description "MySQL TCP port 3306"


$checksLayout.Controls.Add($statusGrid)


$personalLaptopNote = New-SCCLabel `
    -Text "Note: If this is not the real SCC Computer 1, missing RGP/MySQL checks may be completely normal." `
    -Font $FontBodyBold `
    -ForeColor $ColorYellow `
    -Padding (New-Object System.Windows.Forms.Padding(0, 10, 0, 0))

$checksLayout.Controls.Add($personalLaptopNote)

$checksPanel.Controls.Add($checksLayout)

$mainLayout.Controls.Add($checksPanel)


# =============================================================================
# SECTION 3 - RGP FIX
# =============================================================================

$fixPanel = New-SectionPanel

$fixLayout = New-Object System.Windows.Forms.TableLayoutPanel
$fixLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$fixLayout.AutoSize = $true
$fixLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$fixLayout.ColumnCount = 1

$fixTitle = New-SCCLabel `
    -Text "CHECK-IN NOT CONNECTING ON COMPUTER 2?" `
    -Font $FontSection `
    -Padding (New-Object System.Windows.Forms.Padding(0, 0, 0, 6))

$fixDescription = New-SCCLabel `
    -Text "Open the guided Rock Gym Pro Configuration Wizard instructions. The helper inserts Computer 1's current IP address into the steps." `
    -Font $FontBody `
    -ForeColor $ColorMuted `
    -Padding (New-Object System.Windows.Forms.Padding(0, 0, 0, 12))

$fixButtonFlow = New-Object System.Windows.Forms.FlowLayoutPanel
$fixButtonFlow.Dock = [System.Windows.Forms.DockStyle]::Top
$fixButtonFlow.AutoSize = $true
$fixButtonFlow.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$fixButtonFlow.WrapContents = $true

$instructionsButton = New-SCCButton `
    -Text "OPEN RGP FIX INSTRUCTIONS" `
    -Width 300 `
    -Height 50

$instructionsButton.Font = $FontBigButton

$fixButtonFlow.Controls.Add($instructionsButton)

$fixLayout.Controls.Add($fixTitle)
$fixLayout.Controls.Add($fixDescription)
$fixLayout.Controls.Add($fixButtonFlow)

$fixPanel.Controls.Add($fixLayout)

$mainLayout.Controls.Add($fixPanel)


# =============================================================================
# WARNING
# =============================================================================

$warningPanel = New-Object System.Windows.Forms.Panel
$warningPanel.BackColor = $ColorDanger
$warningPanel.Dock = [System.Windows.Forms.DockStyle]::Top
$warningPanel.AutoSize = $true
$warningPanel.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$warningPanel.Padding = New-Object System.Windows.Forms.Padding(16, 12, 16, 12)

$warningLayout = New-Object System.Windows.Forms.TableLayoutPanel
$warningLayout.Dock = [System.Windows.Forms.DockStyle]::Top
$warningLayout.AutoSize = $true
$warningLayout.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$warningLayout.ColumnCount = 1

$warningTitle = New-SCCLabel `
    -Text "DO NOT CREATE A NEW DATABASE" `
    -Font $FontSection `
    -ForeColor $ColorRed

$warningText = New-SCCLabel `
    -Text "The SCC database already exists. Always select: springsclimbingcenter" `
    -Font $FontBody `
    -Padding (New-Object System.Windows.Forms.Padding(0, 4, 0, 0))

$warningLayout.Controls.Add($warningTitle)
$warningLayout.Controls.Add($warningText)

$warningPanel.Controls.Add($warningLayout)

$mainLayout.Controls.Add($warningPanel)


# =============================================================================
# BOTTOM BUTTONS
# =============================================================================

$bottomButtons = New-Object System.Windows.Forms.FlowLayoutPanel

$bottomButtons.Dock = [System.Windows.Forms.DockStyle]::Top
$bottomButtons.AutoSize = $true
$bottomButtons.AutoSizeMode = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
$bottomButtons.WrapContents = $true
$bottomButtons.FlowDirection = [System.Windows.Forms.FlowDirection]::LeftToRight
$bottomButtons.Padding = New-Object System.Windows.Forms.Padding(0, 12, 0, 12)

$technicalButton = New-SCCButton `
    -Text "TECHNICAL DETAILS" `
    -Width 210 `
    -Height 44

$closeButton = New-SCCButton `
    -Text "CLOSE" `
    -Width 130 `
    -Height 44

$bottomButtons.Controls.Add($technicalButton)
$bottomButtons.Controls.Add($closeButton)

$mainLayout.Controls.Add($bottomButtons)


# =============================================================================
# UPDATE DISPLAY
# =============================================================================

$script:CurrentStatus = $null


function Set-StatusDisplay {
    param(
        $ControlSet,
        [bool]$OK,
        [string]$Value
    )

    if ($OK) {

        $ControlSet.Symbol.Text = "✓"
        $ControlSet.Symbol.ForeColor = $ColorGreen

        $ControlSet.Value.Text = $Value
        $ControlSet.Value.ForeColor = $ColorGreen

    }
    else {

        $ControlSet.Symbol.Text = "X"
        $ControlSet.Symbol.ForeColor = $ColorRed

        $ControlSet.Value.Text = $Value
        $ControlSet.Value.ForeColor = $ColorRed
    }
}


function Update-SCCDisplay {

    $script:CurrentStatus = Get-SCCStatus

    $s = $script:CurrentStatus


    # IP address
    $ipBox.Text = $s.IPv4


    # Network adapter
    Set-StatusDisplay `
        -ControlSet $adapterStatus `
        -OK $s.AdapterOK `
        -Value $s.AdapterName


    # IPv4
    Set-StatusDisplay `
        -ControlSet $ipStatus `
        -OK $s.IPv4OK `
        -Value $s.IPv4


    # MySQL service
    Set-StatusDisplay `
        -ControlSet $mysqlStatus `
        -OK $s.MySQLOK `
        -Value $s.MySQLStatus


    # Port 3306
    Set-StatusDisplay `
        -ControlSet $portStatus `
        -OK $s.Port3306OK `
        -Value $s.Port3306


    # Copy button is only useful if we actually found an IP.
    $copyButton.Enabled = $s.IPv4OK
    $instructionsButton.Enabled = $s.IPv4OK
}


# =============================================================================
# COPY IP BUTTON
# =============================================================================

$copyButton.Add_Click({

    if ($script:CurrentStatus.IPv4OK) {

        [System.Windows.Forms.Clipboard]::SetText(
            $script:CurrentStatus.IPv4
        )

        $originalText = $copyButton.Text

        $copyButton.Text = "IP COPIED"

        $copyTimer = New-Object System.Windows.Forms.Timer
        $copyTimer.Interval = 1300

        $copyTimer.Add_Tick({

            $copyTimer.Stop()
            $copyButton.Text = $originalText
            $copyTimer.Dispose()

        })

        $copyTimer.Start()
    }

})


# =============================================================================
# REFRESH BUTTON
# =============================================================================

$refreshButton.Add_Click({

    $refreshButton.Enabled = $false
    $refreshButton.Text = "CHECKING..."

    $form.Refresh()

    Update-SCCDisplay

    $refreshButton.Text = "REFRESH STATUS"
    $refreshButton.Enabled = $true

})


# =============================================================================
# RGP FIX INSTRUCTIONS WINDOW
# =============================================================================

$instructionsButton.Add_Click({

    if (-not $script:CurrentStatus.IPv4OK) {

        [System.Windows.Forms.MessageBox]::Show(
            "Computer 1's IP address could not be found. Do not change Rock Gym Pro on Computer 2 yet.",
            "IP Address Not Found",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )

        return
    }


    $ip = $script:CurrentStatus.IPv4


    $instructionForm = New-Object System.Windows.Forms.Form

    $instructionForm.Text = "SCC - Rock Gym Pro Fix Instructions"
    $instructionForm.BackColor = $ColorBackground
    $instructionForm.ForeColor = $ColorText
    $instructionForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterParent

    $instructionForm.MinimumSize = New-Object System.Drawing.Size(760, 600)
    $instructionForm.Size = New-Object System.Drawing.Size(900, 760)

    $instructionForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::Sizable
    $instructionForm.MaximizeBox = $true
    $instructionForm.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi


    # -------------------------------------------------------------------------
    # BOTTOM BAR
    # -------------------------------------------------------------------------

    $instructionBottom = New-Object System.Windows.Forms.Panel
    $instructionBottom.Dock = [System.Windows.Forms.DockStyle]::Bottom
    $instructionBottom.Height = 68
    $instructionBottom.Padding = New-Object System.Windows.Forms.Padding(15, 10, 15, 10)
    $instructionBottom.BackColor = $ColorBackground

    $instructionClose = New-SCCButton `
        -Text "CLOSE INSTRUCTIONS" `
        -Width 210 `
        -Height 44

    $instructionClose.Dock = [System.Windows.Forms.DockStyle]::Right

    $instructionClose.Add_Click({
        $instructionForm.Close()
    })

    $instructionBottom.Controls.Add($instructionClose)

    $instructionForm.Controls.Add($instructionBottom)


    # -------------------------------------------------------------------------
    # SCROLLABLE INSTRUCTIONS
    # -------------------------------------------------------------------------

    $instructionBox = New-Object System.Windows.Forms.RichTextBox

    $instructionBox.Dock = [System.Windows.Forms.DockStyle]::Fill
    $instructionBox.ReadOnly = $true
    $instructionBox.BackColor = $ColorPanel
    $instructionBox.ForeColor = $ColorText
    $instructionBox.Font = $FontInstructions

    $instructionBox.BorderStyle = [System.Windows.Forms.BorderStyle]::None

    $instructionBox.ScrollBars = [System.Windows.Forms.RichTextBoxScrollBars]::Vertical

    $instructionBox.WordWrap = $true

    $instructionBox.DetectUrls = $false

    $instructionBox.Margin = New-Object System.Windows.Forms.Padding(20)


    $instructions = @"
ROCK GYM PRO CONNECTION FIX
Computer 2

Current Computer 1 database-server address:

    $ip


IMPORTANT

Only follow these instructions if Computer 1 is the SCC database server.

Do not guess an IP address.

Do not create a new database.

The existing SCC database is:

    springsclimbingcenter


STEP 1 - GO TO COMPUTER 2

These changes are made on Computer 2, the Rock Gym Pro workstation.


STEP 2 - CLOSE ROCK GYM PRO

If Rock Gym Pro is currently open on Computer 2, close it.


STEP 3 - OPEN THE DATABASE CONFIGURATION WIZARD

Open:

    Rock Gym Pro Database Configuration Wizard


STEP 4 - WELCOME SCREEN

Click:

    Next

Do NOT use Advanced Setup.


STEP 5 - DATABASE LOCATION

On the screen titled:

    Compatible MySQL Server 5 Database Location

choose:

    I am adding a new workstation to an existing RGP deployment
    and my database server is running on another computer on
    my network.


STEP 6 - DATABASE SERVER ADDRESS

Find:

    Fixed IP Address / Server Name

Enter exactly:

    $ip

Then click:

    Next


STEP 7 - DATABASE USERNAME AND PASSWORD

On:

    Database Server Username and Password

leave the EXISTING Rock Gym Pro database username and password in place.

Do not invent or replace the credentials.

Continue to the next screen.


STEP 8 - DATABASE SELECTION

Choose:

    I already created a Rock Gym Pro database

Then select:

    springsclimbingcenter


DO NOT SELECT:

    I would like to create a NEW database now!


STEP 9 - MASTER ENCRYPTION KEY

If Rock Gym Pro asks for the Master Encryption Key, use the EXISTING SCC encryption key.

Do not make up a new encryption key.

If the correct key is not available, STOP.


STEP 10 - CONFIGURATION COMPLETE

Before clicking Start, verify that the final screen shows:

    Database Server:    $ip

    Database Name:      springsclimbingcenter


If both values are correct, click:

    Start


Rock Gym Pro should reconnect Computer 2 to the existing SCC database.


============================================================
DO NOT CREATE A NEW DATABASE
============================================================

Existing database:

    springsclimbingcenter

Created by Ti Schwarz
Springs Climbing Center
"@


    $instructionBox.Text = $instructions

    $instructionForm.Controls.Add($instructionBox)

    # Ensure Fill control stays behind bottom bar correctly.
    $instructionBox.BringToFront()

    [void]$instructionForm.ShowDialog($form)

})


# =============================================================================
# TECHNICAL DETAILS WINDOW
# =============================================================================

$technicalButton.Add_Click({

    $s = $script:CurrentStatus


    $technicalForm = New-Object System.Windows.Forms.Form

    $technicalForm.Text = "SCC - RGP Technical Details"
    $technicalForm.BackColor = $ColorBackground
    $technicalForm.ForeColor = $ColorText

    $technicalForm.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterParent

    $technicalForm.MinimumSize = New-Object System.Drawing.Size(650, 500)
    $technicalForm.Size = New-Object System.Drawing.Size(800, 650)

    $technicalForm.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::Sizable
    $technicalForm.MaximizeBox = $true
    $technicalForm.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi


    $techBottom = New-Object System.Windows.Forms.Panel
    $techBottom.Dock = [System.Windows.Forms.DockStyle]::Bottom
    $techBottom.Height = 68
    $techBottom.Padding = New-Object System.Windows.Forms.Padding(15, 10, 15, 10)

    $techClose = New-SCCButton `
        -Text "CLOSE TECHNICAL DETAILS" `
        -Width 250 `
        -Height 44

    $techClose.Dock = [System.Windows.Forms.DockStyle]::Right

    $techClose.Add_Click({
        $technicalForm.Close()
    })

    $techBottom.Controls.Add($techClose)

    $technicalForm.Controls.Add($techBottom)


    $techBox = New-Object System.Windows.Forms.RichTextBox

    $techBox.Dock = [System.Windows.Forms.DockStyle]::Fill
    $techBox.ReadOnly = $true
    $techBox.BackColor = $ColorPanel
    $techBox.ForeColor = $ColorText
    $techBox.Font = New-Object System.Drawing.Font("Consolas", 11)

    $techBox.BorderStyle = [System.Windows.Forms.BorderStyle]::None
    $techBox.ScrollBars = [System.Windows.Forms.RichTextBoxScrollBars]::Vertical
    $techBox.WordWrap = $true


    $techBox.Text = @"
SCC - RGP CONNECTION HELPER
TECHNICAL DETAILS

Created by Ti Schwarz


WHAT THIS HELPER CHECKS
-----------------------

1. NETWORK ADAPTER

Checks whether Windows currently has an active physical network connection.

Result:

    $($s.AdapterName)


2. IPV4 ADDRESS

Finds the current local IPv4 address assigned to Computer 1.

Result:

    $($s.IPv4)

This is the address Computer 2 uses to locate the Rock Gym Pro database server.


3. ROCK GYM PRO / MYSQL WINDOWS SERVICE

Looks for a Windows service whose name or display name contains "MySQL."

Service:

    $($s.MySQLName)

Status:

    $($s.MySQLStatus)


On the real SCC Computer 1, this service should normally be running.


4. MYSQL TCP PORT 3306

Rock Gym Pro communicates with MySQL using TCP port 3306.

This helper checks whether Windows reports a process listening locally on that port.

Result:

    $($s.Port3306)


5. WHY THE IP ADDRESS MATTERS

Computer 1 currently receives its network address dynamically.

If Computer 1 receives a different address, Computer 2 can continue trying to contact the old address.

That can produce:

    Error connecting to MySQL Server


The workaround is to identify Computer 1's current address and update the Rock Gym Pro Database Server setting on Computer 2.


NORMAL SCC COMPUTER 1 STATE
---------------------------

Network adapter:      Connected

IPv4 address:         Found

RGP / MySQL service:  Running

TCP port 3306:        Listening


PERSONAL-LAPTOP TESTING
-----------------------

If this script is running on Ti's personal laptop rather than the SCC database server:

    MySQL service:     Not detected

and

    TCP port 3306:     Not listening

may be completely normal.


DATABASE SAFETY
---------------

Existing SCC database:

    springsclimbingcenter

Never create a replacement database as part of this workaround.


Created by Ti Schwarz
Springs Climbing Center
"@


    $technicalForm.Controls.Add($techBox)

    $techBox.BringToFront()

    [void]$technicalForm.ShowDialog($form)

})


# =============================================================================
# CLOSE BUTTON
# =============================================================================

$closeButton.Add_Click({
    $form.Close()
})


# =============================================================================
# INITIAL CHECK
# =============================================================================

$form.Add_Shown({

    # Bring the helper to the front when it first opens.
    $form.Activate()
    $form.BringToFront()

    Update-SCCDisplay

})


# =============================================================================
# RUN
# =============================================================================

[void]$form.ShowDialog()