import { useState } from "react";
import ResultCard from "./ResultCard";
import { API_BASE } from "../config";

export default function PharmacistPanel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/pharmacist/verify`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ "Final Verdict": "ERROR", "Message": "Server Error" });
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Pharmacist Verification</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={verify} disabled={loading}>
        {loading ? "Verifying..." : "Verify Medicine"}
      </button>

      {result && <ResultCard result={result} />}
    </div>
  );
}
