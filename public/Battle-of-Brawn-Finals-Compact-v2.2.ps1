<#
Battle of Brawn - Finals Compact v2.2
Designed for a flat mirrored projector and a cropped livestream feed.
F8 toggles controls. F11 toggles fullscreen. B toggles blackout. ESC exits blackout.
Double-click a boulder pip to type 1T1Z, 2T1Z, 3Z, etc.; Enter commits.
Double-click a name to edit it. Only the first word of the name is displayed.
Manual results are autosaved locally and restored on the next launch.
#>

# ---------- Configuration ----------
$Windowed = $true
$UseManualFinalists = $true
$SpreadsheetId = '1qzEaH5ha8H6R1VeFLMxAy8hp3X2JMj3h39Arthu4mWY'
$MenGid = '1069906247'
$WomenGid = '2055835783'
$PollSeconds = 2
$InferZoneOnTop = $true
$CacheRoot = Join-Path $env:LOCALAPPDATA 'SCC_BoB'
$StatePath = Join-Path $CacheRoot 'finals-compact-state.json'
New-Item -ItemType Directory -Path $CacheRoot -Force | Out-Null

if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') {
    if (-not $PSCommandPath) { throw 'Save this as a .ps1 file and run it from Windows PowerShell.' }
    & powershell.exe -STA -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath
    exit
}
Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase

function New-EmptyRow([int]$rank) {
    [pscustomobject]@{
        Id = [guid]::NewGuid().ToString(); Q = $rank; Climber = ''; DisplayName = ''
        B1 = ''; B2 = ''; B3 = ''; B4 = ''
        Tops = 0; Zones = 0; AttT = 0; AttZ = 0; Place = $rank
        B1ShowZone = $false; B1ShowTop = $false
        B2ShowZone = $false; B2ShowTop = $false
        B3ShowZone = $false; B3ShowTop = $false
        B4ShowZone = $false; B4ShowTop = $false
    }
}
$script:ManualWomen = @(1..6 | ForEach-Object { New-EmptyRow $_ })
$script:ManualMen = @(1..6 | ForEach-Object { New-EmptyRow $_ })
$script:Overrides = @{}
$script:ManualPaused = $false
$script:EditingPaused = $false
$script:Refreshing = $false
$script:LastSnapshot = ''

