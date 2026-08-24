<# ==========================================================
Battle of Brawn — Finals Projector
(ManualFinalists + PerRowIds + Edit+Pips+PixelWidth + AutoPause
 + OverlayBlackout (Top-Right Exit only + B/ESC/Click) + Credits
 + Stealth + Tilt + Footer Grid for visible clock)
========================================================== #>

# ---------- CONFIG ----------
$SpreadsheetId = "1qzEaH5ha8H6R1VeFLMxAy8hp3X2JMj3h39Arthu4mWY"
$MenGid   = "1069906247"
$WomenGid = "2055835783"

$PollSeconds           = 2
$RequireRepeatPerCell  = 2
$BlankHoldMilliseconds = 600
$Windowed              = $true
$InferZoneOnTop        = $true

$CreditsText = "by Ti"
$UseManualFinalists = $true   # keep manual finalists mode

function New-EmptyFinalistRow([int]$q){
  [pscustomobject]@{
    Id=[guid]::NewGuid().ToString()
    Q=$q; Climber="";
    B1=""; B2=""; B3=""; B4="";
    Tops=0; Zones=0; AttT=0; AttZ=0;
    B1ShowZone=$false; B1ShowTop=$false;
    B2ShowZone=$false; B2ShowTop=$false;
    B3ShowZone=$false; B3ShowTop=$false;
    B4ShowZone=$false; B4ShowTop=$false
  }
}

$script:ManualWomen = 1..6 | ForEach-Object { New-EmptyFinalistRow $_ }
$script:ManualMen   = 1..6 | ForEach-Object { New-EmptyFinalistRow $_ }

# ---------- STA ----------
if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') {
  powershell -STA -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath; exit
}

# ---------- WPF + Theme ----------
Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase,System.Drawing
$BgBrush     = [Windows.Media.SolidColorBrush]([Windows.Media.Color]::FromRgb(12,12,12))
$CardBrush   = [Windows.Media.SolidColorBrush]([Windows.Media.Color]::FromRgb(26,26,26))
$AccentBrush = [Windows.Media.SolidColorBrush]([Windows.Media.Color]::FromRgb(204,0,0))
$TextBrush   = [Windows.Media.SolidColorBrush]([Windows.Media.Colors]::White)

function Normalize([string]$s){
  if($null -eq $s){ return "" }
  $t = ($s -replace "`u00A0"," ").Trim()
  if($t.ToLower().Replace(" ","") -eq "0z0t"){ return "" } # explicit clear
  return $t
}

# ---------- Google Sheets (export endpoint; unused in manual) ----------
$CacheRoot = "$env:LOCALAPPDATA\SCC_BoB"
New-Item -ItemType Directory -Path $CacheRoot -Force | Out-Null
function BuildExportUrl([string]$id,[string]$gid){ "https://docs.google.com/spreadsheets/d/$id/export?format=csv&gid=$gid&nocache=$([DateTime]::UtcNow.Ticks)" }
function Get-ExportCsv {
  param([string]$id,[string]$gid,[string]$cacheName)
  $cache = Join-Path $CacheRoot $cacheName
  try {
    $resp = Invoke-WebRequest -Uri (BuildExportUrl $id $gid) -UseBasicParsing -TimeoutSec 10 -Headers @{
      "Cache-Control"="no-cache, no-store, must-revalidate"; "Pragma"="no-cache"; "Expires"="0"
    } -ErrorAction Stop
    if($resp.StatusCode -eq 200 -and $resp.Content){ $resp.Content | Out-File -FilePath $cache -Encoding utf8 -Force }
  } catch { }
  if(Test-Path $cache){ return Import-Csv -Path $cache } else { @() }
}

