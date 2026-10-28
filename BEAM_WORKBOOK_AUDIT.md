# Beam Excel workbook reverse-engineering audit

Source folder: `E:\Abhishekyydv\ProjectsWorkingOn\InActive Projects\Calculators`

Formula cells are listed with their original Excel formula and the cached value stored in the workbook (when present). Non-formula cells are retained as constants, labels, or dates. The `constant_numeric_cells` list gives the candidate editable numeric inputs; labels and fixed lookup values still need the sheet context. Defined names and data validation ranges are listed per workbook/sheet. See the [JSON cell inventory](beam-workbook-audit.json) for every populated cell and value, including formula text, cached result, named ranges, and validation rules.

## Workbook and sheet inventory

| Workbook | Sheet | Visibility | Populated cells | Formula cells | Numeric candidate inputs | Validations |
|---|---|---:|---:|---:|---:|---:|
| DC-DC_Wattage_ADC.xlsx | Sheet1 | visible | 144 | 37 | 26 | 0 |
| DC_DC_Buck_converter.xlsx | Sheet1 | visible | 91 | 33 | 10 | 0 |
| Flyback Design Calculator_Texas.xlsx | Front Page | visible | 1 | 0 | 0 | 0 |
| Flyback Design Calculator_Texas.xlsx | Designs | visible | 217 | 48 | 41 | 0 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck | visible | 199 | 32 | 33 | 1 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck_Calc | hidden | 5053 | 4642 | 129 | 0 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck-Boost | visible | 197 | 32 | 32 | 1 |
| Flyback Design Calculator_Texas.xlsx | Flyback CCM | visible | 342 | 55 | 57 | 0 |
| Flyback Design Calculator_Texas.xlsx | Flyback_CCM_Calc | hidden | 6576 | 6009 | 175 | 0 |
| Flyback Design Calculator_Texas.xlsx | Flyback DCM | visible | 347 | 62 | 50 | 1 |
| Flyback Design Calculator_Texas.xlsx | Fly-BB_Calc | hidden | 5018 | 4647 | 102 | 0 |
| Flyback Design Calculator_Texas.xlsx | Flyback_DCM_Calc | hidden | 6033 | 5556 | 137 | 0 |
| Flyback Design Calculator_Texas.xlsx | Transformer | hidden | 789 | 255 | 63 | 0 |
| Flyback Design Calculator_Texas.xlsx | Trans_Core | hidden | 514 | 157 | 292 | 0 |
| Flyback Design Calculator_Texas.xlsx | Parts | hidden | 1069 | 159 | 721 | 0 |
| Flyback Design Calculator_Texas.xlsx | FlybacK CCM vs DCM | hidden | 0 | 0 | 0 | 0 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck vs Fly-Buck-Boost | hidden | 0 | 0 | 0 | 0 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck v Flyback | hidden | 0 | 0 | 0 | 0 |
| Flyback Design Calculator_Texas.xlsx | Constants | hidden | 38 | 7 | 1 | 0 |
| Flyback Design Calculator_Texas.xlsx | Rev Tracking | hidden | 26 | 0 | 0 | 0 |
| Flyback Design Calculator_Texas.xlsx | Fly-Buck_Max | hidden | 350 | 244 | 70 | 0 |
| Flyback_converter.xlsx | DCM Flyback Converter Cal. | visible | 122 | 38 | 19 | 0 |
| Flyback_converter.xlsx | Sheet1 | visible | 43 | 10 | 13 | 0 |
| Imprest_format.xlsx | Sheet1 | visible | 275 | 47 | 95 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 1 | visible | 100 | 12 | 19 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | Tail center | hidden | 97 | 15 | 19 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | Stop  | hidden | 57 | 6 | 11 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | Tail | hidden | 57 | 6 | 11 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 2 | visible | 119 | 20 | 23 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 3 | visible | 54 | 6 | 11 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 4 | visible | 100 | 12 | 19 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 5 | visible | 186 | 24 | 35 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 6 | visible | 76 | 9 | 15 | 0 |
| LED CURRENT CALCULATIN SHEET.xlsx | led 7 | visible | 76 | 9 | 15 | 0 |
| LM317.xlsx | Constant Current | visible | 129 | 33 | 47 | 0 |
| LM317.xlsx | Constant Voltage | visible | 16 | 2 | 5 | 0 |
| NTC.xlsx | Sheet1 | visible | 57 | 9 | 18 | 0 |
| Op-amp Hysterisis.xlsx | Sheet1 | visible | 27 | 12 | 4 | 0 |
| PCB_to_panel_calculator.xlsx | Sheet1 | visible | 29 | 2 | 6 | 2 |
| Power_converters_basic_cal.xlsx | Sheet1 | visible | 89 | 31 | 10 | 0 |
| Solar Street Light Calculator.xlsx | Sheet1 | visible | 53 | 25 | 16 | 4 |
| Solar Street Light Calculator.xlsx | Emergency | visible | 43 | 21 | 12 | 1 |
| SSE Calculator.xlsx | Solar | visible | 58 | 29 | 16 | 4 |
| SSE Calculator.xlsx | Serul | visible | 31 | 8 | 7 | 3 |
| SSE Calculator.xlsx | Emergency | visible | 53 | 25 | 16 | 1 |
| Wattage.xlsx | Sheet1 | visible | 53 | 16 | 20 | 0 |
## Formula and cell-level interpretation

- Formula cells are intermediate/output dependencies. Their references remain visible in the raw formula and can be followed by cell address in the JSON inventory.
- Numeric constants are candidate inputs or fixed design constants. Input formatting colors are retained in the JSON when present, and validation rules identify constrained inputs.
- Formula cells in hidden sheets are included; they serve as calculations/support tables and are not necessarily user-editable inputs.
- Excel formulas are inspected as formulas. The cached results shown are saved workbook values and may be stale if the original workbook was not recalculated before save.

## Workbook-specific observations

- `Flyback Design Calculator_Texas.xlsx` contains visible design tabs and multiple hidden calculation/transformer/parts/constants sheets. Its names and formula-heavy helper sheets are included in the full JSON; the interactive website includes a compact flyback design model based on visible model inputs, not a full clone of every hidden design iteration.
- `LED CURRENT CALCULATIN SHEET.xlsx` repeats a lumen-to-current method across several LED part variants and hidden Tail/Stop variants. The web calculator exposes the shared formula and the workbook?s default group values.
- `Solar Street Light Calculator.xlsx` and `SSE Calculator.xlsx` include solar, emergency and load sheets. The web calculators preserve the sheet equations and default assumptions (12 V system, workbook derating, empirical lumen fit, and in the SSE Solar sheet the 7-hour PIR allowance).
- `Imprest_format.xlsx` is an employee cash/expense ledger, not a calculator. It uses sequential balance formulas and is not included under Beam Calculators.

## Legacy `.xls` files requiring conversion

- `AL8863-Calculator.xls`: Legacy BIFF .xls; Excel is installed, but its COM automation server fails to start here (80080005), and no LibreOffice or .xls reader is installed. No formulas were guessed from this binary file.
- `RC_Snubber_Design_Rev2.xls`: Legacy BIFF .xls; Excel is installed, but its COM automation server fails to start here (80080005), and no LibreOffice or .xls reader is installed. No formulas were guessed from this binary file.

## Website calculator mapping

The 16 interactive workbook-derived tools are available under **BEAM CALCULATORS**. Their source workbook/sheet, equations, inputs and multi-value outputs are shown in each calculator card. The individual source mapping is included in `src/beamCalculators.js`.
