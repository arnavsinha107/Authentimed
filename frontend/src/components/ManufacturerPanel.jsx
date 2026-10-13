import { useState } from "react";
import ResultCard from "./ResultCard";
import { API_BASE } from "../config";

export default function ManufacturerPanel() {
  const [templateFile, setTemplateFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!templateFile) return alert("Upload packaging template");

    const formData = new FormData();
    formData.append("file", templateFile);

    setLoading(true);

    const res = await fetch(`${API_BASE}/manufacturer/generate`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Manufacturer Dashboard</h2>

      <p>Upload Packaging Template</p>

      <input
        type="file"
        onChange={(e) => setTemplateFile(e.target.files[0])}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Registering..." : "Generate QR & Register Product"}
      </button>

      <ResultCard result={result} />
    </div>
  );
}
