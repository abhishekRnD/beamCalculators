export const coreTypes = [
  { value: 'ferrite-gapped', label: 'Ferrite · discrete air gap' },
  { value: 'ferrite-ungapped', label: 'Ferrite · ungapped' },
  { value: 'powder-core', label: 'Powder core · distributed gap' },
  { value: 'custom-al', label: 'Custom core · datasheet Aₗ' },
]

export const inductorDefaults = {
  inductance: '', inductanceUnit: 'uH', coreType: 'ferrite-gapped',
  effectiveAreaMm2: '', magneticPathMm: '', windowAreaMm2: '', meanTurnLengthMm: '',
  windingWidthMm: '', windingHeightMm: '', relativePermeability: '', alValueNH: '',
  saturationFluxT: '', targetFluxT: '', frequencyHz: '', rmsCurrentA: '', peakCurrentA: '',
  currentDensityAmm2: '4', fillLimit: '0.35', insulationFactor: '1.1',
  leadAllowanceMm: '100', lengthAllowancePct: '10',
  ambientTempC: '25', thermalResistanceCPerW: '', maxWindingTempC: '',
}

const MU0 = 4 * Math.PI * 1e-7
const COPPER_RESISTIVITY_20C = 1.724e-8
const numeric = (value) => value === '' || value == null ? NaN : Number(value)
const positive = (value) => Number.isFinite(value) && value > 0

export function awgDimensions(awg) {
  const diameterMm = 0.127 * 92 ** ((36 - awg) / 39)
  return { awg, diameterMm, areaMm2: Math.PI * diameterMm ** 2 / 4 }
}