# ---------- Parse ----------
function Parse-CellScore {
  param([string]$s)
  $s = Normalize $s
  if([string]::IsNullOrWhiteSpace($s)){ return [pscustomobject]@{T=0;Z=0;AT=0;AZ=0;ShowZone=$false;ShowTop=$false} }
  $sl=$s.ToLower().Replace(" ","")
  $t=0;$z=0;$at=0;$az=0
  $mT=[regex]::Match($sl,'(?i)(\d+)t'); if($mT.Success){$at=[int]$mT.Groups[1].Value; if($at -gt 0){$t=1}}
  $mZ=[regex]::Match($sl,'(?i)(\d+)z'); if($mZ.Success){$az=[int]$mZ.Groups[1].Value; if($az -gt 0){$z=1}}
  if($t -eq 0){ if($sl -match '(?i)\bflash\b' -or $sl -match '✓' -or $sl -match '(^|[^0-9])t($|[^a-z])'){ $t=1; if($at -eq 0){$at=1} } }
  if($z -eq 0){ if($sl -match '(^|[^0-9])z($|[^a-z])'){ $z=1; if($az -eq 0){$az=1} } }
  if($InferZoneOnTop -and $t -ge 1 -and $z -lt 1){ $z=1; if($az -lt 1){ $az=[Math]::Max(1,$at) } }
  [pscustomobject]@{T=$t;Z=$z;AT=$at;AZ=$az;ShowZone=(-not ($t -ge 1) -and $z -ge 1);ShowTop=($t -ge 1)}
}

function Parse-FinalsTabRaw {
  param($rows,[ValidateSet('Men','Women')]$gender)
  if(-not $rows -or $rows.Count -eq 0){ return @() }
  $colRank="Qualifiers Rank"; $colName=$gender
  $colB1="Boulder 1"; $colB2="Boulder 2"; $colB3="Boulder 3"; $colB4="Boulder 4"
  $list = New-Object System.Collections.Generic.List[object]
  foreach($r in $rows){
    $name=Normalize $r.$colName; $rankT=Normalize $r.$colRank
    if([string]::IsNullOrWhiteSpace($name) -and [string]::IsNullOrWhiteSpace($rankT)){ continue }
    $rank=$null; $m=[regex]::Match($rankT,'^\s*(\d+)'); if($m.Success){ $rank=[int]$m.Groups[1].Value }
    $p1=Parse-CellScore $r.$colB1; $p2=Parse-CellScore $r.$colB2; $p3=Parse-CellScore $r.$colB3; $p4=Parse-CellScore $r.$colB4
    $row=[pscustomobject]@{
      Id="$gender|$rank|$name"
      Q=$rank; Climber=$name
      B1=(Normalize $r.$colB1); B2=(Normalize $r.$colB2); B3=(Normalize $r.$colB3); B4=(Normalize $r.$colB4)
      Tops=($p1.T+$p2.T+$p3.T+$p4.T)
      Zones=($p1.Z+$p2.Z+$p3.Z+$p4.Z)
      AttT=($p1.AT+$p2.AT+$p3.AT+$p4.AT)
      AttZ=($p1.AZ+$p2.AZ+$p3.AZ+$p4.AZ)
      B1ShowZone=$p1.ShowZone; B1ShowTop=$p1.ShowTop
      B2ShowZone=$p2.ShowZone; B2ShowTop=$p2.ShowTop
      B3ShowZone=$p3.ShowZone; B3ShowTop=$p3.ShowTop
      B4ShowZone=$p4.ShowZone; B4ShowTop=$p4.ShowTop
    }
    $list.Add($row)
  }
  $final6 = if(($list | Where-Object { $_.Q -ne $null }).Count -ge 6){
    $list | Where-Object { $_.Q -ne $null } | Sort-Object Q | Select-Object -First 6
  } else {
    $list | Where-Object { -not [string]::IsNullOrWhiteSpace($_.Climber) } | Select-Object -First 6
  }
  $final6
}

# ---------- Overrides & smoothing ----------
$script:Overrides=@{}
function Apply-Overrides([string]$gender,[System.Collections.IEnumerable]$rows){
  foreach($r in $rows){
    $k=$r.Id
    if($null -ne $k -and $script:Overrides.ContainsKey($k)){
      $ov=$script:Overrides[$k]
      foreach($b in 'B1','B2','B3','B4'){ if($ov.ContainsKey($b)){ $r.$b = Normalize $ov[$b] } }
    }
  }
}

