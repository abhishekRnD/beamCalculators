import { useEffect, useMemo, useState } from 'react'
import { calculators, categories } from './calculators'
import { beamCalculators } from './beamCalculators'
import InductorDesignCalculator from './InductorDesignCalculator'
import './App.css'

const allCalculators = [...calculators, ...beamCalculators]
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const initialCalculator = allCalculators.find((item) => slug(item.name) === new URLSearchParams(location.search).get('calculator')) || calculators[0]
const unitFor = (name) => ({
  'Watt Calculator':'W','Watt-hour Calculator':'Wh','Watts to Amps Calculator':'A','Watts to Lux Calculator':'lx','Power Dissipation Calculator':'W','Power Factor Calculator':'','Voltage Drop Calculator':'V','Internal Resistance Calculator':'Ω','Capacitance Calculator':'F','Capacitive Reactance Calculator':'Ω',"Faraday's Law Calculator":'V','Boost Converter Calculator':'V','Breaker Size Calculator':'A','Bridge Rectifier Calculator':'V DC','Buck Converter Calculator':'V','Capacitive Transformerless Power Supply Calculator':'A','Capacitor Charge Time Calculator':'s','Capacitor Calculator':'F','Capacitor Energy Calculator':'J','Capacitors in Series Calculator':'µF','Capacitor Size Calculator':'F','Crossover Calculator':'µF','Current Divider Calculator':'A','Dipole Calculator':'m','Flyback Converter Calculator':'V','Forward Converter Calculator':'V','Generator Power Calculator':'W','Helical Coil Calculator':'µH','High Pass Filter Calculator':'Hz','Ideal Transformer Calculator':'V','Inductor Energy Storage Calculator':'J','Inductors in Parallel Calculator':'mH','Inductors In Series Calculator':'mH','Inverting Buck-Boost Converter Calculator':'V','J-Pole Antenna Calculator':'m','LED Resistor Calculator':'Ω','Low Pass Filter Calculator':'Hz','Magnetic Force Between Current-Carrying Wires Calculator':'N','Magnetic Force on a Current-Carrying Wire Calculator':'N','MOSFET Calculator':'W','MOSFET Threshold Voltage Calculator':'V','Motor Capacitor Size Calculator':'µF','555 Timer Calculator':'Hz','Noise Figure Calculator':'dB',"Ohm's Law Calculator":'Ω','Parallel Capacitor Calculator':'µF','Parallel Resistor Calculator':'Ω','RC Circuit Calculator':'s','Resistor Color Code Calculator':'Ω','Resistor Noise Calculator':'µV RMS','Resistor Voltage Drop Calculator':'V','Resistor Wattage Calculator':'W','Resonant Frequency Calculator':'Hz','RLC Circuit Calculator':'','RLC Impedance Calculator':'Ω','RMS Voltage Calculator':'V RMS','Series Resistor Calculator':'Ω','Three Phase Calculator':'W','Transformer Sizing Calculator':'VA','Transistor Biasing Calculator':'Ω','Voltage Divider Calculator':'V','Voltage Regulation Calculator':'%','Wheatstone Bridge Calculator':'Ω','Wire Gauge Calculator':'AWG','Wire Resistance Calculator':'Ω','Wire Size Calculator':'mm²'
}[name] || '')

