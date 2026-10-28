# LOC II Tank Daily Inventory & PHD Flow Comparison SPA

A modern Single Page Application (SPA) designed for **Pertamina Refinery Unit IV - Lube Oil Complex II (LOC II)** to calculate 24-hour daily tank strapping balances (00:00 to 24:00), compute inventory tonnage & barrel movements, compare delta tonnage/barrels against DCS/PHD flow indicators, and persist custom configurations using PocketBase.

---

## 🚀 Key Capabilities

1. **LOC II Master Tank List (22 Tanks: 41T-101 to 41T-122)**:
   - Extracted directly from official tank strapping data (`tank.xlsx`).
   - Focused strictly on LOC II main storage & rundown tanks:
     - **41T-101 to 41T-110**: HVI-95, HVI-160S, HVI-650 products
     - **41T-111 to 41T-114**: LMO, MMO, and DAO Raffinates
     - **41T-115 to 41T-118**: SPO, LMO, MMO, and DAO Distillates
     - **41T-119 to 41T-122**: Minarex H, Slops, Short Residue, LSWR
   - Built-in exact physical tank geometries: diameter ($D$), height ($H$), base area ($A = \pi \times (D/2)^2$), specific gravity (SG), low/high targets, and minimum/maximum safe level limits.

2. **Daily 24-Hour Window Logic (00:00 to 24:00)**:
   - Follows the operational requirement: **"fetch data for a day 00 to 24; if time fetch is not yet 24 use prev day"**.
   - Because any fetch during the current day before midnight represents an incomplete day, the app automatically defaults to the previous fully completed 24-hour operational day (`00:00:00` to `24:00:00` / next day `00:00:00`).
   - Operators can also select any custom date via the date picker to analyze past inventory balances.

3. **Strapping & Volume Calculations**:
   - $\text{Base Area } A = \pi \times \left(\frac{D_{\text{mm}}}{2 \times 1000}\right)^2 \quad (\text{m}^2)$
   - $\text{Volume at 00:00 } (V_0) = A \times \frac{L_{0\text{ mm}}}{1000} \quad (\text{m}^3)$
   - $\text{Volume at 24:00 } (V_1) = A \times \frac{L_{1\text{ mm}}}{1000} \quad (\text{m}^3)$
   - $\Delta\text{Volume } (\Delta V) = V_1 - V_0 \quad (\text{m}^3)$
   - $\text{Barrels } (\text{bbl}) = \text{Volume}_{\text{m}^3} \times 6.28981077$
   - $\text{Tonnage Start } (\text{Ton}_0) = V_0 \times \text{SG}$
   - $\text{Tonnage End } (\text{Ton}_1) = V_1 \times \text{SG}$
   - $\Delta\text{Tonnage } (\Delta\text{Ton}) = \text{Ton}_1 - \text{Ton}_0 = \Delta V \times \text{SG}$
   - Supports display in Metric Tons ($\text{TON}$), Barrels ($\text{bbl}$), or Cubic Meters ($\text{m}^3$).

4. **Multi-Mechanism Sorting Engine**:
   - **Biggest Delta (Absolute)**: Sorts by $|\Delta\text{Tonnage}|$ descending, highlighting tanks with highest movement (receipt or dispatch).
   - **+ Receipts (Inflow)**: Sorts by positive $\Delta\text{Tonnage}$ descending (receiving tanks).
   - **- Dispatches (Outflow)**: Sorts by negative $\Delta\text{Tonnage}$ ascending (suction/feed tanks).
   - **Tank Name**: Natural alphanumeric order (`41T-1`, `41T-2` ... `41T-101`, `41T-102` ... `41T-301` ... `43T-1`).
   - **Custom Sorting**: Allows users to reorder tanks using $\blacktriangle$ Move Up / $\blacktriangledown$ Move Down buttons; persisted across sessions in PocketBase!