$script:CellState=@{}
function Get-CellKey([string]$rowId,[string]$b){ "$rowId|$b" }
function Stabilize-Cells($gender,[System.Collections.IEnumerable]$rows){
  $now=[DateTime]::UtcNow
  foreach($r in $rows){
    foreach($b in 'B1','B2','B3','B4'){
      $key=Get-CellKey $r.Id $b
      $incoming=$r.$b
      if(-not $script:CellState.ContainsKey($key)){
        $ts = $null; if(-not [string]::IsNullOrWhiteSpace($incoming)){ $ts = $now }
        $script:CellState[$key] = @{ last=$incoming; seen=1; display=$incoming; tsLastNonBlank=$ts }
        continue
      }
      $st=$script:CellState[$key]
      if(-not [string]::IsNullOrWhiteSpace($incoming)){ $st.tsLastNonBlank=$now }
      $isTransientBlank = [string]::IsNullOrWhiteSpace($incoming) -and $st.tsLastNonBlank -ne $null -and ($now - $st.tsLastNonBlank).TotalMilliseconds -lt $BlankHoldMilliseconds
      if($isTransientBlank){ $incoming=$st.display }
      if($incoming -eq $st.last){ $st.seen++ } else { $st.last=$incoming; $st.seen=1 }
      if($st.seen -ge $RequireRepeatPerCell){ $st.display=$incoming }
      $r.$b=$st.display
    }
  }
}

function Recompute-Aggregates([System.Collections.IEnumerable]$rows){
  foreach($r in $rows){
    $p1=Parse-CellScore $r.B1; $p2=Parse-CellScore $r.B2; $p3=Parse-CellScore $r.B3; $p4=Parse-CellScore $r.B4
    $r.Tops=$p1.T+$p2.T+$p3.T+$p4.T
    $r.Zones=$p1.Z+$p2.Z+$p3.Z+$p4.Z
    $r.AttT=$p1.AT+$p2.AT+$p3.AT+$p4.AT
    $r.AttZ=$p1.AZ+$p2.AZ+$p3.AZ+$p4.AZ
    $r.B1ShowZone=$p1.ShowZone; $r.B1ShowTop=$p1.ShowTop
    $r.B2ShowZone=$p2.ShowZone; $r.B2ShowTop=$p2.ShowTop
    $r.B3ShowZone=$p3.ShowZone; $r.B3ShowTop=$p3.ShowTop
    $r.B4ShowZone=$p4.ShowZone; $r.B4ShowTop=$p4.ShowTop
  }
}

function Rank-Standings($rows){
  $rows | Sort-Object `
    @{Expression={$_.Tops};Descending=$true},`
    @{Expression={$_.Zones};Descending=$true},`
    @{Expression={$_.AttT};Descending=$false},`
    @{Expression={$_.AttZ};Descending=$false},`
    @{Expression={$_.Q};Descending=$false} |
  ForEach-Object -Begin {$place=0;$prev=$null} -Process {
    if(-not $prev -or $_.Tops -ne $prev.Tops -or $_.Zones -ne $prev.Zones -or $_.AttT -ne $prev.AttT -or $_.AttZ -ne $prev.AttZ -or $_.Q -ne $prev.Q){ $place++ }
    $_ | Add-Member -Force -NotePropertyName Place -NotePropertyValue $place
    $prev=$_; $_
  }
}

function Build-Snapshot($rows){
  ($rows | ForEach-Object { "{0}|{1}|{2}|{3}|{4}|{5}|{6}|{7}|{8}|{9}" -f ($_.Place),$_.Climber,$_.B1,$_.B2,$_.B3,$_.B4,$_.Tops,$_.Zones,$_.AttT,$_.AttZ }) -join "`n"
}

# ---------- State ----------
$script:LastSnap       = ""
$script:_running       = $false
$script:ManualPaused   = $false
$script:EditingPaused  = $false

# ---------- Compute + Paint ----------
function Compute-Views {
  if ($UseManualFinalists) {
    $menRaw   = $script:ManualMen
    $womenRaw = $script:ManualWomen
  } else {
    $mCsv = if(-not $script:ManualPaused){ Get-ExportCsv -id $SpreadsheetId -gid $MenGid   -cacheName "men.csv" } else { Import-Csv (Join-Path $CacheRoot "men.csv") -ErrorAction SilentlyContinue }
    $wCsv = if(-not $script:ManualPaused){ Get-ExportCsv -id $SpreadsheetId -gid $WomenGid -cacheName "women.csv" } else { Import-Csv (Join-Path $CacheRoot "women.csv") -ErrorAction SilentlyContinue }
    $menRaw   = Parse-FinalsTabRaw -rows $mCsv -gender Men
    $womenRaw = Parse-FinalsTabRaw -rows $wCsv -gender Women
  }
  Apply-Overrides "Men" $menRaw
  Apply-Overrides "Women" $womenRaw
  Stabilize-Cells "Men" $menRaw
  Stabilize-Cells "Women" $womenRaw
  Recompute-Aggregates $menRaw
  Recompute-Aggregates $womenRaw
  $menView   = Rank-Standings $menRaw
  $womenView = Rank-Standings $womenRaw
  $snap = (Build-Snapshot $womenView) + "`n---`n" + (Build-Snapshot $menView)
  @{ Men=$menView; Women=$womenView; Snap=$snap }
}

