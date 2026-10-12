import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('diagrams', exist_ok=True)

# -------------------------------------------------------------
# Figure 1: End-to-End System Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.5)

ax.text(5, 6.1, 'AUTHENTIMED: End-to-End System Architecture', fontsize=13, weight='bold', ha='center', color='#1A237E')

# Component Boxes
def add_box(ax, x, y, w, h, text, bg, border):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", facecolor=bg, edgecolor=border, linewidth=1.5)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h/2, text, fontsize=9, weight='bold', ha='center', va='center', color='#0D47A1', multialignment='center')

# Clients
add_box(ax, 0.5, 4.3, 2.2, 1.2, 'Manufacturer Portal\n• Template Upload\n• QR & PAN Gen\n• Sepolia Registration', '#E3F2FD', '#1565C0')
add_box(ax, 0.5, 2.6, 2.2, 1.2, 'Pharmacist Web App\n• Full Pack Scan\n• Single Scan Rule\n• EVM State Verification', '#E8F5E9', '#2E7D32')
add_box(ax, 0.5, 0.9, 2.2, 1.2, 'Consumer Web App\n• QR or Strip Scan\n• Per-Factor Scan Limit\n• Verification Verdict', '#FFF3E0', '#E65100')

# Backend Core
add_box(ax, 3.8, 2.4, 2.4, 3.1, 'Flask REST API Engine\n(app.py)\n\n• /manufacturer/generate\n• /pharmacist/verify\n• /consumer/verify\n• Response Synthesizer', '#F3E5F5', '#7B1FA2')

# Services
add_box(ax, 7.1, 4.5, 2.4, 1.3, 'OpenCV AI Layer\n• Feature Extract (Blur/Edge)\n• Color Norm (Threshold 80)\n• RGB Channel Reveal', '#E0F7FA', '#00838F')
add_box(ax, 7.1, 2.6, 2.4, 1.3, 'Supabase PostgreSQL\n• products (id <=> pan_code)\n• pharmacist_scans\n• consumer_scans', '#FFF8E1', '#F57F17')
add_box(ax, 7.1, 0.7, 2.4, 1.3, 'Ethereum Sepolia Ledger\n(ProductRegistry.sol)\n• 0xc9d80E...777c6\n• registerProduct()\n• verifyProduct()', '#FFEBEE', '#C62828')

# Arrows
arr = dict(arrowstyle="->", lw=1.5, color="#37474F")
ax.annotate('', xy=(3.8, 5.0), xytext=(2.7, 5.0), arrowprops=arr)
ax.annotate('', xy=(3.8, 3.2), xytext=(2.7, 3.2), arrowprops=arr)
ax.annotate('', xy=(3.8, 1.5), xytext=(2.7, 1.5), arrowprops=arr)

ax.annotate('', xy=(7.1, 5.1), xytext=(6.2, 5.0), arrowprops=arr)
ax.annotate('', xy=(7.1, 3.2), xytext=(6.2, 3.8), arrowprops=arr)
ax.annotate('', xy=(7.1, 1.4), xytext=(6.2, 2.7), arrowprops=arr)

plt.tight_layout()
plt.savefig('diagrams/figure1.png', bbox_inches='tight')
plt.close()
print("Figure 1 generated")


# -------------------------------------------------------------
# Figure 2: Smart Contract State Machine Transition Flowchart
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4), dpi=300)
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 4.5)

ax.text(5, 4.1, 'ProductRegistry.sol (Sepolia: 0xc9d80E...777c6) State Machine', fontsize=12, weight='bold', ha='center', color='#1A237E')

# States
add_box(ax, 0.6, 1.5, 2.0, 1.2, 'State: NONE\n(Unregistered)', '#ECEFF1', '#455A64')
add_box(ax, 4.0, 1.5, 2.0, 1.2, 'State: VALID\n(Registered On-Chain)', '#E8F5E9', '#2E7D32')
add_box(ax, 7.4, 1.5, 2.0, 1.2, 'State: REPLAYED\n(Claimed by 1st Scan)', '#FFEBEE', '#C62828')

# Transitions
arr_trans = dict(arrowstyle="->", lw=2, color="#1565C0")
ax.annotate('', xy=(4.0, 2.1), xytext=(2.6, 2.1), arrowprops=arr_trans)
ax.text(3.3, 2.3, 'registerProduct(id)\n[onlyOwner]', fontsize=8, weight='bold', ha='center', color='#1565C0')

ax.annotate('', xy=(7.4, 2.1), xytext=(6.0, 2.1), arrowprops=arr_trans)
ax.text(6.7, 2.3, 'verifyProduct(id)\n[1st Pharmacist Scan]', fontsize=8, weight='bold', ha='center', color='#2E7D32')