export function calculateInductorDesign(input) {
  const errors = []
  const Lvalue = numeric(input.inductance)
  const L = Lvalue * (input.inductanceUnit === 'mH' ? 1e-3 : 1e-6)
  const AeMm2 = numeric(input.effectiveAreaMm2)
  const leMm = numeric(input.magneticPathMm)
  const windowMm2 = numeric(input.windowAreaMm2)
  const mltMm = numeric(input.meanTurnLengthMm)
  const widthMm = numeric(input.windingWidthMm)
  const heightMm = numeric(input.windingHeightMm)
  const muR = numeric(input.relativePermeability)
  const alNH = numeric(input.alValueNH)
  const Bsat = numeric(input.saturationFluxT)
  const Btarget = numeric(input.targetFluxT)
  const frequency = numeric(input.frequencyHz)
  const Irms = numeric(input.rmsCurrentA)
  const Ipeak = numeric(input.peakCurrentA)
  const currentDensity = numeric(input.currentDensityAmm2)
  const fillLimit = numeric(input.fillLimit)
  const insulationFactor = numeric(input.insulationFactor)
  const leadAllowance = numeric(input.leadAllowanceMm)
  const lengthAllowance = numeric(input.lengthAllowancePct)

  if (!positive(Lvalue)) errors.push('Enter a positive target inductance.')
  if (!['uH', 'mH'].includes(input.inductanceUnit)) errors.push('Choose µH or mH for inductance.')
  for (const [value, label] of [[AeMm2, 'Effective core area'], [leMm, 'Magnetic path length'], [windowMm2, 'Available winding window area'], [mltMm, 'Mean length per turn'], [widthMm, 'Usable winding width'], [heightMm, 'Usable winding height'], [frequency, 'Operating frequency'], [Irms, 'RMS current'], [Ipeak, 'Peak current'], [currentDensity, 'Copper current-density assumption'], [insulationFactor, 'Insulation diameter factor']]) {
    if (!positive(value)) errors.push(`${label} must be greater than zero.`)
  }
  if (Number.isFinite(Ipeak) && Number.isFinite(Irms) && Ipeak < Irms) errors.push('Peak current must be at least the RMS current.')
  if (!positive(fillLimit) || fillLimit > 1) errors.push('Fill-factor limit must be greater than 0 and no more than 1.')
  if (!Number.isFinite(leadAllowance) || leadAllowance < 0) errors.push('Lead allowance cannot be negative.')
  if (!Number.isFinite(lengthAllowance) || lengthAllowance < 0) errors.push('Wire length allowance cannot be negative.')
  if (Number.isFinite(muR) && muR <= 0) errors.push('Relative permeability must be positive or left blank.')
  if (Number.isFinite(alNH) && alNH <= 0) errors.push('AL must be positive or left blank.')
  if (Number.isFinite(Bsat) && Bsat <= 0) errors.push('Saturation flux density must be positive or left blank.')
  if (Number.isFinite(Btarget) && Btarget <= 0) errors.push('Target flux density must be positive or left blank.')
  if (input.coreType === 'ferrite-gapped') {
    if (!positive(muR)) errors.push('Enter the ferrite material’s initial relative permeability from its datasheet.')
    if (!positive(Btarget)) errors.push('Enter a target peak flux density for the gapped-core turn estimate.')
  } else if (input.coreType === 'ferrite-ungapped') {
    if (!positive(muR)) errors.push('Enter the core material’s relative permeability from its datasheet.')
  } else if (input.coreType === 'powder-core') {
    if (!positive(alNH) && !positive(muR)) errors.push('Enter a datasheet Aₗ value or effective permeability for this powder core.')
  } else if (input.coreType === 'custom-al') {
    if (!positive(alNH)) errors.push('Enter the core manufacturer’s Aₗ value.')
  } else errors.push('Choose a supported core type.')

  const thermalResistance = numeric(input.thermalResistanceCPerW)
  const ambient = numeric(input.ambientTempC)
  const maxWindingTemp = numeric(input.maxWindingTempC)
  if (Number.isFinite(thermalResistance) && thermalResistance <= 0) errors.push('Thermal resistance must be positive or left blank.')
  if (Number.isFinite(maxWindingTemp) && !Number.isFinite(thermalResistance)) errors.push('Enter winding thermal resistance to estimate winding temperature.')
  if (Number.isFinite(thermalResistance) && !Number.isFinite(maxWindingTemp)) errors.push('Enter an allowable winding temperature to compare against the estimate.')
  if (Number.isFinite(thermalResistance) && !Number.isFinite(ambient)) errors.push('Enter ambient temperature for the thermal estimate.')
  if (errors.length) return { errors, results: null, warnings: [] }

  const Ae = AeMm2 * 1e-6
  const le = leMm * 1e-3
  let turnsExact
  let turnsMethod
  let discreteGapM = null

  if (input.coreType === 'ferrite-gapped') {
    turnsExact = (L * Ipeak) / (Btarget * Ae)
    turnsMethod = 'Flux-limited, gap-dominant ferrite estimate: N ≥ L·Ipeak/(Btarget·Ae).'
  } else if (input.coreType === 'custom-al' || (input.coreType === 'powder-core' && positive(alNH))) {
    turnsExact = Math.sqrt(L / (alNH * 1e-9))
    turnsMethod = 'Datasheet inductance factor: L = Aₗ·N².'
  } else {
    turnsExact = Math.sqrt((L * le) / (MU0 * muR * Ae))
    turnsMethod = input.coreType === 'powder-core'
      ? 'Reluctance estimate using user-entered effective permeability; distributed-gap bias curves are not modeled.'
      : 'Ungapped magnetic-path estimate: L = μ0·μr·Ae·N²/le.'
  }
  if (!positive(turnsExact) || turnsExact > 1e7) return { errors: ['The supplied values produce an invalid or impractically large turn count. Recheck units and core data.'], results: null, warnings: [] }
  const turns = Math.ceil(turnsExact)
  const estimatedInductanceH = input.coreType === 'ferrite-gapped'
    ? L
    : (input.coreType === 'custom-al' || (input.coreType === 'powder-core' && positive(alNH)))
      ? turns ** 2 * alNH * 1e-9
      : (MU0 * muR * Ae * turns ** 2) / le

  if (input.coreType === 'ferrite-gapped') {
    discreteGapM = MU0 * Ae * turns ** 2 / L - le / muR
    if (!(discreteGapM > 0)) return { errors: ['The calculated gap is zero or negative. Review the entered permeability and dimensions, or choose an ungapped design model.'], results: null, warnings: [] }
  }

  const peakFluxT = (L * Ipeak) / (turns * Ae)
  const requiredCopperAreaMm2 = Irms / currentDensity
  const selectedGauge = Array.from({ length: 44 }, (_, index) => awgDimensions(40 - index)).find((gauge) => gauge.areaMm2 >= requiredCopperAreaMm2)
  if (!selectedGauge) return { errors: ['The requested current density requires a conductor larger than 4/0 AWG. Use parallel strands or enter a lower current-density assumption.'], results: null, warnings: [] }

  const coatedDiameterMm = selectedGauge.diameterMm * insulationFactor
  const turnsPerLayer = Math.floor(widthMm / coatedDiameterMm)
  if (turnsPerLayer < 1) return { errors: ['The selected wire does not fit across the usable winding width. Increase the width or choose a suitable conductor.'], results: null, warnings: [] }
  const layers = Math.ceil(turns / turnsPerLayer)
  const windingBuildMm = layers * coatedDiameterMm
  const wireCopperAreaM2 = selectedGauge.areaMm2 * 1e-6
  const wireLengthM = (turns * mltMm / 1000 + leadAllowance / 1000) * (1 + lengthAllowance / 100)
  const dcResistanceOhm = COPPER_RESISTIVITY_20C * wireLengthM / wireCopperAreaM2
  const copperLossW = Irms ** 2 * dcResistanceOhm
  const windingFill = turns * (Math.PI * (coatedDiameterMm / 2) ** 2) / windowMm2
  const skinDepthMm = Math.sqrt(COPPER_RESISTIVITY_20C / (Math.PI * frequency * MU0)) * 1000
  const estimatedWindingTempC = Number.isFinite(thermalResistance) ? ambient + copperLossW * thermalResistance : null
  const warnings = []

  if (!Number.isFinite(Bsat)) warnings.push('Core saturation cannot be checked: enter the manufacturer’s Bsat at the expected operating temperature. No saturation-safe claim is made.')
  else if (peakFluxT >= Bsat) warnings.push(`Estimated peak flux (${peakFluxT.toPrecision(3)} T) reaches or exceeds the entered Bsat (${Bsat.toPrecision(3)} T).`)
  else warnings.push(`Estimated peak flux is ${(peakFluxT / Bsat * 100).toFixed(1)}% of the entered Bsat. Verify the datasheet’s temperature and DC-bias curves; this estimate does not establish safety.`)
  if (windowMm2 > widthMm * heightMm * 1.01) warnings.push('Entered winding window area is larger than usable width multiplied by height; check the core drawing dimensions.')
  if (input.coreType === 'ferrite-ungapped') warnings.push('Ungapped ferrite permeability can fall under DC bias; verify the manufacturer inductance-versus-bias data.')
  if (windingFill > fillLimit) warnings.push(`Estimated winding fill ${(windingFill * 100).toFixed(1)}% exceeds your entered limit ${(fillLimit * 100).toFixed(1)}%.`)
  if (windingBuildMm > heightMm) warnings.push(`Estimated winding build (${windingBuildMm.toFixed(2)} mm) exceeds usable winding height (${heightMm.toFixed(2)} mm).`)
  if (selectedGauge.diameterMm > 2 * skinDepthMm) warnings.push(`Wire diameter (${selectedGauge.diameterMm.toFixed(3)} mm) exceeds twice the copper skin depth (${(2 * skinDepthMm).toFixed(3)} mm) at this frequency. AC and proximity losses are not included; consider a strand/Litz analysis.`)
  if (estimatedWindingTempC == null) warnings.push('Thermal rise cannot be estimated without a user-supplied winding thermal resistance and allowable winding temperature. Core loss and AC copper loss are not included.')
  else if (estimatedWindingTempC > maxWindingTemp) warnings.push(`Simplified winding estimate ${estimatedWindingTempC.toFixed(1)} °C is above your entered limit ${maxWindingTemp.toFixed(1)} °C. This excludes core and AC losses.`)
  else warnings.push(`Simplified winding estimate ${estimatedWindingTempC.toFixed(1)} °C is below your entered limit ${maxWindingTemp.toFixed(1)} °C; core and AC losses are excluded, so this is not a thermal safety validation.`)
  if (input.coreType === 'powder-core') warnings.push('Powder-core inductance under DC bias depends on the selected material’s bias curves; the entered Aₗ/effective permeability is an initial estimate only.')
  if (input.coreType === 'ferrite-gapped') warnings.push('Air-gap estimate assumes a uniform gap, negligible fringing, and a gap-dominated reluctance. Confirm with the core vendor and measure the finished inductance.')

  const airGapMm = discreteGapM == null ? null : discreteGapM * 1000
  const materials = [
    `Core set/bobbin matching the entered Ae, le, and window dimensions (${input.coreType.replaceAll('-', ' ')}).`,
    `${wireLengthM.toFixed(2)} m of copper magnet wire, AWG ${selectedGauge.awg} (${selectedGauge.diameterMm.toFixed(3)} mm bare; ${selectedGauge.areaMm2.toFixed(3)} mm² copper).`,
    `Layer insulation rated for the actual circuit voltage and temperature; estimated ${layers} winding layer(s).`,
    ...(airGapMm == null ? [] : [`Nonmagnetic gap spacer/shim near ${airGapMm.toFixed(3)} mm total, subject to core geometry, fringing, and measurement.`]),
  ]
  const steps = [
    'Confirm the exact core part number and datasheet values for Ae, le, window area, Aₗ/μr, Bsat versus temperature, and core-loss data.',
    `Prepare approximately ${wireLengthM.toFixed(2)} m of the selected wire, including the entered lead and length allowances.`,
    `Wind ${turns} turns in a consistent direction. Plan about ${turnsPerLayer} turns per layer across ${layers} layer(s); add insulation between layers as required by the winding specification.`,
    ...(airGapMm == null ? [] : [`Use the calculated ${airGapMm.toFixed(3)} mm gap only as a starting estimate; do not assume the assembled core gap equals the shim thickness without checking the core geometry.`]),
    'Measure inductance and DCR on the finished part; verify inductance under peak DC bias, temperature rise, insulation, and AC/core losses in the actual circuit before use.',
  ]

  return {
    errors,
    warnings,
    materials,
    steps,
    formulas: [turnsMethod, 'Bpeak ≈ L·Ipeak/(N·Ae); estimated gap g = μ0·Ae·N²/L − le/μr for the uniform-gap ferrite model.', 'AWG diameter: d(mm)=0.127·92^((36−AWG)/39). Wire area is selected from Irms/current density.', 'Length ≈ (N·MLT + lead allowance)·(1 + length allowance); R20=ρCu·length/area; Pcu=Irms²·R20.', 'Skin depth δ=sqrt(ρCu/(π·f·μ0)); turns/layer=floor(usable width/insulated diameter).'],
    results: {
      turns, estimatedInductanceUH: estimatedInductanceH * 1e6, gauge: `AWG ${selectedGauge.awg}`,
      bareWireDiameterMm: selectedGauge.diameterMm, copperAreaMm2: selectedGauge.areaMm2,
      wireLengthM, turnsPerLayer, layers, windingBuildMm,
      airGapMm, peakFluxT, saturationFluxT: Number.isFinite(Bsat) ? Bsat : null,
      dcResistanceOhm, copperLossW, windingFill, skinDepthMm, estimatedWindingTempC,
    },
    assumptions: [
      'All calculations use SI internally; core dimensions are supplied by the user and are not selected from an assumed core catalog.',
      'Copper resistivity is 1.724×10⁻⁸ Ω·m at 20 °C. Resistance and copper loss are DC estimates; temperature coefficient, skin effect, proximity effect, and core loss are not included in those values.',
      'The default 4 A/mm² current density, 35% window-fill limit, 1.10 insulation-diameter factor, 100 mm lead allowance, and 10% wire-length allowance are editable planning assumptions, not design standards or guarantees.',
      'A thermal estimate is shown only when the user supplies winding thermal resistance, ambient temperature, and allowable temperature. Core and AC losses remain excluded.',
    ],
  }
}