function App() {
  const [active, setActive] = useState(initialCalculator)
  const [values, setValues] = useState(Object.fromEntries(initialCalculator.fields.map((field) => [field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), field.value])))
  const [manual, setManual] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All calculators')
  const [catalogOpen, setCatalogOpen] = useState(false)

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) { event.preventDefault(); document.querySelector('#calculator-search')?.focus() }
      if (event.key === 'Escape') setCatalogOpen(false)
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const selectCalculator = (item) => {
    setActive(item)
    setValues(Object.fromEntries(item.fields.map((field) => [field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), field.value])))
    setManual([])
    setCatalogOpen(false)
    history.replaceState(null, '', `?calculator=${slug(item.name)}`)
  }

  const result = useMemo(() => {
    const optionKeys = new Set(active.fields.filter((field) => field.options).map((field) => field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')))
    const numeric = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, optionKeys.has(key) || value === 'yes' || value === 'no' ? value : Number(value)]))
    if (Object.values(values).some((value) => value === '') || Object.entries(numeric).some(([key, value]) => !optionKeys.has(key) && typeof value === 'number' && !Number.isFinite(value))) return null
    try {
      const value = active.solve(numeric)
      if (typeof value === 'number') return Number.isFinite(value) ? { result: value } : null
      return value && Object.values(value).some((item) => typeof item === 'string' || Number.isFinite(item)) ? value : null
    } catch { return null }
  }, [active, values])

  const filtered = allCalculators.filter((item) => (category === 'All calculators' || (category === 'BEAM CALCULATORS' ? item.source : item.category === category)) && item.name.toLowerCase().includes(query.toLowerCase()))
  const update = (field, value) => {
    const key = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    if (!['Watt Calculator', "Ohm's Law Calculator"].includes(active.name)) {
      setValues((current) => ({ ...current, [key]: value }))
      return
    }
    const sources = [...manual.filter((item) => item !== key), key].slice(-2)
    setManual(sources)
    setValues((current) => {
      const isWatt = active.name === 'Watt Calculator'
      const next = isWatt ? { voltage: '', current: '', resistance: '', power: '' } : { voltage: '', current: '', resistance: '' }
      sources.forEach((item) => { next[item] = item === key ? value : current[item] })
      if (sources.length < 2 || sources.some((item) => Number(next[item]) <= 0 || !Number.isFinite(Number(next[item])))) return next
      const [a, b] = sources
      const known = { [a]: Number(next[a]), [b]: Number(next[b]) }
      if ('voltage' in known && 'current' in known) { known.resistance = known.voltage / known.current; if (isWatt) known.power = known.voltage * known.current }
      else if ('voltage' in known && 'resistance' in known) { known.current = known.voltage / known.resistance; if (isWatt) known.power = known.voltage ** 2 / known.resistance }
      else if (isWatt && 'voltage' in known && 'power' in known) { known.current = known.power / known.voltage; known.resistance = known.voltage ** 2 / known.power }
      else if ('current' in known && 'resistance' in known) { known.voltage = known.current * known.resistance; if (isWatt) known.power = known.current ** 2 * known.resistance }
      else if (isWatt && 'current' in known && 'power' in known) { known.voltage = known.power / known.current; known.resistance = known.power / known.current ** 2 }
      else if (isWatt && 'resistance' in known && 'power' in known) { known.voltage = Math.sqrt(known.power * known.resistance); known.current = Math.sqrt(known.power / known.resistance) }
      return Object.fromEntries(Object.entries(known).map(([name, number]) => [name, String(number)]))
    })
  }
  const mainKey = active.units ? (active.resultKey || Object.keys(active.units).find((key) => active.units[key]) || Object.keys(result || {})[0]) : 'result'
  const mainValue = result?.[mainKey]
  const displayed = mainValue == null ? '—' : typeof mainValue === 'number' ? new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(mainValue) : mainValue

  return <div className="site-shell">
    <header className="topbar">
      <a className="brand beam-brand" href="#home" aria-label="BEAM Infotech home"><span className="brand-mark"><b>BE</b></span><span className="beam-wordmark"><strong>BEAM</strong><small>INFOTECH PVT. LTD.</small></span></a>
      <nav className="topnav" aria-label="Main navigation"><a href="#calculators" className="nav-active">Calculators</a><a href="#topics">Topics</a><a href="#about">About</a></nav>
      <button className="search-trigger" onClick={() => document.querySelector('#calculator-search')?.focus()}><span>⌕</span> Search calculators <kbd>⌘ K</kbd></button>
    </header>

    <main id="home">
      <section className="hero-wrap">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> BEAM INFOTECH &middot; ENGINEERING TOOLS</div><h1>Engineering built<br/><span>with a Beam edge.</span></h1><p>Practical electrical calculators for the circuits, components, and systems you build every day.</p><a className="hero-link" href="#calculator">Explore calculators <span>↓</span></a></div>
        <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="circuit-board"><div className="board-grid"/><div className="chip"><span>U1</span><b>IC</b></div><div className="trace trace-a"/><div className="trace trace-b"/><div className="trace trace-c"/><div className="node node-a"/><div className="node node-b"/><div className="node node-c"/><div className="resistor"><i/><i/><i/><i/><i/></div><div className="capacitor"><i/><i/></div><div className="board-label">12.00 <small>V</small></div></div><div className="floating-pill pill-top">∿ AC / DC</div><div className="floating-pill pill-bottom"><span className="pulse-dot"/> Live calculations</div></div>
      </section>

      <section className="stats-strip" aria-label="Calculator highlights"><div><span className="stat-icon">⌁</span><strong>{allCalculators.length + 1}</strong><small>engineering calculators</small></div><div><span className="stat-icon">∑</span><strong>Verified</strong><small>engineering formulas</small></div><div><span className="stat-icon">↗</span><strong>Instant</strong><small>results as you type</small></div><div><span className="stat-icon">◇</span><strong>Free</strong><small>to use, always</small></div></section>

      <section className="workspace" id="calculator">
        <aside className="sidebar" id="calculators"><div className="side-heading"><span>BEAM TOOLBOX</span><span className="tool-count">{allCalculators.length + 1}</span></div><label className="search-box"><span>⌕</span><input id="calculator-search" value={query} onChange={(e) => { setQuery(e.target.value); setCatalogOpen(true) }} placeholder="Find a calculator..."/><kbd>/</kbd></label><div className="category-list"><p className="side-label">CATEGORIES</p>{[...categories, 'BEAM CALCULATORS'].map((item, index) => <button key={item} className={`category-button ${category === item ? 'selected' : ''}`} onClick={() => { setCategory(item); setCatalogOpen(true) }}><span className="category-icon">{index === 0 ? '▦' : index === 1 ? 'ϟ' : item === 'Circuits' ? '⌁' : item === 'Capacitors' ? '∥' : item === 'Wiring' ? '⌇' : '◉'}</span>{item}<span className="category-count">{item === 'All calculators' ? allCalculators.length : item === 'BEAM CALCULATORS' ? beamCalculators.length : calculators.filter(x => x.category === item).length + (item === 'Inductors' ? 1 : 0)}</span></button>)}</div><div className="sidebar-note"><span>✳</span><div><b>Built for curious minds</b><small>Clear answers. Better builds.</small></div></div></aside>

        <div className="content-column">
          <div className="breadcrumb"><span>Home</span><i>/</i><span>Electrical</span><i>/</i><b>{active.category}</b></div>
          <div className="section-title-row"><div><div className="eyebrow section-eyebrow">THE CIRCUIT TOOLBOX</div><h2>{active.source ? 'BEAM CALCULATORS' : 'Electrical calculators'}</h2><p>{active.source ? 'Interactive tools recreated from your Excel workbook formulas and design sheets.' : 'Everything you need to size, analyze, and understand a circuit.'}</p></div>{active.source && <a className="browse-button audit-link" href="/beam-workbook-audit.md" target="_blank" rel="noreferrer">Workbook audit</a>}<button className="browse-button" onClick={() => setCatalogOpen(!catalogOpen)}>Browse all <span>↗</span></button></div>
          <div className="calculator-card">
            <div className="calculator-top"><div className="calc-icon"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18.2 3 7.5 17h7.1l-1 12L24.5 14h-7.2L18.2 3Z"/></svg></div><div className="calc-heading"><div className="calc-meta"><span className="tag">{active.source ? 'BEAM CALCULATORS' : active.category}</span><span className="verified"><span>✓</span> Live calculation</span></div><h3>{active.name}</h3><p>{active.description}</p>{active.source && <small className="source-label">Source: {active.source}</small>}</div><button className="bookmark" title="Calculator link" onClick={() => navigator.clipboard?.writeText(location.href)}>↗</button></div>
            <div className="calc-body"><div className="input-panel"><div className="panel-caption"><span>YOUR INPUTS</span><small>{['Watt Calculator', "Ohm's Law Calculator"].includes(active.name) ? 'Enter any two values' : 'Change values to calculate'}</small></div><div className="fields-grid">{active.fields.map((field) => { const key = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); return <label className="field" key={field.label}><span>{field.label}</span><div className="input-wrap">{field.options ? <select value={values[key] ?? ''} onChange={(e) => update(field, e.target.value)} aria-label={field.label}>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type="number" step="any" value={values[key] ?? ''} onChange={(e) => update(field, e.target.value)} aria-label={field.label}/>}{field.unit && <span className="unit">{field.unit}</span>}</div></label> })}</div><div className="formula-row"><span className="formula-icon">ƒx</span><span><small>FORMULA</small><b>{active.formula}</b></span></div></div>
              <div className="result-panel"><div className="result-label"><span className="result-check">✓</span> YOUR RESULT</div><div className="result-value">{displayed}<span>{active.units?.[mainKey] ?? (active.name === 'Wire Gauge Calculator' ? 'AWG' : unitFor(active.name))}</span></div>{active.units && result && <div className="extra-results">{Object.entries(result).filter(([key]) => key !== mainKey).map(([key, value]) => <div className="extra-result" key={key}><span>{key.replaceAll('_',' ')}</span><b>{typeof value === 'number' ? new Intl.NumberFormat('en-US',{maximumSignificantDigits:5}).format(value) : value} {active.units[key]}</b></div>)}</div>}<div className="result-rule"/><div className="result-detail"><span className="detail-dot"/> Calculated instantly from your inputs</div><div className="result-graphic"><div className="wave-label">SIGNAL OUTPUT <b>● LIVE</b></div><svg viewBox="0 0 280 68" preserveAspectRatio="none" aria-label="Decorative signal waveform"><defs><linearGradient id="wave" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4ae0c1" stopOpacity=".22"/><stop offset="1" stopColor="#4ae0c1" stopOpacity="0"/></linearGradient></defs><path d="M0 42 C18 42 18 15 36 15 S54 54 72 54 90 29 108 29 126 45 144 45 162 17 180 17 198 51 216 51 234 31 252 31 270 42 280 42 V68 H0Z" fill="url(#wave)"/><path d="M0 42 C18 42 18 15 36 15 S54 54 72 54 90 29 108 29 126 45 144 45 162 17 180 17 198 51 216 51 234 31 252 31 270 42 280 42" fill="none" stroke="#4ae0c1" strokeWidth="2"/></svg></div></div></div>
            <div className="card-footer"><span><span className="info-icon">i</span> Based on ideal component assumptions. Real-world values may vary.</span><button onClick={() => { setValues(Object.fromEntries(active.fields.map(field => [field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), field.value]))); setManual([]) }}>Reset values <span>↺</span></button></div>
          </div>

          {catalogOpen && <div className="catalog-panel"><div className="catalog-header"><div><div className="eyebrow section-eyebrow">FIND YOUR NEXT TOOL</div><h3>{category === 'BEAM CALCULATORS' ? 'BEAM CALCULATORS' : category === 'Inductors' ? 'Inductors' : 'All electrical calculators'}</h3></div><button aria-label="Close calculator list" onClick={() => setCatalogOpen(false)}>×</button></div>{category === 'Inductors' && (!query || 'inductor design calculator'.includes(query.toLowerCase())) && <InductorDesignCalculator />}<div className="catalog-grid">{filtered.map(item => <button key={item.name} onClick={() => selectCalculator(item)} className={`catalog-item ${active.name === item.name ? 'active' : ''}`}><span className="mini-icon">ϟ</span><span><b>{item.name}</b><small>{item.category} · {item.formula}</small></span><span className="catalog-arrow">↗</span></button>)}</div>{filtered.length === 0 && <p className="no-results">No calculators match “{query}”. Try another search.</p>}</div>}

          <div className="below-cards" id="topics"><article className="tip-card"><span className="tip-icon">✦</span><div><span className="eyebrow section-eyebrow">ENGINEERING NOTE</span><h3>Good calculations start with a clear model.</h3><p>Choose the circuit type and enter values in consistent units. These quick tools use ideal component equations; check ratings and local electrical codes before building.</p></div><span className="tip-arrow">↗</span></article><article className="help-card"><div className="help-icon">?</div><div><b>New to circuit calculations?</b><p>Start with Ohm’s law to connect voltage, current, and resistance.</p></div><button onClick={() => selectCalculator(calculators.find(item => item.name === "Ohm's Law Calculator"))}>Try Ohm’s law <span>→</span></button></article></div>
        </div>
      </section>
    </main>
    <footer id="about" className="site-footer"><a className="brand beam-brand footer-brand" href="#home"><span className="brand-mark"><b>BE</b></span><span className="beam-wordmark"><strong>BEAM</strong><small>INFOTECH PVT. LTD.</small></span></a><div className="footer-credit"><strong>Math happened. These three are responsible:</strong><span>Abhishek (Design Engineer)</span><span>Rahul Vishwakarma (Deputy Manager)</span><span>Nitin Jain (CTO)</span></div><span>&copy; 2026 BEAM Infotech Pvt. Ltd.</span></footer>
  </div>
}

export default App