# Replay attempt arc
ax.annotate('', xy=(8.4, 1.5), xytext=(8.4, 0.5), arrowprops=dict(arrowstyle="->", lw=2, color="#C62828", connectionstyle="arc3,rad=-0.5"))
ax.text(8.4, 0.2, 'Any Further Scan\n--> Returns false\n--> COUNTERFEIT Flagged', fontsize=8, weight='bold', ha='center', color='#C62828')

plt.tight_layout()
plt.savefig('diagrams/figure2.png', bbox_inches='tight')
plt.close()
print("Figure 2 generated")


# -------------------------------------------------------------
# Figure 3: AI Feature Extraction & RGB Steganographic Channel Pipeline
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)

ax.text(5, 4.6, 'OpenCV AI Packaging Verification & RGB Steganographic Revealer', fontsize=12, weight='bold', ha='center', color='#1A237E')

add_box(ax, 0.4, 2.8, 2.2, 1.3, 'Input Packaging Photo\n(Full Pack or Strip)', '#E1F5FE', '#0288D1')
add_box(ax, 3.8, 2.8, 2.4, 1.3, 'OpenCV Feature Extract\n• Blur Check (tpl*0.7)\n• Color Norm (<= 80.0)\n• Edge Norm (<= 12.0)', '#FFF3E0', '#F57C00')
add_box(ax, 7.2, 2.8, 2.4, 1.3, 'Visual Match Verdict\nPass: Features Match\nFail: AI Validation Error', '#E8F5E9', '#388E3C')

add_box(ax, 3.8, 0.6, 2.4, 1.4, 'Steganographic Revealer\n• R/G/B Channel Split\n• Bit-pattern Extraction\n• revealer.py / extractor.py', '#F3E5F5', '#8E24AA')
add_box(ax, 7.2, 0.6, 2.4, 1.4, 'PAN Code Validation\n10-Char Format Check\n(4 letters + 5 digits + 1 letter)', '#EDE7F6', '#512DA8')

arr_ai = dict(arrowstyle="->", lw=1.8, color="#37474F")
ax.annotate('', xy=(3.8, 3.45), xytext=(2.6, 3.45), arrowprops=arr_ai)
ax.annotate('', xy=(7.2, 3.45), xytext=(6.2, 3.45), arrowprops=arr_ai)
ax.annotate('', xy=(3.8, 1.3), xytext=(2.6, 3.0), arrowprops=arr_ai)
ax.annotate('', xy=(7.2, 1.3), xytext=(6.2, 1.3), arrowprops=arr_ai)

plt.tight_layout()
plt.savefig('diagrams/figure3.png', bbox_inches='tight')
plt.close()
print("Figure 3 generated")


# -------------------------------------------------------------
# Figure 4: Sequence Diagram of Dual-Factor Verification & Replay Protection
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 5.2), dpi=300)
ax.axis('off')
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)

ax.text(5, 5.6, 'Authentimed Sequence Diagram & Sepolia Replay Protection Flow', fontsize=12, weight='bold', ha='center', color='#1A237E')

# Lifelines
roles = [('Manufacturer', 1.0), ('Flask API', 3.5), ('Supabase DB', 6.0), ('Sepolia Contract', 8.5)]
for name, x in roles:
    ax.text(x, 5.0, name, fontsize=10, weight='bold', ha='center', bbox=dict(boxstyle='square,pad=0.4', facecolor='#ECEFF1', edgecolor='#37474F'))
    ax.plot([x, x], [0.5, 4.6], color='#B0BEC5', linestyle='--', lw=1.5)

# Sequences
def add_msg(ax, y, x1, x2, text, color='#0D47A1', dashes=False):
    style = '->'
    ls = '--' if dashes else '-'
    ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle=style, lw=1.5, color=color, linestyle=ls))
    ax.text((x1+x2)/2, y+0.1, text, fontsize=7.5, weight='bold', ha='center', color=color)

add_msg(ax, 4.1, 1.0, 3.5, '1. Upload Template & Generate Product ID + 10-char PAN')
add_msg(ax, 3.7, 3.5, 6.0, '2. Store product_id <=> pan_code in Supabase')
add_msg(ax, 3.3, 3.5, 8.5, '3. registerProduct(id) on Sepolia --> State: VALID')

add_msg(ax, 2.6, 1.0, 3.5, '4. Pharmacist First Scan (Genuine QR)', color='#2E7D32')
add_msg(ax, 2.2, 3.5, 8.5, '5. verifyProduct(id) on Sepolia --> State: REPLAYED', color='#2E7D32')
add_msg(ax, 1.8, 3.5, 6.0, '6. Record pharmacist_scan entry --> Return GENUINE', color='#2E7D32')

add_msg(ax, 1.1, 1.0, 3.5, '7. Duplicate Scan Attempt (Reprinted QR Replay)', color='#C62828')
add_msg(ax, 0.7, 3.5, 1.0, '8. Return COUNTERFEIT (State already REPLAYED)', color='#C62828', dashes=True)

plt.tight_layout()
plt.savefig('diagrams/figure4.png', bbox_inches='tight')
plt.close()
print("Figure 4 generated")