5. **PHD Flow Indicator Correspondence & Comparison**:
   - Each tank can have its corresponding flow indicator tag from DCS/PHD assigned (e.g. `021FI_057.PV` for 41T-116, `021FI_058.PV` for 41T-115, `021FI_008.PV` for 41T-117, `021FI_002.PV` for 41T-121, `021FI_004.PV` for 35T-2).
   - Searchable catalog of **2,007 Pertamina DCS tags** built right into the app.
   - Configurable flow units: $\text{m}^3/\text{h}$, $\text{ton}/\text{h}$, $\text{T/D}$, $\text{bpd}$, or cumulative totalizer counter.
   - Computes 24h integrated total flow and compares directly with Tank $\Delta\text{Tonnage}$ and $\Delta\text{Barrels}$, showing difference and variance percentage with color-coded status badges.

6. **PocketBase Persistence**:
   - Settings (flow indicator mappings, custom sort sequence, SG overrides, active preferences) are synced to PocketBase collection `loc2_tank_settings`.
   - Supports both local PocketBase (`http://127.0.0.1:8090`) and cloud PocketBase (`https://data.miftachuda.my.id`).
   - Seamless offline fallback: automatically caches all settings in `localStorage` if PocketBase is unreachable.
   - One-click JSON Export & Import for quick backup and migration.

---

## 🛠️ Quick Start

### 1. Launch All (PocketBase + Vite SPA)
Double-click [`start-all.bat`](file:///c:/Users/Admin%20LOC%20II/roas/start-all.bat) or run:
```powershell
.\start-all.bat
```

### 2. Run Individually
- **Start PocketBase**:
  ```powershell
  .\start-pb.bat
  # or
  pocketbase.exe serve --dir=./pb_data
  ```
- **Start Vite SPA**:
  ```powershell
  npm run dev
  ```
  Open `http://localhost:5173` in your browser.

---

## 📁 Repository Structure

```
roas/
├── dist/                     # Optimized production build
├── pb_data/                  # Local PocketBase SQLite database
├── src/
│   ├── components/
│   │   ├── FlowMappingModal.jsx   # PHD Tag picker & flow unit config
│   │   ├── Header.jsx             # Date picker, mode indicators & actions
│   │   ├── MetricsOverview.jsx    # Total inventory & delta summary cards
│   │   ├── SettingsModal.jsx      # PocketBase & PHD endpoint configuration
│   │   ├── SortControls.jsx       # Biggest Delta / Name / Custom sorting bar
│   │   ├── TankCardView.jsx       # Visual tank gauge card grid view
│   │   ├── TankDetailModal.jsx    # In-depth strapping geometry & formula breakdown
│   │   └── TankTable.jsx          # Comprehensive 14-column balance table
│   ├── data/
│   │   ├── loc2_tanks_master.js   # 67 LOC II master tanks with physical strapping
│   │   └── phd_flow_tags.js       # 2,007 Pertamina DCS/PHD tag catalog
│   ├── lib/
│   │   └── pocketbase.js          # PocketBase persistence & local storage sync
│   ├── services/
│   │   └── phdService.js          # PHD HTTP / GetData query & plant simulation
│   ├── utils/
│   │   ├── dateUtils.js           # 24h operational day window calculator
│   │   └── tankCalculations.js    # Geometric volume, barrel, tonnage & flow comparison
│   ├── App.jsx                    # Root application component & pipeline
│   ├── index.css                  # Tailwind CSS styling
│   └── main.jsx                   # React 18 DOM root
├── index.html                 # HTML5 entry point
├── package.json               # Node dependencies & scripts
├── pocketbase.exe             # Standalone PocketBase executable
├── start-all.bat              # One-click launcher for PocketBase + SPA
├── start-pb.bat               # PocketBase launcher
├── start-spa.bat              # Vite development launcher
├── tailwind.config.js         # Tailwind configuration
└── vite.config.js             # Vite configuration with @vitejs/plugin-react-swc
```
