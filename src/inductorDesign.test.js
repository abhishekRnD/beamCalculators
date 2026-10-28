import test from 'node:test'
import assert from 'node:assert/strict'
import { awgDimensions, calculateInductorDesign, inductorDefaults } from './inductorDesign.js'

const ferriteFixture = (overrides = {}) => ({
  ...inductorDefaults,
  inductance: '100', inductanceUnit: 'uH', coreType: 'ferrite-gapped',
  effectiveAreaMm2: '100', magneticPathMm: '50', windowAreaMm2: '100', meanTurnLengthMm: '80',
  windingWidthMm: '20', windingHeightMm: '20', relativePermeability: '2000',
  targetFluxT: '0.15', frequencyHz: '20000', rmsCurrentA: '1', peakCurrentA: '2',
  ...overrides,
})

test('AWG relation returns standard 20 AWG bare diameter', () => {
  assert.ok(Math.abs(awgDimensions(20).diameterMm - 0.8128) < 1.1e-3)
})

test('gapped ferrite calculates turns, air gap, winding, and copper loss', () => {
  const { errors, results, warnings } = calculateInductorDesign(ferriteFixture())
  assert.deepEqual(errors, [])
  assert.equal(results.turns, 14)
  assert.ok(results.airGapMm > 0.2 && results.airGapMm < 0.23)
  assert.equal(results.gauge, 'AWG 23')
  assert.equal(results.turnsPerLayer, 31)
  assert.equal(results.layers, 1)
  assert.ok(results.wireLengthM > 1.3 && results.wireLengthM < 1.4)
  assert.ok(results.dcResistanceOhm > 0)
  assert.ok(results.copperLossW > 0)
  assert.ok(warnings.some((warning) => warning.includes('saturation cannot be checked')))
  assert.ok(warnings.some((warning) => warning.includes('Thermal rise cannot be estimated')))
})

test('mH input is converted to SI and powder core uses entered datasheet A_L', () => {
  const input = ferriteFixture({ inductance: '0.01', inductanceUnit: 'mH', coreType: 'powder-core', alValueNH: '100' })
  const { errors, results } = calculateInductorDesign(input)
  assert.deepEqual(errors, [])
  assert.equal(results.turns, 10)
  assert.ok(Math.abs(results.estimatedInductanceUH - 10) < 1e-9)
  assert.equal(results.airGapMm, null)
})

test('ungapped ferrite uses reluctance equation with supplied permeability', () => {
  const input = ferriteFixture({ coreType: 'ferrite-ungapped', inductance: '1', inductanceUnit: 'mH', relativePermeability: '2000' })
  const { errors, results } = calculateInductorDesign(input)
  assert.deepEqual(errors, [])
  assert.ok(results.turns > 0)
  assert.equal(results.airGapMm, null)
})

test('missing core data blocks calculations instead of guessing specifications', () => {
  const { errors, results } = calculateInductorDesign(inductorDefaults)
  assert.equal(results, null)
  assert.ok(errors.some((error) => error.includes('Effective core area')))
  assert.ok(errors.some((error) => error.includes('relative permeability')))
})

test('impossible gapped-core assumptions return a validation error', () => {
  const { errors, results } = calculateInductorDesign(ferriteFixture({ targetFluxT: '1' }))
  assert.equal(results, null)
  assert.ok(errors.some((error) => error.includes('gap is zero or negative')))
})

test('thermal estimate is only produced from supplied thermal resistance and limit', () => {
  const input = ferriteFixture({ saturationFluxT: '0.35', thermalResistanceCPerW: '10', maxWindingTempC: '80' })
  const { errors, results, warnings } = calculateInductorDesign(input)
  assert.deepEqual(errors, [])
  assert.ok(results.estimatedWindingTempC > 25)
  assert.ok(warnings.some((warning) => warning.includes('not a thermal safety validation')))
})

test('peak current below RMS current is rejected', () => {
  const { errors, results } = calculateInductorDesign(ferriteFixture({ rmsCurrentA: '3', peakCurrentA: '2' }))
  assert.equal(results, null)
  assert.ok(errors.includes('Peak current must be at least the RMS current.'))
})