function Set-Footer([string]$t){ $FooterText.Text = $t }

function Refresh-Once {
  if ($script:_running) { return }
  $script:_running = $true
  try {
    $res  = Compute-Views
    $snap = $res.Snap
    if ($snap -ne $script:LastSnap) {
      $GridLeft.ItemsSource  = $res.Women
      $GridRight.ItemsSource = $res.Men
      $GridLeft.Items.Refresh(); $GridRight.Items.Refresh()
      $script:LastSnap = $snap
    }
    $pausedNow = ($script:ManualPaused -or $script:EditingPaused)
    Set-Footer ("updated {0}  |  Poll:{1}s  |  Paused:{2}  |  Overrides:{3}  |  Manual:{4}" -f (Get-Date -Format 'h:mm:ss tt'), $PollSeconds, $pausedNow, $script:Overrides.Count, $UseManualFinalists)
  } catch {
    Set-Footer "error $(Get-Date -Format 'h:mm:ss tt')"
  } finally {
    $GridLeft.UnselectAllCells();  $GridRight.UnselectAllCells()
    [System.Windows.Input.Keyboard]::ClearFocus()
    $script:_running = $false
  }
}

# ---------- XAML ----------
[xml]$xaml=@"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Background="#111" WindowStartupLocation="CenterScreen"
        ResizeMode="CanResize" Title="Battle of Brawn — Finals">
  <Window.Resources>
    <BooleanToVisibilityConverter x:Key="bconv"/>
    <Style x:Key="BoldCell" TargetType="TextBlock">
      <Setter Property="FontWeight" Value="Bold"/>
    </Style>
  </Window.Resources>

  <!-- Root container gets a render transform for Tilt -->
  <Grid x:Name="RootGrid" Margin="0">
    <Grid.RenderTransform>
      <TransformGroup>
        <SkewTransform x:Name="TiltSkew" AngleX="0" AngleY="0"/>
      </TransformGroup>
    </Grid.RenderTransform>

    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/>
      <RowDefinition Height="*"/>
      <RowDefinition Height="Auto"/>
    </Grid.RowDefinitions>

    <TextBlock x:Name="TitleText" Grid.Row="0" Text="Battle of Brawn — Finals"
               FontSize="46" FontWeight="Bold" HorizontalAlignment="Center" Margin="0,20,0,10"/>

    <!-- Credits small top-right -->
    <TextBlock x:Name="CreditsTopRight"
               Grid.Row="0"
               Text="by Ti"
               FontSize="14"
               Foreground="White"
               Opacity="0.75"
               HorizontalAlignment="Right"
               VerticalAlignment="Top"
               Margin="0,8,12,0"/>

    <Grid Grid.Row="1" Margin="24">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="24"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <!-- LEFT : WOMEN -->
      <Border Grid.Column="0" CornerRadius="16" Padding="16">
        <DockPanel>
          <TextBlock x:Name="LeftHeader" DockPanel.Dock="Top" FontSize="28" FontWeight="Bold" Margin="0,0,0,10"/>
          <DataGrid x:Name="GridLeft" AutoGenerateColumns="False" HeadersVisibility="Column"
                    CanUserAddRows="False" FontSize="22" RowHeight="42"
                    GridLinesVisibility="None" CanUserResizeColumns="True"
                    ScrollViewer.HorizontalScrollBarVisibility="Disabled"
                    IsReadOnly="False">
            <DataGrid.Columns>
              <DataGridTextColumn Header="#" Binding="{Binding Place}" Width="50" IsReadOnly="True"/>
              <DataGridTextColumn Header="Climber"
                                  Binding="{Binding Climber, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"
                                  Width="*" IsReadOnly="False" MinWidth="10"/>

              <DataGridTemplateColumn Header="B1" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16">
                      <Border Background="#333" CornerRadius="2"/>
                      <Rectangle Fill="Yellow" Visibility="{Binding B1ShowTop, Converter={StaticResource bconv}}"/>
                      <Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B1ShowZone, Converter={StaticResource bconv}}"/>
                    </Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B1, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B2" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16">
                      <Border Background="#333" CornerRadius="2"/>
                      <Rectangle Fill="Yellow" Visibility="{Binding B2ShowTop, Converter={StaticResource bconv}}"/>
                      <Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B2ShowZone, Converter={StaticResource bconv}}"/>
                    </Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B2, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B3" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16">
                      <Border Background="#333" CornerRadius="2"/>
                      <Rectangle Fill="Yellow" Visibility="{Binding B3ShowTop, Converter={StaticResource bconv}}"/>
                      <Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B3ShowZone, Converter={StaticResource bconv}}"/>
                    </Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B3, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B4" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16">
                      <Border Background="#333" CornerRadius="2"/>
                      <Rectangle Fill="Yellow" Visibility="{Binding B4ShowTop, Converter={StaticResource bconv}}"/>
                      <Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B4ShowZone, Converter={StaticResource bconv}}"/>
                    </Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B4, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTextColumn Header="Tops"  Binding="{Binding Tops}"  Width="60" IsReadOnly="True" ElementStyle="{StaticResource BoldCell}"/>
              <DataGridTextColumn Header="Zones" Binding="{Binding Zones}" Width="70" IsReadOnly="True" ElementStyle="{StaticResource BoldCell}"/>
              <DataGridTextColumn Header="AttT"  Binding="{Binding AttT}"  Width="60" IsReadOnly="True"/>
              <DataGridTextColumn Header="AttZ"  Binding="{Binding AttZ}"  Width="60" IsReadOnly="True"/>

              <DataGridTextColumn Header="Q"
                                  Binding="{Binding Q, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"
                                  Width="40" IsReadOnly="False"/>
            </DataGrid.Columns>
          </DataGrid>
        </DockPanel>
      </Border>

      <!-- RIGHT : MEN -->
      <Border Grid.Column="2" CornerRadius="16" Padding="16">
        <DockPanel>
          <TextBlock x:Name="RightHeader" DockPanel.Dock="Top" FontSize="28" FontWeight="Bold" Margin="0,0,0,10"/>
          <DataGrid x:Name="GridRight" AutoGenerateColumns="False" HeadersVisibility="Column"
                    CanUserAddRows="False" FontSize="22" RowHeight="42"
                    GridLinesVisibility="None" CanUserResizeColumns="True"
                    ScrollViewer.HorizontalScrollBarVisibility="Disabled"
                    IsReadOnly="False">
            <DataGrid.Columns>
              <DataGridTextColumn Header="#" Binding="{Binding Place}" Width="50" IsReadOnly="True"/>
              <DataGridTextColumn Header="Climber"
                                  Binding="{Binding Climber, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"
                                  Width="*" IsReadOnly="False" MinWidth="10"/>

              <DataGridTemplateColumn Header="B1" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16"><Border Background="#333" CornerRadius="2"/><Rectangle Fill="Yellow" Visibility="{Binding B1ShowTop, Converter={StaticResource bconv}}"/><Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B1ShowZone, Converter={StaticResource bconv}}"/></Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B1, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B2" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16"><Border Background="#333" CornerRadius="2"/><Rectangle Fill="Yellow" Visibility="{Binding B2ShowTop, Converter={StaticResource bconv}}"/><Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B2ShowZone, Converter={StaticResource bconv}}"/></Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B2, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B3" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16"><Border Background="#333" CornerRadius="2"/><Rectangle Fill="Yellow" Visibility="{Binding B3ShowTop, Converter={StaticResource bconv}}"/><Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B3ShowZone, Converter={StaticResource bconv}}"/></Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B3, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTemplateColumn Header="B4" Width="40">
                <DataGridTemplateColumn.CellTemplate>
                  <DataTemplate>
                    <Grid Width="28" Height="16"><Border Background="#333" CornerRadius="2"/><Rectangle Fill="Yellow" Visibility="{Binding B4ShowTop, Converter={StaticResource bconv}}"/><Rectangle Fill="Yellow" Height="8" VerticalAlignment="Bottom" Visibility="{Binding B4ShowZone, Converter={StaticResource bconv}}"/></Grid>
                  </DataTemplate>
                </DataGridTemplateColumn.CellTemplate>
                <DataGridTemplateColumn.CellEditingTemplate><DataTemplate><TextBox Text="{Binding B4, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/></DataTemplate></DataGridTemplateColumn.CellEditingTemplate>
              </DataGridTemplateColumn>

              <DataGridTextColumn Header="Tops"  Binding="{Binding Tops}"  Width="60" IsReadOnly="True" ElementStyle="{StaticResource BoldCell}"/>
              <DataGridTextColumn Header="Zones" Binding="{Binding Zones}" Width="70" IsReadOnly="True" ElementStyle="{StaticResource BoldCell}"/>
              <DataGridTextColumn Header="AttT"  Binding="{Binding AttT}"  Width="60" IsReadOnly="True"/>
              <DataGridTextColumn Header="AttZ"  Binding="{Binding AttZ}"  Width="60" IsReadOnly="True"/>
              <DataGridTextColumn Header="Q" Binding="{Binding Q, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}" Width="40" IsReadOnly="False"/>
            </DataGrid.Columns>
          </DataGrid>
        </DockPanel>
      </Border>
    </Grid>

    <!-- FOOTER (Grid prevents overlap with clock) -->
    <Grid Grid.Row="2" Margin="24,0,24,18">
      <Grid.ColumnDefinitions>
        <ColumnDefinition Width="Auto"/>
        <ColumnDefinition Width="*"/>
      </Grid.ColumnDefinitions>

      <WrapPanel Grid.Column="0" Orientation="Horizontal" HorizontalAlignment="Left">
        <Button x:Name="BtnPause" Content="Pause" Margin="0,0,8,0" Padding="10,4"/>
        <Button x:Name="BtnReset" Content="Reset Overrides" Margin="0,0,8,0" Padding="10,4"/>
        <Button x:Name="BtnBlack" Content="Blackout" Margin="0,0,8,0" Padding="10,4"/>

        <TextBlock Text="Climber width (px)" Foreground="White" Margin="16,0,6,0" VerticalAlignment="Center"/>
        <Slider x:Name="SldClimberWidth" Minimum="20" Maximum="500" Value="140" Width="160"/>

        <TextBlock Text="Title offset" Foreground="White" Margin="16,0,6,0" VerticalAlignment="Center"/>
        <Slider x:Name="SldTitleY" Minimum="0" Maximum="300" Value="20" Width="130"/>

        <TextBlock Text="Tilt" Foreground="White" Margin="16,0,6,0" VerticalAlignment="Center"/>
        <Slider x:Name="SldTilt" Minimum="-10" Maximum="10" Value="0" Width="130"/>
      </WrapPanel>

      <TextBlock x:Name="FooterText" Grid.Column="1" HorizontalAlignment="Right" FontSize="18" />
    </Grid>

    <!-- FULLSCREEN BLACKOUT OVERLAY (Top-Right Exit only) -->
    <Border x:Name="BlackoutOverlay"
            Grid.RowSpan="3"
            Background="Black"
            Opacity="1"
            Visibility="Collapsed"
            Panel.ZIndex="9999">
      <Grid>
        <!-- Small TOP-RIGHT “Esc to Exit” ONLY -->
        <Button x:Name="BtnExitBlackoutTopRight"
                Content="Esc to Exit"
                Padding="10,4"
                HorizontalAlignment="Right"
                VerticalAlignment="Top"
                Margin="0,8,8,0"/>
      </Grid>
    </Border>
  </Grid>
