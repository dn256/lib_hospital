$ErrorActionPreference = 'Stop'

$geneMap = [ordered]@{
  'AMACR'='AMACR'; 'ASMA'='ACTA2'; 'BAP1'='BAP1'; 'Bcl-2'='BCL2'; 'Bcl-6'='BCL6'; 'BRAF'='BRAF'; 'C-MYC'='MYC'; 'CA125'='MUC16'; 'CALRET'='CALB2'
  'CD10'='MME'; 'CD117'='KIT'; 'CD138'='SDC1'; 'CD14'='CD14'; 'CD15'='FUT4'; 'CD163'='CD163'; 'CD19'='CD19'; 'CD20'='MS4A1'; 'CD23'='FCER2'; 'CD3'='CD3D'
  'CD30'='TNFRSF8'; 'CD31'='PECAM1'; 'CD34'='CD34'; 'CD4'='CD4'; 'CD45'='PTPRC'; 'CD5'='CD5'; 'CD56'='NCAM1'; 'CD68'='CD68'; 'CD79a'='CD79A'; 'CD8'='CD8A'; 'CD99'='CD99'
  'CDX2'='CDX2'; 'CEA'='CEACAM5'; 'CGA'='CHGA'; 'CK19'='KRT19'; 'CK20'='KRT20'; 'CK5'='KRT5'; 'CK7'='KRT7'; 'CK8/18'='KRT8'; 'CLDN18.2'='CLDN18'; 'CLDN4'='CLDN4'
  'CyD1'='CCND1'; 'DES'='DES'; 'DOG1'='ANO1'; 'ECAD'='CDH1'; 'EMA'='MUC1'; 'EpCAM'='EPCAM'; 'ER'='ESR1'; 'ERG'='ERG'; 'FOLR1'='FOLR1'; 'FVIII'='F8'; 'GATA3'='GATA3'
  'GCDFP'='PIP'; 'GFAP'='GFAP'; 'GPC3'='GPC3'; 'HCG'='CGB3'; 'HEPA'='CPS1'; 'HER2 IHC'='ERBB2'; 'IgK'='IGKC'; 'IgL'='IGLC2'; 'IgM'='IGHM'; 'INSM1'='INSM1'; 'Ki67'='MKI67'
  'MAMGLO'='SCGB2A2'; 'MLA'='MLANA'; 'MLH1'='MLH1'; 'MSA'='PMEL'; 'MSH2'='MSH2'; 'MSH6'='MSH6'; 'MUM1'='IRF4'; 'Napsin A'='NAPSA'; 'NFP'='NEFL'; 'NKX3.1'='NKX3-1'
  'OCT3/4'='POU5F1'; 'p16'='CDKN2A'; 'p40'='TP63'; 'P501S'='SLC45A3'; 'p53'='TP53'; 'p57'='CDKN1C'; 'p63'='TP63'; 'PAP'='ACPP'; 'PAX2'='PAX2'; 'PAX5'='PAX5'; 'PAX8'='PAX8'
  'PD-L1 (IC)'='CD274'; 'PD-L1 (TPS/CPS)'='CD274'; 'PLAP'='ALPP'; 'PMS2'='PMS2'; 'Podop'='PDPN'; 'PR'='PGR'; 'PRAME'='PRAME'; 'PSA'='KLK3'; 'SALL4'='SALL4'; 'SATB2'='SATB2'
  'Smad4'='SMAD4'; 'SMH'='MYH11'; 'SOX10'='SOX10'; 'SOX11'='SOX11'; 'SYP'='SYP'; 'TdT'='DNTT'; 'TRPS1'='TRPS1'; 'TTF1'='NKX2-1'; 'URO II/III'='UPK2'; 'VIM'='VIM'; 'WT1'='WT1'
}

function Get-LevelRank([string]$level) {
  switch ($level.ToLowerInvariant()) {
    'high' { 3 }
    'medium' { 2 }
    'low' { 1 }
    default { 0 }
  }
}

function Get-Text($node) {
  if ($null -eq $node) { return '' }
  if ($node -is [System.Xml.XmlNode]) { return [string]$node.InnerText }
  return [string]$node
}

$records = [ordered]@{}

