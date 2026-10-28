import { useMemo, useState } from 'react'
import { calculateInductorDesign, coreTypes, inductorDefaults } from './inductorDesign'

const electrical = [['frequencyHz', 'Operating frequency', 'Hz'], ['rmsCurrentA', 'RMS current', 'A'], ['peakCurrentA', 'Peak current', 'A']]
const dimensions = [['effectiveAreaMm2', 'Effective core area Ae', 'mmÂ²'], ['magneticPathMm', 'Magnetic path length le', 'mm'], ['windowAreaMm2', 'Available winding window area', 'mmÂ²'], ['meanTurnLengthMm', 'Mean length per turn (MLT)', 'mm'], ['windingWidthMm', 'Usable winding width', 'mm'], ['windingHeightMm', 'Usable winding height', 'mm']]
const assumptions = [['currentDensityAmm2', 'Copper current density', 'A/mmÂ²'], ['fillLimit', 'Maximum window fill factor', 'fraction'], ['insulationFactor', 'Insulated-to-bare diameter factor', 'Ã—'], ['leadAllowanceMm', 'Total lead allowance', 'mm'], ['lengthAllowancePct', 'Wire length allowance', '%']]
const fmt = (n, d = 4) => Number.isFinite(n) ? new Intl.NumberFormat('en-US', { maximumSignificantDigits: d }).format(n) : 'â€”'

function NumberField({ state, update, item, required = false, hint }) {
  const [name, label, unit] = item
  return <label className="inductor-field"><span>{label}{required && <i> *</i>}</span><span className="inductor-input-wrap"><input type="number" min="0" step="any" value={state[name]} onChange={(e) => update(name, e.target.value)} aria-label={label}/>{unit && <small>{unit}</small>}</span>{hint && <small className="field-hint">{hint}</small>}</label>
}
function Tile({ label, value, unit, strong = false }) { return <div className={strong ? 'inductor-result-tile emphasis' : 'inductor-result-tile'}><span>{label}</span><b>{value || '?'}{unit && <small> {unit}</small>}</b></div> }