</Window>
"@

$reader = New-Object System.Xml.XmlNodeReader $xaml
$w      = [Windows.Markup.XamlReader]::Load($reader)

# Controls
$TitleText       = $w.FindName("TitleText")
$CreditsTopRight = $w.FindName("CreditsTopRight")
$LeftHeader      = $w.FindName("LeftHeader")
$RightHeader     = $w.FindName("RightHeader")
$GridLeft        = $w.FindName("GridLeft")
$GridRight       = $w.FindName("GridRight")
$FooterText      = $w.FindName("FooterText")
$BtnPause        = $w.FindName("BtnPause")
$BtnReset        = $w.FindName("BtnReset")
$BtnBlack        = $w.FindName("BtnBlack")
$SldClimber      = $w.FindName("SldClimberWidth")
$SldTitleY       = $w.FindName("SldTitleY")
$SldTilt         = $w.FindName("SldTilt")
$BlackoutOverlay = $w.FindName("BlackoutOverlay")
$BtnExitBlackoutTopRight= $w.FindName("BtnExitBlackoutTopRight")
$TiltSkew        = $w.FindName("TiltSkew")

# Theme wiring
$w.Background=$BgBrush
foreach($g in @($GridLeft,$GridRight)){
  $g.Background=$CardBrush; $g.Foreground=$TextBrush
  $g.RowBackground=$CardBrush
  $g.GridLinesVisibility="None"
  $g.HorizontalGridLinesBrush=$CardBrush
  $g.VerticalGridLinesBrush=$CardBrush
  $g.BorderBrush=$CardBrush
  $g.SelectionBrush = [Windows.Media.Brushes]::Transparent
}
$TitleText.Foreground=$TextBrush; $LeftHeader.Foreground=$TextBrush
$RightHeader.Foreground=$TextBrush; $FooterText.Foreground=$TextBrush
$hdrStyle = New-Object System.Windows.Style([System.Windows.Controls.Primitives.DataGridColumnHeader])
$hdrStyle.Setters.Add((New-Object System.Windows.Setter([System.Windows.Controls.Control]::BackgroundProperty,$AccentBrush)))
$hdrStyle.Setters.Add((New-Object System.Windows.Setter([System.Windows.Controls.Control]::ForegroundProperty,$TextBrush)))
$hdrStyle.Setters.Add((New-Object System.Windows.Setter([System.Windows.Controls.Control]::FontWeightProperty,[Windows.FontWeights]::Bold)))
$GridLeft.ColumnHeaderStyle=$hdrStyle; $GridRight.ColumnHeaderStyle=$hdrStyle