function Normalize([string]$value) {
    if ($null -eq $value) { return '' }
    $value = $value.Replace([char]0x00A0, ' ').Trim()
    if ($value.ToLower().Replace(' ', '') -eq '0z0t') { return '' }
    return $value
}
# Original finals score parsing logic retained from the supplied projector script.
function Parse-Score([string]$value) {
    $s = Normalize $value
    if ([string]::IsNullOrWhiteSpace($s)) {
        return [pscustomobject]@{T=0;Z=0;AT=0;AZ=0;ShowZone=$false;ShowTop=$false}
    }
    $sl = $s.ToLower().Replace(' ','')
    $t=0; $z=0; $at=0; $az=0
    $mT=[regex]::Match($sl,'(?i)(\d+)t')
    if ($mT.Success) { $at=[int]$mT.Groups[1].Value; if ($at -gt 0) { $t=1 } }
    $mZ=[regex]::Match($sl,'(?i)(\d+)z')
    if ($mZ.Success) { $az=[int]$mZ.Groups[1].Value; if ($az -gt 0) { $z=1 } }
    if ($t -eq 0) {
        if ($sl -match '(?i)\bflash\b' -or $sl -match '✓' -or $sl -match '(^|[^0-9])t($|[^a-z])') {
            $t=1; if ($at -eq 0) { $at=1 }
        }
    }
    if ($z -eq 0) {
        if ($sl -match '(^|[^0-9])z($|[^a-z])') {
            $z=1; if ($az -eq 0) { $az=1 }
        }
    }
    if ($InferZoneOnTop -and $t -ge 1 -and $z -lt 1) {
        $z=1; if ($az -lt 1) { $az=[Math]::Max(1,$at) }
    }
    return [pscustomobject]@{T=$t;Z=$z;AT=$at;AZ=$az;ShowZone=(-not ($t -ge 1) -and $z -ge 1);ShowTop=($t -ge 1)}
}
function Recompute-Rows($rows) {
    foreach ($r in $rows) {
        $r.Climber = Normalize $r.Climber
        $r.DisplayName = if ($r.Climber) { ($r.Climber -split '\s+')[0] } else { '' }
        $r.Tops = 0; $r.Zones = 0; $r.AttT = 0; $r.AttZ = 0
        foreach ($b in @('B1','B2','B3','B4')) {
            $p = Parse-Score ([string]$r.$b)
            $r.Tops += $p.T; $r.Zones += $p.Z
            $r.AttT += $p.AT; $r.AttZ += $p.AZ
            $r.("${b}ShowTop") = $p.ShowTop
            $r.("${b}ShowZone") = $p.ShowZone
        }
    }
}
# Original standings ordering and ranking logic retained from supplied projector script.
function Rank-Rows($rows) {
    $ordered = @($rows | Sort-Object `
        @{Expression={$_.Tops};Descending=$true}, `
        @{Expression={$_.Zones};Descending=$true}, `
        @{Expression={$_.AttT};Descending=$false}, `
        @{Expression={$_.AttZ};Descending=$false}, `
        @{Expression={$_.Q};Descending=$false})
    $place=0; $prev=$null
    foreach ($r in $ordered) {
        if (-not $prev -or $r.Tops -ne $prev.Tops -or $r.Zones -ne $prev.Zones -or
            $r.AttT -ne $prev.AttT -or $r.AttZ -ne $prev.AttZ -or $r.Q -ne $prev.Q) {
            $place++
        }
        $r.Place=$place
        $prev=$r
    }
    return $ordered
}
function Save-LocalState {
    if (-not $UseManualFinalists) { return }
    try {
        $state = @{
            Women = @($script:ManualWomen | ForEach-Object { @{ Q=$_.Q; Climber=$_.Climber; B1=$_.B1; B2=$_.B2; B3=$_.B3; B4=$_.B4 } })
            Men = @($script:ManualMen | ForEach-Object { @{ Q=$_.Q; Climber=$_.Climber; B1=$_.B1; B2=$_.B2; B3=$_.B3; B4=$_.B4 } })
        }
        $temp = "$StatePath.tmp"
        $state | ConvertTo-Json -Depth 6 | Set-Content -Path $temp -Encoding UTF8
        Move-Item -LiteralPath $temp -Destination $StatePath -Force
    } catch { Write-Warning "Could not autosave finalists: $_" }
}
function Restore-LocalState {
    if (-not (Test-Path $StatePath)) { return }
    try {
        $saved = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
        foreach ($gender in @('Women','Men')) {
            $target = if ($gender -eq 'Women') { $script:ManualWomen } else { $script:ManualMen }
            $source = @($saved.$gender)
            for ($i = 0; $i -lt [Math]::Min(6,$source.Count); $i++) {
                foreach ($field in @('Climber','B1','B2','B3','B4')) {
                    if ($null -ne $source[$i].$field) { $target[$i].$field = [string]$source[$i].$field }
                }
                if ($null -ne $source[$i].Q -and [string]$source[$i].Q -match '^\d+$') {
                    $target[$i].Q = [int]$source[$i].Q
                }
            }
        }
    } catch { Write-Warning "Could not restore finalists: $_" }
}
Restore-LocalState

function Get-SheetRows([string]$gid, [string]$gender) {
    $uri = "https://docs.google.com/spreadsheets/d/$SpreadsheetId/export?format=csv&gid=$gid&nocache=$([DateTime]::UtcNow.Ticks)"
    $path = Join-Path $CacheRoot "$gender.csv"
    try {
        if (-not $script:ManualPaused) {
            $response = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200 -and $response.Content) {
                [System.IO.File]::WriteAllText($path,[string]$response.Content,[System.Text.Encoding]::UTF8)
            }
        }
    } catch { }
    if (-not (Test-Path $path)) { return @() }
    $output = @(); $idx = 0
    foreach ($csv in @(Import-Csv -Path $path)) {
        $name = Normalize ([string]$csv.$gender)
        if (-not $name) { continue }
        $idx++
        $r = New-EmptyRow $idx
        $r.Id = "$gender|$idx|$name"
        $r.Climber = $name
        if ([string]$csv.'Qualifiers Rank' -match '^\s*(\d+)') { $r.Q = [int]$Matches[1] }
        foreach ($n in 1..4) { $r.("B$n") = Normalize ([string]$csv.("Boulder $n")) }
        $output += $r
    }
    return @($output | Sort-Object Q | Select-Object -First 6)
}

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Battle of Brawn - Finals Compact" Width="1280" Height="720"
        MinWidth="820" MinHeight="380" WindowStartupLocation="CenterScreen"
        Background="#101010" Foreground="White" ResizeMode="CanResize">
  <Window.Resources>
    <BooleanToVisibilityConverter x:Key="BoolToVisibility" />
    <Style x:Key="ScoreCell" TargetType="TextBlock">
      <Setter Property="HorizontalAlignment" Value="Center"/>
      <Setter Property="VerticalAlignment" Value="Center"/>
      <Setter Property="TextAlignment" Value="Center"/>
    </Style>
    <Style x:Key="NameCell" TargetType="TextBlock">
      <Setter Property="VerticalAlignment" Value="Center"/>
      <Setter Property="TextTrimming" Value="CharacterEllipsis"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
    </Style>
    <Style x:Key="CellHeader" TargetType="DataGridColumnHeader">
      <Setter Property="Background" Value="#C90000"/>
      <Setter Property="Foreground" Value="White"/>
      <Setter Property="FontWeight" Value="Bold"/>
      <Setter Property="HorizontalContentAlignment" Value="Center"/>
      <Setter Property="Padding" Value="1,3"/>
      <Setter Property="BorderThickness" Value="0"/>
    </Style>
    <Style x:Key="ScoreGrid" TargetType="DataGrid">
      <Setter Property="Background" Value="#191919"/>
      <Setter Property="Foreground" Value="White"/>
      <Setter Property="RowBackground" Value="#191919"/>
      <Setter Property="AlternatingRowBackground" Value="#222222"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="GridLinesVisibility" Value="None"/>
      <Setter Property="HeadersVisibility" Value="Column"/>
      <Setter Property="ColumnHeaderStyle" Value="{StaticResource CellHeader}"/>
      <Setter Property="CanUserAddRows" Value="False"/>
      <Setter Property="CanUserDeleteRows" Value="False"/>
      <Setter Property="CanUserReorderColumns" Value="False"/>
      <Setter Property="CanUserSortColumns" Value="False"/>
      <Setter Property="CanUserResizeColumns" Value="False"/>
      <Setter Property="SelectionUnit" Value="Cell"/>
      <Setter Property="FontSize" Value="19"/>
      <Setter Property="RowHeight" Value="38"/>
      <Setter Property="ColumnHeaderHeight" Value="30"/>
      <Setter Property="VerticalAlignment" Value="Top"/>
      <Setter Property="ScrollViewer.HorizontalScrollBarVisibility" Value="Disabled"/>
      <Setter Property="ScrollViewer.VerticalScrollBarVisibility" Value="Disabled"/>
      <Setter Property="AutoGenerateColumns" Value="False"/>
    </Style>
    <DataTemplate x:Key="PipTemplate">
      <Grid Width="24" Height="15" HorizontalAlignment="Center" VerticalAlignment="Center">
        <Border Background="#3A3A3A" CornerRadius="2"/>
      </Grid>
    </DataTemplate>
  </Window.Resources>

  <Grid x:Name="RootGrid" Margin="0">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="*"/>
      <RowDefinition x:Name="ControlsRow" Height="Auto"/>
    </Grid.RowDefinitions>

    <Grid Grid.Row="0" Margin="8,5,8,0">
      <TextBlock x:Name="TitleText" Text="BATTLE OF BRAWN | FINALS" FontWeight="Bold"
                 FontSize="28" HorizontalAlignment="Center" VerticalAlignment="Center"/>
      <Button x:Name="BtnToggleControls" Content="Controls" ToolTip="Show/hide controls (F8)"
              HorizontalAlignment="Right" VerticalAlignment="Top" FontSize="11"
              Padding="5,2" Margin="0,0,0,0" Opacity="0.72"/>
    </Grid>

    <Grid Grid.Row="1" Margin="8,3,8,0">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="10"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <StackPanel Grid.Column="0" VerticalAlignment="Top">
        <TextBlock x:Name="LeftHeader" Text="WOMEN" FontSize="21" FontWeight="Bold"
                   Margin="3,0,0,3"/>
        <DataGrid x:Name="GridLeft" Style="{StaticResource ScoreGrid}">
          <DataGrid.Columns>
            <DataGridTextColumn Header="#" Binding="{Binding Place}" Width="30" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTemplateColumn Header="Name" Width="*" MinWidth="65">
              <DataGridTemplateColumn.CellTemplate>
                <DataTemplate><TextBlock Text="{Binding DisplayName}" Style="{StaticResource NameCell}"/></DataTemplate>
              </DataGridTemplateColumn.CellTemplate>
              <DataGridTemplateColumn.CellEditingTemplate>
                <DataTemplate><TextBox Text="{Binding Climber, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}" FontSize="16"/></DataTemplate>
              </DataGridTemplateColumn.CellEditingTemplate>
            </DataGridTemplateColumn>
            <DataGridTemplateColumn Header="B1" Width="33"/>
            <DataGridTemplateColumn Header="B2" Width="33"/>
            <DataGridTemplateColumn Header="B3" Width="33"/>
            <DataGridTemplateColumn Header="B4" Width="33"/>
            <DataGridTextColumn Header="T" Binding="{Binding Tops}" Width="29" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="Z" Binding="{Binding Zones}" Width="29" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="AT" Binding="{Binding AttT}" Width="34" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="AZ" Binding="{Binding AttZ}" Width="34" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
          </DataGrid.Columns>
        </DataGrid>
      </StackPanel>

      <StackPanel Grid.Column="2" VerticalAlignment="Top">
        <TextBlock x:Name="RightHeader" Text="MEN" FontSize="21" FontWeight="Bold"
                   Margin="3,0,0,3"/>
        <DataGrid x:Name="GridRight" Style="{StaticResource ScoreGrid}">
          <DataGrid.Columns>
            <DataGridTextColumn Header="#" Binding="{Binding Place}" Width="30" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTemplateColumn Header="Name" Width="*" MinWidth="65">
              <DataGridTemplateColumn.CellTemplate>
                <DataTemplate><TextBlock Text="{Binding DisplayName}" Style="{StaticResource NameCell}"/></DataTemplate>
              </DataGridTemplateColumn.CellTemplate>
              <DataGridTemplateColumn.CellEditingTemplate>
                <DataTemplate><TextBox Text="{Binding Climber, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}" FontSize="16"/></DataTemplate>
              </DataGridTemplateColumn.CellEditingTemplate>
            </DataGridTemplateColumn>
            <DataGridTemplateColumn Header="B1" Width="33"/>
            <DataGridTemplateColumn Header="B2" Width="33"/>
            <DataGridTemplateColumn Header="B3" Width="33"/>
            <DataGridTemplateColumn Header="B4" Width="33"/>
            <DataGridTextColumn Header="T" Binding="{Binding Tops}" Width="29" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="Z" Binding="{Binding Zones}" Width="29" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="AT" Binding="{Binding AttT}" Width="34" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
            <DataGridTextColumn Header="AZ" Binding="{Binding AttZ}" Width="34" IsReadOnly="True" ElementStyle="{StaticResource ScoreCell}"/>
          </DataGrid.Columns>
        </DataGrid>
      </StackPanel>
    </Grid>

    <Border x:Name="ControlsPanel" Grid.Row="2" Background="#222222"
            Padding="8,7" Margin="8,0,8,7" Visibility="Visible">
      <StackPanel>
        <WrapPanel>
          <Button x:Name="BtnPause" Content="Pause" Padding="8,3" Margin="0,0,6,0"/>
          <Button x:Name="BtnBlack" Content="Blackout (B)" Padding="8,3" Margin="0,0,6,0"/>
          <Button x:Name="BtnFullscreen" Content="Fullscreen (F11)" Padding="8,3" Margin="0,0,6,0"/>
          <TextBlock Text="Name width" VerticalAlignment="Center" Margin="10,0,4,0"/>
          <Slider x:Name="SldNameWidth" Minimum="65" Maximum="240" Value="190" Width="95" VerticalAlignment="Center"/>
          <TextBlock Text="Font" VerticalAlignment="Center" Margin="10,0,4,0"/>
          <Slider x:Name="SldFontSize" Minimum="13" Maximum="23" Value="19" Width="85" VerticalAlignment="Center"/>
          <TextBlock Text="Title" VerticalAlignment="Center" Margin="10,0,4,0"/>
          <Slider x:Name="SldTitleSize" Minimum="18" Maximum="36" Value="28" Width="85" VerticalAlignment="Center"/>
          <Button x:Name="BtnHide" Content="Hide controls (F8)" Padding="8,3" Margin="10,0,0,0"/>
        </WrapPanel>
        <TextBlock x:Name="StatusText" FontSize="11" Foreground="#BBBBBB" Margin="0,5,0,0"/>
      </StackPanel>
    </Border>

    <Border x:Name="BlackoutOverlay" Background="Black" Grid.RowSpan="3"
            Visibility="Collapsed" Panel.ZIndex="9999">
      <Button x:Name="BtnExitBlack" Content="Exit blackout (Esc)" Padding="8,3"
              HorizontalAlignment="Right" VerticalAlignment="Top" Margin="8"/>
    </Border>
  </Grid>
</Window>
'@

try {
    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $w = [Windows.Markup.XamlReader]::Load($reader)
} catch {
    $details = $_.Exception.ToString()
    Write-Host "Scoreboard window could not load:" -ForegroundColor Red
    Write-Host $details -ForegroundColor Yellow
    throw "Scoreboard XAML initialization failed. Read the error immediately above; later UI code was not run."
}
if ($null -eq $w) { throw 'Scoreboard window initialization returned null.' }
foreach ($name in @('TitleText','LeftHeader','RightHeader','GridLeft','GridRight',
    'BtnToggleControls','ControlsPanel','BtnPause','BtnBlack','BtnFullscreen',
    'SldNameWidth','SldFontSize','SldTitleSize','BtnHide','StatusText',
    'BlackoutOverlay','BtnExitBlack')) {
    $control = $w.FindName($name)
    if ($null -eq $control) { throw "Scoreboard control missing from XAML: $name" }
    Set-Variable -Name $name -Value $control -Scope Script
}

# Generate four editable pip columns for each table. The filled upper half means
# a top, the filled lower half means a zone without a top.
function New-PipTemplate([string]$b, [bool]$editing) {
    if ($editing) {
        $templateXaml = '<DataTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"><TextBox Text="{Binding ' + $b + ', Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}" Background="White" Foreground="Black" FontSize="14" Padding="0" /></DataTemplate>'
    } else {
        $templateXaml = '<DataTemplate xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"><DataTemplate.Resources><BooleanToVisibilityConverter x:Key="BoolToVisibility" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"/></DataTemplate.Resources><Grid Width="24" Height="15" HorizontalAlignment="Center" VerticalAlignment="Center"><Border Background="#444444" CornerRadius="2"/><Rectangle Fill="#FFD400" Visibility="{Binding ' + $b + 'ShowTop, Converter={StaticResource BoolToVisibility}}"/><Rectangle Fill="#FFD400" Height="7" VerticalAlignment="Bottom" Visibility="{Binding ' + $b + 'ShowZone, Converter={StaticResource BoolToVisibility}}"/></Grid></DataTemplate>'
    }
    $xmlReader = New-Object System.Xml.XmlNodeReader ([xml]$templateXaml)
    return [Windows.Markup.XamlReader]::Load($xmlReader)
}
foreach ($dg in @($GridLeft,$GridRight)) {
    for ($i=1; $i -le 4; $i++) {
        $col = [Windows.Controls.DataGridTemplateColumn]$dg.Columns[$i+1]
        $col.CellTemplate = New-PipTemplate "B$i" $false
        $col.CellEditingTemplate = New-PipTemplate "B$i" $true
    }
}

function Refresh-Scores {
    if ($script:Refreshing -or $script:EditingPaused) { return }
    $script:Refreshing = $true
    try {
        if ($UseManualFinalists) {
            $women = $script:ManualWomen
            $men = $script:ManualMen
        } else {
            $women = @(Get-SheetRows $WomenGid 'Women')
            $men = @(Get-SheetRows $MenGid 'Men')
        }
        Recompute-Rows $women; Recompute-Rows $men
        $womenSorted = @(Rank-Rows $women)
        $menSorted = @(Rank-Rows $men)
        $snapshot = ((@($womenSorted) + @($menSorted) | ForEach-Object {
            "$($_.Id):$($_.Climber):$($_.Place):$($_.B1):$($_.B2):$($_.B3):$($_.B4)"
        }) -join '|')
        if ($snapshot -ne $script:LastSnapshot) {
            $GridLeft.ItemsSource = $womenSorted
            $GridRight.ItemsSource = $menSorted
            $script:LastSnapshot = $snapshot
        }
        $StatusText.Text = ('Last refresh: {0} | Paused: {1} | Autosave: {2} | F8 hide controls | F11 fullscreen | B blackout' -f
            (Get-Date -Format 'h:mm:ss tt'),$script:ManualPaused,$UseManualFinalists)
    } catch {
        $StatusText.Text = "Refresh error: $_"
        Write-Warning "Refresh error: $_"
    } finally { $script:Refreshing = $false }
}

# Defer refresh until WPF has committed the textbox binding to the row.
$commitTimer = New-Object Windows.Threading.DispatcherTimer
$commitTimer.Interval = [timespan]::FromMilliseconds(250)
$commitTimer.Add_Tick({
    $commitTimer.Stop()
    $script:EditingPaused = $false
    Save-LocalState
    $script:LastSnapshot = ''
    Refresh-Scores
})
foreach ($dg in @($GridLeft,$GridRight)) {
    $dg.Add_BeginningEdit({ $script:EditingPaused = $true; $commitTimer.Stop() })
    $dg.Add_CellEditEnding({
        $commitTimer.Stop()
        $commitTimer.Start()
    })
    $dg.Add_PreviewKeyDown({
        param($sender,$e)
        if ($e.Key -eq [Windows.Input.Key]::Enter -and $sender.IsKeyboardFocusWithin) {
            [void]$sender.CommitEdit([Windows.Controls.DataGridEditingUnit]::Cell,$true)
            [void]$sender.CommitEdit([Windows.Controls.DataGridEditingUnit]::Row,$true)
            $e.Handled = $true
        }
    })
}

function Toggle-Controls {
    if ($ControlsPanel.Visibility -eq [Windows.Visibility]::Visible) {
        $ControlsPanel.Visibility = [Windows.Visibility]::Collapsed
        $BtnToggleControls.Content = 'Edit'
    } else {
        $ControlsPanel.Visibility = [Windows.Visibility]::Visible
        $BtnToggleControls.Content = 'Controls'
    }
}
function Toggle-Blackout {
    if ($BlackoutOverlay.Visibility -eq [Windows.Visibility]::Visible) {
        $BlackoutOverlay.Visibility = [Windows.Visibility]::Collapsed
    } else { $BlackoutOverlay.Visibility = [Windows.Visibility]::Visible }
}
function Toggle-Fullscreen {
    if ($w.WindowStyle -eq [Windows.WindowStyle]::None) {
        $w.WindowStyle = [Windows.WindowStyle]::SingleBorderWindow
        $w.WindowState = [Windows.WindowState]::Normal
    } else {
        $w.WindowState = [Windows.WindowState]::Normal
        $w.WindowStyle = [Windows.WindowStyle]::None
        $w.WindowState = [Windows.WindowState]::Maximized
    }
}
$BtnToggleControls.Add_Click({ Toggle-Controls })
$BtnHide.Add_Click({ Toggle-Controls })
$BtnPause.Add_Click({
    $script:ManualPaused = -not $script:ManualPaused
    $BtnPause.Content = if ($script:ManualPaused) { 'Resume' } else { 'Pause' }
    Refresh-Scores
})
$BtnBlack.Add_Click({ Toggle-Blackout })
$BtnExitBlack.Add_Click({ Toggle-Blackout })
$BlackoutOverlay.Add_MouseLeftButtonDown({ Toggle-Blackout })
$BtnFullscreen.Add_Click({ Toggle-Fullscreen })
$w.Add_PreviewKeyDown({
    param($sender,$e)
    if ($e.Key -eq [Windows.Input.Key]::F8) { Toggle-Controls; $e.Handled = $true }
    elseif ($e.Key -eq [Windows.Input.Key]::F11) { Toggle-Fullscreen; $e.Handled = $true }
    elseif ($e.Key -eq [Windows.Input.Key]::Escape -and $BlackoutOverlay.Visibility -eq [Windows.Visibility]::Visible) {
        Toggle-Blackout; $e.Handled = $true
    }
    elseif ($e.Key -eq [Windows.Input.Key]::B -and -not ($e.OriginalSource -is [Windows.Controls.TextBox])) {
        Toggle-Blackout; $e.Handled = $true
    }
})

$SldNameWidth.Add_ValueChanged({
    $px = [double]$SldNameWidth.Value
    foreach ($dg in @($GridLeft,$GridRight)) {
        $dg.Columns[1].Width = New-Object Windows.Controls.DataGridLength($px)
    }
})
$SldFontSize.Add_ValueChanged({
    foreach ($dg in @($GridLeft,$GridRight)) { $dg.FontSize = [double]$SldFontSize.Value }
})
$SldTitleSize.Add_ValueChanged({ $TitleText.FontSize = [double]$SldTitleSize.Value })

$pollTimer = New-Object Windows.Threading.DispatcherTimer
$pollTimer.Interval = [timespan]::FromSeconds($PollSeconds)
$pollTimer.Add_Tick({ if (-not $script:ManualPaused -and -not $script:EditingPaused) { Refresh-Scores } })
$pollTimer.Start()
$w.Add_Closing({ Save-LocalState; $pollTimer.Stop(); $commitTimer.Stop() })

if (-not $Windowed) { Toggle-Fullscreen }
Refresh-Scores
[void]$w.ShowDialog()