foreach ($pair in $geneMap.GetEnumerator()) {
  $marker = $pair.Key
  $gene = $pair.Value
  try {
    $searchUrl = "https://www.proteinatlas.org/search/$([uri]::EscapeDataString($gene))?format=json"
    $search = Invoke-RestMethod -Uri $searchUrl -UseBasicParsing
    $match = @($search | Where-Object { $_.Gene -eq $gene }) | Select-Object -First 1
    if (-not $match) { continue }

    $ensembl = [string]$match.Ensembl
    [xml]$xml = (Invoke-WebRequest -Uri "https://www.proteinatlas.org/$ensembl.xml" -UseBasicParsing).Content
    $expression = $xml.proteinAtlas.entry.tissueExpression | Where-Object { $_.technology -eq 'IHC' } | Select-Object -First 1
    if (-not $expression) { continue }

    $levels = @{}
    foreach ($datum in @($expression.data)) {
      $tissueName = Get-Text $datum.tissue
      $levelNode = @($datum.level | Where-Object { $_.type -eq 'expression' }) | Select-Object -First 1
      if ($tissueName -and $levelNode) { $levels[$tissueName] = (Get-Text $levelNode).ToLowerInvariant() }
    }

    $images = foreach ($image in @($expression.image | Where-Object { $_.imageType -eq 'selected' })) {
      $tissueName = Get-Text $image.tissue
      $imageUrl = Get-Text $image.imageUrl
      if ($tissueName -and $imageUrl -and $levels.ContainsKey($tissueName)) {
        [pscustomobject]@{ tissue=$tissueName; imageUrl=$imageUrl; level=$levels[$tissueName]; rank=(Get-LevelRank $levels[$tissueName]) }
      }
    }

    $positive = @($images | Where-Object { $_.rank -gt 0 } | Sort-Object rank -Descending) | Select-Object -First 1
    $negative = @($images | Where-Object { $_.rank -eq 0 }) | Select-Object -First 1
    if (-not $positive -or -not $negative) { continue }

    $sourceUrl = "https://www.proteinatlas.org/$ensembl-$gene/tissue"
    $records[$marker] = [ordered]@{
      note = "Ảnh mô bình thường từ Human Protein Atlas dùng để học vị trí và mức biểu hiện mô của $gene. Không dùng cặp ảnh này để chấm điểm u, xác nhận âm tính chẩn đoán hoặc thay thế ảnh của hệ thống xét nghiệm/clone chuyên biệt."
      positive = [ordered]@{
        label = "Có biểu hiện ($($positive.level))"
        tissue = $positive.tissue
        finding = "HPA ghi nhận mức biểu hiện $($positive.level) của $gene trong mô tham chiếu này."
        antibody = "HPA Tissue Atlas · $gene"
        imageUrl = $positive.imageUrl
        sourceUrl = $sourceUrl
        source = 'Human Protein Atlas'
        license = 'CC BY 4.0'
      }
      negative = [ordered]@{
        label = 'Không phát hiện'
        tissue = $negative.tissue
        finding = "HPA không phát hiện biểu hiện $gene trong mô tham chiếu này."
        antibody = "HPA Tissue Atlas · $gene"
        imageUrl = $negative.imageUrl
        sourceUrl = $sourceUrl
        source = 'Human Protein Atlas'
        license = 'CC BY 4.0'
      }
    }
  } catch {
    Write-Warning "$marker ($gene): $($_.Exception.Message)"
  }
}

$json = $records | ConvertTo-Json -Depth 8
$output = @"
// Generated from Human Protein Atlas Tissue Atlas by scripts/sync-hpa-marker-images.ps1.
// Images show normal-tissue expression and must not be used as diagnostic scoring references.

import type { IhcMarkerImagePair } from './ihcMarkerImages'

export const IHC_MARKER_HPA_IMAGES: Record<string, IhcMarkerImagePair> = $json
"@

$target = Join-Path $PSScriptRoot '..\utils\ihcMarkerHpaImages.ts'
[System.IO.File]::WriteAllText($target, $output, [System.Text.UTF8Encoding]::new($false))
Write-Host "Generated $($records.Count) HPA marker image pairs at $target"