$TitleText.Text="Battle of Brawn — Finals"
if ($CreditsTopRight) { $CreditsTopRight.Text = $CreditsText }
$LeftHeader.Text="Women — Standings"
$RightHeader.Text="Men — Standings"

if ($Windowed) { $w.WindowStyle='SingleBorderWindow'; $w.WindowState='Normal'; $w.Width=1280; $w.Height=720 } else { $w.WindowStyle='None'; $w.WindowState='Maximized' }
function Set-Footer([string]$t){ $FooterText.Text = $t }

# ---------- Buttons / Overlay / Keys ----------
$BtnPause.Add_Click({
  $script:ManualPaused = -not $script:ManualPaused
  $BtnPause.Content = if($script:ManualPaused){"Resume"}else{"Pause"}
  $script:LastSnap=""; Refresh-Once
})
$BtnReset.Add_Click({ $script:Overrides=@{}; $script:LastSnap=""; Refresh-Once })

$BtnBlack.Add_Click({
  $BlackoutOverlay.Visibility = if ($BlackoutOverlay.Visibility -eq 'Visible') {'Collapsed'} else {'Visible'}
})
$BtnExitBlackoutTopRight.Add_Click({ $BlackoutOverlay.Visibility = 'Collapsed' })
$BlackoutOverlay.Add_MouseLeftButtonDown({ $BlackoutOverlay.Visibility = 'Collapsed' })