export default function InductorDesignCalculator() {
  const [state, setState] = useState(inductorDefaults)
  const design = useMemo(() => calculateInductorDesign(state), [state])
  const update = (key, value) => setState((old) => ({ ...old, [key]: value }))
  const r = design.results
  const formulaNotes = design.formulas || ['Ferrite gap design: N ? L?Ipeak/(Btarget?Ae); g = ?0?Ae?N?/L ? le/?r.', 'Ungapped design: L = ?0xr?Ae?N?/le. A? design: L = AxN?.', 'Wire: AWG diameter relation; DCR = xlength/area; copper loss = IrmsxDCR.', 'Skin depth ? = sqrt(?/(xfx0)); turn layers use the entered bobbin width and wire insulation factor.']
  const assumptionNotes = design.assumptions || ['All calculations use SI internally and require user-supplied core data.', 'Copper resistivity uses 1.724?10x xm at 20?C; resistance/loss are DC estimates.', 'Planning defaults: 4 A/mm^2 current density, 35% fill, 1.10 insulation factor, 100 mm lead allowance, 10% wire length allowance.', 'Core losses, AC copper losses, fringing, temperature-dependent material curves, and actual construction tolerances are not modeled.']
  const rows = (list, required = true) => list.map((item) => <NumberField key={item[0]} state={state} update={update} item={item} required={required}/> )
  const heading = (n, title, note) => <div className="inductor-group-heading"><span>{n}</span><div><h3>{title}</h3><p>{note}</p></div></div>
  return <section className="inductor-section" id="inductor-design" aria-labelledby="inductor-title">
    <header className="inductor-section-heading"><div><div className="eyebrow section-eyebrow">INDUCTORS</div><h2 id="inductor-title">Inductor Design Calculator</h2><p>Estimate turns, winding fit, copper loss, and an air gap using your core datasheet and bobbin dimensions.</p></div><span className="inductor-section-badge">SI based | live results</span></header>
    <div className="inductor-layout">
      <div className="inductor-form-card"><div className="inductor-form-intro"><b>Enter data for the exact core and winding</b><span>Required values have an asterisk. Core specifications are never assumed.</span></div>
        <section className="inductor-form-group">{heading('01','Electrical target','Use operating values for the intended circuit.')}
          <div className="inductor-fields-grid"><label className="inductor-field"><span>Target inductance <i>*</i></span><span className="inductor-input-wrap"><input type="number" min="0" step="any" value={state.inductance} onChange={(e) => update('inductance',e.target.value)} aria-label="Target inductance"/><select value={state.inductanceUnit} onChange={(e) => update('inductanceUnit',e.target.value)} aria-label="Inductance unit"><option value="uH">ÂµH</option><option value="mH">mH</option></select></span></label>{rows(electrical)}</div>
        </section>
        <section className="inductor-form-group">{heading('02','Core type and dimensions','Copy dimensions and material properties from the manufacturer.')}
          <div className="inductor-fields-grid"><label className="inductor-field"><span>Core model <i>*</i></span><span className="inductor-input-wrap"><select value={state.coreType} onChange={(e) => update('coreType',e.target.value)} aria-label="Core type">{coreTypes.map((core) => <option key={core.value} value={core.value}>{core.label}</option>)}</select></span></label>{rows(dimensions)}
            {['ferrite-gapped','ferrite-ungapped'].includes(state.coreType) && <NumberField state={state} update={update} item={['relativePermeability','Datasheet relative permeability Î¼r','']} required/>}
            {['powder-core','custom-al'].includes(state.coreType) && <NumberField state={state} update={update} item={['alValueNH','Datasheet Aâ‚— value','nH/turnÂ²']} required={state.coreType === 'custom-al'} hint="Powder core: enter Aâ‚— or effective permeability."/>}
            {state.coreType === 'powder-core' && <NumberField state={state} update={update} item={['relativePermeability','Effective relative permeability (optional)','']}/>}
            <NumberField state={state} update={update} item={['saturationFluxT','Datasheet saturation flux density Bsat (optional)','T']} hint="Use the value for the expected operating temperature."/>
            {state.coreType === 'ferrite-gapped' && <NumberField state={state} update={update} item={['targetFluxT','Target peak flux density','T']} required hint="Choose from design limits and core data; no default is supplied."/>}
          </div>
        </section>
        <section className="inductor-form-group">{heading('03','Winding space and assumptions','Editable planning assumptions are called out in the formula notes.')}
          <div className="inductor-fields-grid">{rows(assumptions,false)}<NumberField state={state} update={update} item={['ambientTempC','Ambient temperature','Â°C']}/><NumberField state={state} update={update} item={['thermalResistanceCPerW','Winding thermal resistance','Â°C/W']} hint="Leave blank to report thermal verification unavailable."/><NumberField state={state} update={update} item={['maxWindingTempC','Allowable winding temperature','Â°C']} hint="Required when thermal resistance is entered."/></div>
        </section>
      </div>
      <aside className="inductor-output-card" aria-live="polite"><div className="inductor-output-header"><span className="result-check">âœ“</span><div><small>DESIGN ESTIMATE</small><h3>{r ? 'Calculated from your inputs' : 'Complete required inputs'}</h3></div></div>
        {!r ? <div className="inductor-validation"><b>Finish the required fields to calculate.</b><ul>{design.errors.slice(0,8).map((e) => <li key={e}>{e}</li>)}</ul></div> : <>
          <div className="inductor-result-grid"><Tile strong label="Required turns" value={fmt(r.turns,7)} unit="turns"/><Tile strong label="Recommended copper wire" value={r.gauge + ' Â· ' + fmt(r.bareWireDiameterMm) + ' mm'} unit="bare"/><Tile label="Estimated wire length" value={fmt(r.wireLengthM)} unit="m"/><Tile label="Turns per layer" value={fmt(r.turnsPerLayer,6)}/><Tile label="Number of layers" value={fmt(r.layers,5)}/><Tile label="Estimated air gap" value={r.airGapMm == null ? 'Not applicable' : fmt(r.airGapMm)} unit={r.airGapMm == null ? '' : 'mm total'}/><Tile label="DC resistance at 20Â°C" value={fmt(r.dcResistanceOhm*1000)} unit="mÎ©"/><Tile label="DC copper loss" value={fmt(r.copperLossW)} unit="W"/><Tile label="Peak flux estimate" value={fmt(r.peakFluxT,5)} unit="T"/><Tile label="Estimated window fill" value={fmt(r.windingFill*100)} unit="%"/><Tile label="Winding build" value={fmt(r.windingBuildMm)} unit="mm"/><Tile label="Copper skin depth" value={fmt(r.skinDepthMm)} unit="mm"/>{r.estimatedInductanceUH != null && <Tile label="Inductance from rounded turns" value={fmt(r.estimatedInductanceUH)} unit="ÂµH"/>}{r.estimatedWindingTempC != null && <Tile label="Simplified winding temperature" value={fmt(r.estimatedWindingTempC)} unit="Â°C"/>}</div>
          <div className="inductor-warning-block"><h4>Warnings and design checks</h4><ul>{design.warnings.map((w) => <li key={w}>{w}</li>)}</ul></div><div className="inductor-result-subsection"><h4>Materials to prepare</h4><ul>{design.materials.map((m) => <li key={m}>{m}</li>)}</ul></div><div className="inductor-result-subsection"><h4>Suggested winding steps</h4><ol>{design.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
        </>}
      </aside>
    </div>
    <details className="inductor-method-details"><summary>Formulae, assumptions, and references</summary><div className="inductor-method-content"><div><h3>Calculation method</h3><ul>{formulaNotes.map((f) => <li key={f}>{f}</li>)}</ul><h3>Assumptions</h3><ul>{assumptionNotes.map((a) => <li key={a}>{a}</li>)}</ul></div><div><h3>Engineering references</h3><ul><li><a href="https://www.tdk-electronics.tdk.com/download/531538/67fa2f237fae90fab6f31f4a10f42772/pdf-processingnotes.pdf" target="_blank" rel="noreferrer">TDK ferrite processing notes</a> â€” gap reluctance and saturation context.</li><li><a href="https://www.mag-inc.com/design/design-guides/powder-core-inductor-design" target="_blank" rel="noreferrer">Magnetics powder-core design guide</a> â€” Aâ‚— turns, fill factor, DCR, copper loss, and core-bias checks.</li><li><a href="https://ntrs.nasa.gov/api/citations/20150000774/downloads/20150000774.pdf" target="_blank" rel="noreferrer">NASA AWG reference</a> â€” standard AWG diameter relation.</li><li><a href="https://www.allaboutcircuits.com/tools/skin-depth-calculator/" target="_blank" rel="noreferrer">Skin-depth equation</a> â€” screening warning only.</li></ul><p className="inductor-safety-note">First-pass estimate only, not a validated design. Verify the exact coreâ€™s bias/loss data and test the finished part in its actual circuit.</p></div></div></details>
  </section>
}
