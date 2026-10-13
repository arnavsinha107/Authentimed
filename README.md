# AuthentiMED

### AI + Blockchain Pharmaceutical Counterfeit Detection System

AuthentiMED is an end-to-end Web3 pharmaceutical authentication framework that combines:

* **AI-Powered Packaging Verification** (OpenCV visual feature comparison)
* **Decentralized Custody Ledger** (Ethereum Sepolia smart contract with atomic replay prevention)
* **Dual-Factor Authentication** (Serialized QR codes + steganographic hidden PAN code channel separation)
* **Role-Based Workflows** (Manufacturer generation, licensed Pharmacist intake, and end-Consumer verification)

It prevents counterfeit medicine circulation by turning static printed serialization into an immutable, stateful on-chain lifecycle.

---

## 🚀 Architecture Overview

```
Manufacturer → Registers packaging & serialized batch on-chain
           ↓
Ethereum Sepolia Ledger (ProductRegistry.sol: 0xc9d80E...777c6)
           ↓
Pharmacist → Physical AI inspection + atomic claim (VALID -> REPLAYED)
           ↓
Consumer → Dual-factor authenticity verification (QR + Blister strip)
```

### Core Layers:
* **Frontend** – React 19 + Vite (Responsive multi-role dashboard)
* **Backend** – Flask REST API (Modular orchestration microservice)
* **Blockchain** – Solidity ^0.8.28 deployed on Ethereum Sepolia Testnet
* **Database** – PostgreSQL (Supabase) for off-chain relational tracking
* **Computer Vision** – OpenCV + PIL for packaging feature extraction & RGB steganographic channel separation

---

## 🧠 Role Workflows

### 1️⃣ Manufacturer
* Uploads packaging artwork template.
* System generates:
  * Unique Product ID (`MEDICINEX-uuid`)
  * 10-character alphanumeric PAN code (`ABCD12345E`)
  * Serialized QR code composited onto packaging
  * On-chain registration on Ethereum Sepolia
* Endpoint: `POST /manufacturer/generate`

### 2️⃣ Pharmacist
* Scans physical package at retail intake.
* System performs:
  * QR deserialization
  * OpenCV visual inspection (Laplacian blur, Euclidean color norm, Canny edge centroid)
  * Sepolia state machine transition (`VALID -> REPLAYED`)
  * Single-scan record insertion
* Replay attempts on duplicate QR codes are immediately flagged as `COUNTERFEIT`.
* Endpoint: `POST /pharmacist/verify`

### 3️⃣ Consumer
* Scans either the outer carton QR code or the physical blister strip.
* System reveals isolated RGB channels to decode the secret 10-character PAN code.
* Validates scan velocity and enforces single-scan quotas per factor.
* Endpoint: `POST /consumer/verify`

---

## 🛠 Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React 19, React Router v7, Vite, Vanilla CSS |
| **Backend** | Python 3.10+, Flask, Flask-CORS, Pyzbar, Pillow |
| **Computer Vision** | OpenCV (`cv2`), NumPy, Matplotlib |
| **Blockchain** | Solidity ^0.8.28, Hardhat, Web3.py, Sepolia Testnet |
| **Database** | PostgreSQL, Supabase, `psycopg2` |

---

## 📂 Project Structure

```
authentimed/
│
├── backend/                # Flask REST backend microservices
│   ├── app.py              # Primary REST API routes & orchestrator
│   ├── blockchain.py       # Web3.py Sepolia interface & gas manager
│   ├── ai_verifier.py      # OpenCV packaging feature matcher
│   ├── code_generator.py   # 10-character PAN code validator
│   ├── id_generation.py    # Unique ID generation & steganography
│   ├── qr_overlay.py       # QR compositing onto packaging
│   ├── qr_extractor.py     # Pyzbar / OpenCV QR code reader
│   ├── revealer.py         # RGB color channel separation
│   ├── extractor.py        # Steganographic bit-pattern decoder
│   ├── db.py               # Supabase PostgreSQL interface & ORM
│   ├── abi.json            # ProductRegistry contract ABI
│   └── .env.example        # Environment variable template
│
├── blockchain/             # Ethereum Hardhat project
│   ├── contracts/          # ProductRegistry.sol
│   ├── scripts/            # Deployment scripts
│   └── hardhat.config.js   # Hardhat network configuration
│
├── frontend/               # React + Vite web application
│   ├── src/
│   │   ├── pages/          # Landing, Manufacturer, Pharmacist, Consumer
│   │   ├── components/     # Navbar, ResultCard, Panels
│   │   └── styles/         # Modern responsive stylesheets
│   ├── package.json
│   └── vite.config.js
│
├── ai-auth/                # Standalone OpenCV AI benchmarks
├── diagrams/               # High-resolution architectural figures
├── requirements.txt        # Python backend dependencies
└── README.md
```

---

## 🔧 Setup & Local Development

### 1️⃣ Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # Mac/Linux
pip install -r ../requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your SEPOLIA_RPC_URL, PRIVATE_KEY, and DATABASE_URL

# Start backend server
python3 app.py
```

Backend runs at: `http://127.0.0.1:5001`

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### 3️⃣ Smart Contract (Hardhat)

```bash
cd blockchain
npm install
npx hardhat compile

# Deploy to Ethereum Sepolia Testnet
npx hardhat run scripts/deploy.js --network sepolia
```

> **Live Contract Address (Sepolia):**  
> `0xc9d80E54970558025ACE45c0751E039A533777c6`  
> [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xc9d80E54970558025ACE45c0751E039A533777c6)

---

## 🔐 Security & Anti-Cloning Invariants

* **EVM Single-Transition Guard:** A product exists in `{NONE, VALID, REPLAYED}`. The transition `VALID -> REPLAYED` occurs exactly once within `verifyProduct()`. Subsequent scans revert or return `false`.
* **Pharmacist Single-Scan Invariant:** Enforced via primary key constraints in Supabase `pharmacist_scans(product_id)`.
* **Consumer Per-Factor Invariant:** Enforced via composite keys in `consumer_scans(product_id, factor)`.
* **Physical Tamper Detection:** Rejects packaging photos with Laplacian blur variance `< 70%` of template, color distance `> 80.0`, or edge centroid drift `> 12.0`.