$w.Add_KeyDown({
  if ($_.Key -eq 'B') {
    $BlackoutOverlay.Visibility = if ($BlackoutOverlay.Visibility -eq 'Visible') {'Collapsed'} else {'Visible'}
  } elseif ($_.Key -eq 'Escape') {
    if ($BlackoutOverlay.Visibility -eq 'Visible') { $BlackoutOverlay.Visibility = 'Collapsed' }
  }
})

# ---------- Sliders ----------
function Set-ClimberPixelWidth($grid, $px) {
  if ($grid.Columns.Count -ge 2) {
    $grid.Columns[1].Width    = New-Object System.Windows.Controls.DataGridLength([double]$px)
    $grid.Columns[1].MinWidth = 10
  }
}
Set-ClimberPixelWidth $GridLeft  $SldClimber.Value
Set-ClimberPixelWidth $GridRight $SldClimber.Value
$SldClimber.Add_ValueChanged({
  $px = [double]$SldClimber.Value
  Set-ClimberPixelWidth $GridLeft  $px
  Set-ClimberPixelWidth $GridRight $px
})
$SldTitleY.Add_ValueChanged({
  $m = $TitleText.Margin
  $TitleText.Margin = New-Object Windows.Thickness($m.Left, $SldTitleY.Value, $m.Right, $m.Bottom)
})
if ($TiltSkew) {
  $TiltSkew.AngleY = [double]$SldTilt.Value
  $SldTilt.Add_ValueChanged({ $TiltSkew.AngleY = [double]$SldTilt.Value })
}

