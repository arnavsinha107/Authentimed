# AUTHENTIMED: Complete Codebase Architecture & Technical Context

> **Project Title:** Authentimed – AI + Permissioned Blockchain Based Counterfeit Drug Detection & Replay Prevention System  
> **Course:** BCSE329L – Blockchain and Distributed Ledger Technology  
> **Repository:** [https://github.com/BruhGunned/Authentimed](https://github.com/BruhGunned/Authentimed)  
> **Public Testnet Contract (Ethereum Sepolia):** `0xc9d80E...777c6`  

---

## 1. Executive Summary & Core Value Proposition

Authentimed is an end-to-end anti-counterfeiting framework designed to eradicate counterfeit pharmaceutical distribution. The framework addresses two primary vulnerabilities in current drug supply chains:
1. **Physical Packaging Cloning:** Counterfeiters reproducing legitimate package designs using commercial digital printing.
2. **Digital QR Code Replay Attacks:** Adversaries photographing a single valid QR code from an authentic package and reprinting it on thousands of fraudulent medicine boxes.

### Core Architectural Principle
- **Stateful Custody Ledger:** Unlike traditional stateless scanning portals that only check if a serial number exists in a central database, Authentimed stores an **immutable lifecycle state** (`NONE -> VALID -> REPLAYED`) on the Ethereum Sepolia testnet.
- **Off-Chain / On-Chain Separation:** Heavy image binaries and detailed scan logs remain off-chain in Supabase PostgreSQL, while only the identity fingerprint and atomic state transitions live on-chain in `ProductRegistry.sol`.
- **Dual-Factor Authentication:** Merges visible QR-code serialization with an embedded 10-character steganographic hidden PAN code (revealed via color-channel processing).

---

## 2. Comprehensive Directory & File Structure

```
authentimed/
│
├── README.md                          # Project documentation and quickstart guide
├── PLAN.md                            # Single-scan rules and database architectural specification
├── requirements.txt                   # Root Python dependencies
├── make_diagrams.py                   # High-resolution architectural diagram generator
├── build_case_study_docx.py           # Automated docx report builder script
│
├── blockchain/                        # Ethereum Smart Contract Development (Hardhat)
│   ├── contracts/
│   │   └── ProductRegistry.sol        # Core EVM Smart Contract (State enum, register, verify)
│   ├── scripts/
│   │   └── deploy.js                  # Deployment script targeting Sepolia / localhost
│   ├── hardhat.config.js              # Hardhat configuration (Solidity ^0.8.28)
│   └── package.json                   # Hardhat dependencies
│
├── backend/                           # Flask REST API Microservice Engine
│   ├── app.py                         # REST endpoints (/manufacturer/generate, /pharmacist/verify, /consumer/verify)
│   ├── blockchain.py                  # Web3.py connector for Ethereum Sepolia / Hardhat RPC
│   ├── ai_verifier.py                 # OpenCV visual template matching & feature comparison
│   ├── code_generator.py              # 10-character steganographic PAN code validator & generator
│   ├── id_generation.py               # Unique Product ID generator (MEDICINEX-uuid)
│   ├── qr_overlay.py                  # QR code compositing onto canonical manufacturer templates
│   ├── qr_extractor.py                # Pyzbar / OpenCV QR code reader module
│   ├── revealer.py                    # RGB color channel separation microservice
│   ├── extractor.py                   # Steganographic bit-pattern decoder for PAN codes
│   ├── db.py                          # Supabase PostgreSQL database interface & ORM
│   ├── abi.json                       # Compiled ProductRegistry contract ABI
│   └── generated/                     # Artifact storage (qr/, packaged/, hidden/, reveals/)
│
├── frontend/                          # Primary React + Vite Frontend App
│   ├── package.json                   # Node.js dependencies
│   ├── vite.config.js                 # Vite build & dev server config
│   └── src/
│       ├── App.jsx                    # Core application layout
│       ├── config.js                  # API endpoint configurations
│       └── components/
│           ├── ManufacturerPanel.jsx  # Template upload, QR generation, Sepolia transaction receipt
│           ├── PharmacistPanel.jsx    # Full pack upload, AI visual check, EVM state verification
│           ├── ConsumerPanel.jsx      # QR / Strip scan verification interface
│           └── ResultCard.jsx         # Status badge (GENUINE [Green], COUNTERFEIT [Red])
│
├── frontend2/                         # Multi-page React UI Variant
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx            # Project landing page
│   │   │   ├── Manufacturer.jsx       # Manufacturer dashboard
│   │   │   ├── Pharmacist.jsx         # Licensed pharmacist verification portal
│   │   │   └── Consumer.jsx           # Consumer verification portal
│   │   └── components/
│   │       └── Navbar.jsx             # Top navigation bar
│
└── ai-auth/                           # Standalone OpenCV AI Benchmark & Feature Extractor
    ├── verify.py                      # Feature extraction (blur, color norm, edge norm thresholds)
    ├── reference.py                   # Reference feature database generator
    └── reference/
        └── reference.json             # Serialized template feature vectors
```

---

## 3. Smart Contract Layer (`blockchain/contracts/ProductRegistry.sol`)

Deploys an immutable state machine on EVM-compatible networks.

### Complete Solidity Code
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ProductRegistry {

    enum State { NONE, VALID, REPLAYED }

    struct Product {
        address manufacturer;
        State state;
    }

    mapping(string => Product) private products;
    mapping(address => bytes32) public packagingHash;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    // Register canonical template hash
    function registerTemplateHash(bytes32 hash) public onlyOwner {
        packagingHash[msg.sender] = hash;
    }

    // Register product in VALID state
    function registerProduct(string memory id) public onlyOwner {
        require(products[id].state == State.NONE, "Already registered");

        products[id] = Product({
            manufacturer: msg.sender,
            state: State.VALID
        });
    }

    // Atomic Anti-Cloning Core: VALID -> REPLAYED
    function verifyProduct(string memory id) public returns (bool) {
        if (products[id].state == State.VALID) {
            products[id].state = State.REPLAYED; // Mark claimed
            return true;                        // First scan: GENUINE
        }
        return false;                            // Repeat scan: COUNTERFEIT
    }

    function getProductState(string memory id) public view returns (State) {
        return products[id].state;
    }

    function getManufacturer(string memory id) public view returns (address) {
        return products[id].manufacturer;
    }

    function getTemplateHash(address manuf) public view returns (bytes32) {
        return packagingHash[manuf];
    }
}
```

### Key Contract Mechanics
- **State Machine Transitions:**
  - `NONE` $\rightarrow$ Product serial number is unregistered.
  - `VALID` $\rightarrow$ Product registered on-chain by authorized manufacturer.
  - `REPLAYED` $\rightarrow$ Product claimed during its first legitimate scan.
- **Single-Transition Guard:** A product moves from `VALID` to `REPLAYED` exactly once. Any subsequent call to `verifyProduct(id)` returns `false`, immediately flagging a duplicated/reprinted QR code.

---

## 4. Backend Layer (Flask Microservices & Processing Modules)

The Flask REST backend orchestrates AI visual checks, Supabase database operations, and Web3.py smart contract transactions.

### Key API Endpoints (`backend/app.py`)

#### 1. Manufacturer Product Generation (`POST /manufacturer/generate`)
- **Input:** Multipart form data containing packaging template image file.
- **Execution Flow:**
  1. Generates unique Product ID: `MEDICINEX-{uuid4().hex[:8]}`.
  2. Generates 10-character steganographic PAN code (e.g., `ABCD12345E`).
  3. Creates serialized QR code encoding `product_id`.
  4. Merges QR code onto packaging template $\rightarrow$ saves canonical `packaged` image.
  5. Inserts mapping `(product_id, pan_code)` into Supabase `products` table.
  6. Executes `registerProduct(product_id)` on Ethereum Sepolia contract (`0xc9d80E...777c6`).
- **Response:** JSON with `product_id`, `pan_code`, image URLs, and transaction hash.

#### 2. Pharmacist Verification (`POST /pharmacist/verify`)
- **Input:** Uploaded photo of physical package (full pack or strip).
- **Execution Flow:**
  1. Extracts `product_id` from QR code or resolves `product_id` from scanned PAN code via Supabase.
  2. Executes OpenCV AI visual comparison (`ai_verifier.py`) against stored manufacturer template (if full pack).
  3. Checks Supabase `pharmacist_scans` table. If row exists $\rightarrow$ Returns `COUNTERFEIT` ("Duplicate pharmacist scan").
  4. Queries Sepolia smart contract state (`getProductState`). If state $\neq$ `VALID` (i.e. already `REPLAYED`) $\rightarrow$ Returns `COUNTERFEIT`.
  5. Executes `verifyProduct(product_id)` on Sepolia (`VALID -> REPLAYED`).
  6. Inserts record into `pharmacist_scans(product_id)`.
- **Response:** JSON with verdict `GENUINE` or `COUNTERFEIT` + diagnostic reasoning.

#### 3. Consumer Verification (`POST /consumer/verify`)
- **Input:** Uploaded image of QR code or physical strip code.
- **Execution Flow:**
  1. Extracts identifier and validates against Supabase `products` table.
  2. Confirms product has been registered on-chain and scanned by a pharmacist.
  3. Checks Supabase `consumer_scans` table for key `(product_id, factor)`. If existing $\rightarrow$ Returns `COUNTERFEIT` ("Duplicate consumer verification").
  4. Inserts record into `consumer_scans(product_id, factor)`.
- **Response:** JSON with verdict `VERIFIED` or `COUNTERFEIT`.

---

## 5. AI Computer Vision & Steganography Specification

### 1. OpenCV Packaging Feature Comparison (`ai-auth/verify.py`)
Calculates three visual feature norms between scanned upload and canonical template:
```python
def extract_features(img_path):
    # Reads image, computes blur metric (Laplacian variance),
    # 3D color channel mean vectors, and Canny edge density vectors
    ...
    return blur_val, color_vector, edge_vector

# Verification Threshold Logic:
scan_blur, scan_col, scan_cent = extract_features(scan_img)
tpl_blur, tpl_col, tpl_cent = extract_features(template_img)

if scan_blur < tpl_blur * 0.7:
    return False  # Failed blur check (image out of focus or altered)
if norm(scan_col - tpl_col) > 80.0:
    return False  # Failed color norm check (printing color mismatch)
if norm(scan_cent - tpl_cent) > 12.0:
    return False  # Failed edge norm check (layout distortion)
```

### 2. Steganographic PAN Code Format & Validation (`backend/code_generator.py`)
- **Format:** 10 alphanumeric characters: 4 uppercase letters + 5 numeric digits + 1 uppercase letter (e.g. `ABCD12345E`).
- **Validation Rule:**
```python
def _validate_code(code):
    if len(code) != 10 or not (code[:4].isalpha() and code[4:9].isdigit() and code[9].isalpha()):
        raise ValueError('Format must be 4 letters + 5 digits + 1 letter')
    return code.upper()
```
- **Steganographic Reveal (`backend/revealer.py`):** Splits packaging strip image into Red, Green, and Blue color channels to extract high-frequency bit patterns encoding the PAN string.

---

## 6. Database Schema & State Rules (Supabase PostgreSQL)

Supabase maintains off-chain relational constraints to enforce single-scan invariants before triggering on-chain transactions.

```sql
-- Product Master Table
CREATE TABLE products (
    product_id VARCHAR(64) PRIMARY KEY,
    pan_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacist Scan Ledger (Enforces 1 scan per product)
CREATE TABLE pharmacist_scans (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products(product_id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consumer Scan Ledger (Enforces 1 scan per factor: 'qr' or 'strip')
CREATE TABLE consumer_scans (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(product_id),
    factor VARCHAR(10) NOT NULL CHECK (factor IN ('qr', 'strip')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_factor UNIQUE (product_id, factor)
);
```

---

## 7. System Testing & Empirical Validation Results

Adversarial testing performed on the live running pipeline demonstrated 100% accuracy across four key test scenarios:

| # | Test Scenario | Expected Behavior | Actual Pipeline Verdict |
|---|---|---|---|
| **1** | Product Registration | Success — On-chain state `VALID` | Success (Registered on Sepolia `0xc9d80E...777c6`) |
| **2** | First Pharmacist Scan (Genuine QR) | `GENUINE` verdict | `GENUINE` (State transitioned to `REPLAYED`) |
| **3** | Duplicate Scan (Reprinted QR Attack) | `COUNTERFEIT` — Replay detected | `COUNTERFEIT` ("Already verified; state is REPLAYED") |
| **4** | Valid QR on Incorrect Packaging | `COUNTERFEIT` — Packaging check failed | `COUNTERFEIT` ("AI validation failed: feature mismatch") |

---

## 8. Development & Local Deployment Setup Guide

### System Dependencies
- Node.js (v18+)
- Python (3.10+)
- Hardhat (via npm)
- OpenCV Python bindings

### 1. Smart Contract Deployment (Hardhat Local Node)
```bash
cd blockchain
npm install
npx hardhat node

# In a separate terminal:
npx hardhat run scripts/deploy.js --network localhost
```
*Note: Update `contract_address` in `backend/blockchain.py` with the deployed address.*

### 2. Backend Setup (Flask REST API)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
*Backend runs on `http://127.0.0.1:5000` or port `5001`.*

### 3. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server launches at `http://localhost:5173`.*

---

## 9. Final Evaluation Plan & Outcome Roadmap

1. **Public Testnet Deployment (COMPLETED):** `ProductRegistry.sol` deployed on Ethereum Sepolia testnet (`0xc9d80E...777c6`).
2. **Role-Based Access Control (RBAC):** Implementing JWT authentication across Regulator, Manufacturer, Distributor, Pharmacist, and Patient roles.
3. **IoT Cold-Chain Sensing:** Integrating Layer-2 environmental sensors to detect degraded/substandard medicines alongside counterfeits.
4. **Multi-Hop Custody Binding:** Extending single-step manufacturer-to-pharmacist verification into a signed multi-hop supply chain custody log.

---

## 10. Individual Student Contributions & Technical Analysis Breakdown

The development, research, and system implementation of Authentimed were executed across three specialized module leads:

### 1. Arnav Sinha (`23BKT0028`) — Blockchain Smart Contract & State Machine Lead
- **Smart Contract Core (`blockchain/contracts/ProductRegistry.sol`):** Designed and deployed the Ethereum Sepolia smart contract (`0xc9d80E...777c6`) enforcing the atomic state transition (`NONE -> VALID -> REPLAYED`).
- **Replay Protection Guard:** Engineered the `verifyProduct(string memory id)` method, ensuring that a product moves from `VALID` to `REPLAYED` exactly once. Any second call evaluates `state == State.REPLAYED` and returns `false`, catching copied/reprinted QR codes instantly.
- **Web3 Integration Layer (`backend/blockchain.py`):** Developed Python Web3.py execution scripts for transaction signing, ABI compilation, and Sepolia testnet RPC interaction.
- **Gas Optimization:** Implemented the off-chain/on-chain architectural design, keeping heavy image files off-chain while storing only state guards and identity hashes on-chain.

### 2. Kapilan Kathirvel (`23BKT0035`) — AI Computer Vision & Steganographic Feature Extraction Lead
- **OpenCV AI Feature Comparison (`ai-auth/verify.py` & `backend/ai_verifier.py`):** Implemented packaging feature extraction evaluating blur metrics (Laplacian variance), 3D RGB color channel mean vectors, and Canny edge density vectors against canonical manufacturer templates.
- **Verification Thresholds:** Defined key empirical thresholds: Blur check (`scan_blur < tpl_blur * 0.7`), Color norm (`norm(scan_col - tpl_col) <= 80.0`), and Edge norm (`norm(scan_cent - tpl_cent) <= 12.0`).
- **Steganographic PAN Code Generator (`backend/code_generator.py`):** Designed the 10-character alphanumeric authentication code format (4 letters + 5 digits + 1 letter, e.g., `ABCD12345E`) and validation logic (`_validate_code`).
- **RGB Channel Revealer (`backend/revealer.py` & `extractor.py`):** Created microservices for isolating Red, Green, and Blue color channels to extract hidden steganographic bit patterns from medicine strip scans.

### 3. Ashwin Raj (`23BKT0103`) — System Orchestration, Database Architecture & Dual-Factor Access Lead
- **Flask REST Microservices (`backend/app.py`):** Built microservice endpoints (`/manufacturer/generate`, `/pharmacist/verify`, `/consumer/verify`) orchestrating AI verification, Supabase queries, and Sepolia transactions.
- **Supabase PostgreSQL Schema (`backend/db.py`):** Created relational database schemas enforcing single-scan invariants: `products` master table, `pharmacist_scans` (primary key single-scan guard), and `consumer_scans` (`UNIQUE(product_id, factor)` constraint).
- **Dual-Factor Verification Scoping:** Implemented per-factor consumer scan scoping, permitting consumers to verify via QR code or strip code once while flagging duplicate attempts.
- **Frontend Dashboard Integration (`frontend/` & `frontend2/`):** Integrated React + Vite user interfaces for Manufacturer, Pharmacist, and Consumer user flows.

---
*Documentation auto-generated from primary source code, smart contracts, and verification pipelines of the Authentimed repository.*