# ---------- Editing: pacing & commits ----------
$editResumeTimer = New-Object System.Windows.Threading.DispatcherTimer
$editResumeTimer.Interval = [TimeSpan]::FromMilliseconds(600)
$editResumeTimer.Add_Tick({
  $editResumeTimer.Stop()
  $script:EditingPaused = $false
  $script:LastSnap = ''
  Refresh-Once
})

foreach ($dg in @($GridLeft, $GridRight)) {
  $dg.Add_BeginningEdit({ $script:EditingPaused = $true })
  $dg.Add_CellEditEnding({
    $editResumeTimer.Stop()
    $editResumeTimer.Start()
  })
}

function Save-CellToOverrides {
  param($gender, $e)
  $hdr = [string]$e.Column.Header
  if (@('B1','B2','B3','B4') -notcontains $hdr) { return }
  $row = $e.Row.Item
  if ($null -eq $row) { return }
  $val = ""
  try { $val = [string]($row.($hdr)) } catch { $val = "" }
  $key = $row.Id
  if ($null -eq $key) { return }
  if (-not $script:Overrides.ContainsKey($key)) { $script:Overrides[$key] = @{} }
  $script:Overrides[$key][$hdr] = $val
  $script:LastSnap = ''
  Refresh-Once
  $GridLeft.UnselectAllCells();  $GridRight.UnselectAllCells()
  [System.Windows.Input.Keyboard]::ClearFocus()
}
$GridLeft.Add_CellEditEnding({ Save-CellToOverrides "Women" $_ })
$GridRight.Add_CellEditEnding({ Save-CellToOverrides "Men"   $_ })

foreach ($dg in @($GridLeft, $GridRight)) {
  $dg.Add_CellEditEnding({
    if ($UseManualFinalists) {
      $hdr = [string]$_.Column.Header
      if (@('Climber','Q') -contains $hdr) {
        $script:LastSnap = ''
        Refresh-Once
        $GridLeft.UnselectAllCells();  $GridRight.UnselectAllCells()
        [System.Windows.Input.Keyboard]::ClearFocus()
      }
    }
  })
  $dg.Add_PreviewKeyDown({
    if ($_.Key -eq 'Enter') {
      $g = $_.Source
      $g.CommitEdit([System.Windows.Controls.DataGridEditingUnit]::Cell, $true) | Out-Null
      $g.CommitEdit([System.Windows.Controls.DataGridEditingUnit]::Row,  $true) | Out-Null
      $GridLeft.UnselectAllCells();  $GridRight.UnselectAllCells()
      [System.Windows.Input.Keyboard]::ClearFocus()
    }
  })
}

# ---------- Timers ----------
$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromSeconds($PollSeconds)
$timer.Add_Tick({ if (-not ($script:ManualPaused -or $script:EditingPaused)) { Refresh-Once } })
$timer.Start()

$clock = New-Object System.Windows.Threading.DispatcherTimer
$clock.Interval = [TimeSpan]::FromSeconds(1)
$clock.Add_Tick({
  $pausedNow = ($script:ManualPaused -or $script:EditingPaused)
  Set-Footer ("updated {0}  |  Poll:{1}s  |  Paused:{2}  |  Overrides:{3}  |  Manual:{4}" -f (Get-Date -Format 'h:mm:ss tt'), $PollSeconds, $pausedNow, $script:Overrides.Count, $UseManualFinalists)
})
$clock.Start()

# ---------- First paint ----------
if ($Windowed) { $w.Width=1280; $w.Height=720 }
Refresh-Once
$w.Topmost=$true
[void]$w.ShowDialog()