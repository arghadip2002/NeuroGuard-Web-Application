// frontend/src/App.jsx
import React, { useState, useCallback, useMemo } from 'react';

// Inline SVG Icons
const IconUpload = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const IconCpu = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M20 15h2"/></svg>;
const IconCheckCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconXCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const IconLoader = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.8-2.8"/><path d="M18 12h4"/><path d="m19.72 19.72-2.8-2.8"/><path d="M12 18v4"/><path d="m4.22 19.78 2.8-2.8"/><path d="M2 12h4"/><path d="m4.22 4.22 2.8 2.8"/></svg>;
const IconBrain = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 0-2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2"/><path d="M20 2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2"/></svg>;
const IconAlertTriangle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API URL - use relative path since frontend and backend are served together
  const API_URL = '';  // Empty string means same origin

  const CLASS_INFO = useMemo(() => ({
    glioma: { name: "Glioma Tumor (Malignant)", color: "#dc2626", bg: "#fef2f2", icon: <IconAlertTriangle className="icon-sm" /> },
    meningioma: { name: "Meningioma Tumor (Benign)", color: "#ea580c", bg: "#fff7ed", icon: <IconAlertTriangle className="icon-sm" /> },
    pituitary: { name: "Pituitary Tumor (Benign)", color: "#ca8a04", bg: "#fefce8", icon: <IconAlertTriangle className="icon-sm" /> },
    notumor: { name: "No Tumor Detected", color: "#16a34a", bg: "#f0fdf4", icon: <IconCheckCircle className="icon-sm" /> },
  }), []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPrediction(null);
      setError('');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select an MRI image file.');
      return;
    }

    setLoading(true);
    setPrediction(null);
    setError('');

    const formData = new FormData();
    formData.append('mriImage', selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Unknown server error.');
      }

      setPrediction(data);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError(`Prediction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const ResultDisplay = ({ result }) => {
    const info = CLASS_INFO[result.predicted_class.toLowerCase()] || CLASS_INFO.notumor;
    const confidencePercent = (result.confidence * 100).toFixed(2);

    return (
      <div 
        className="result-card" 
        style={{ 
          backgroundColor: info.bg, 
          borderLeftColor: info.color 
        }}
      >
        <h3 className="result-title">
          {info.icon}
          <span className="result-title-text">Diagnosis Result</span>
        </h3>
        <div className="result-details">
          <div className="result-row result-row-border">
            <span className="result-label">Predicted Class:</span>
            <span className="result-value" style={{ color: info.color }}>{info.name}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Confidence Score:</span>
            <span className="result-value result-value-indigo">{confidencePercent}%</span>
          </div>
        </div>
        
        <div className="confidence-bar-container">
          <div 
            className="confidence-bar-fill" 
            style={{ 
              width: `${confidencePercent}%`,
              backgroundColor: info.color
            }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        
        :root {
            --color-indigo-600: #4f46e5;
            --color-indigo-700: #4338ca;
            --color-gray-900: #111827;
            --color-gray-500: #6b7280;
            --color-gray-300: #d1d5db;
            --color-white: #ffffff;
            --color-gray-100: #f3f4f6;
            --color-gray-50: #f9fafb;
            --color-red-700: #b91c1c;
            --color-red-100: #fee2e2;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .app-container {
          min-height: 100vh;
          background-color: var(--color-gray-100);
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .main-card {
          width: 100%;
          max-width: 900px;
          background-color: var(--color-white);
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2.5rem;
          border-top: 8px solid var(--color-indigo-600);
        }
        @media (max-width: 768px) { .main-card { padding: 1.5rem; } }

        .header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .header-icon {
          color: var(--color-indigo-600);
          width: 3rem;
          height: 3rem;
          margin: 0 auto 0.75rem;
          stroke-width: 2.5;
        }
        .header-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-gray-900);
          letter-spacing: -0.025em;
        }
        .header-subtitle {
          margin-top: 0.5rem;
          font-size: 1.125rem;
          color: var(--color-gray-500);
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }
        @media (min-width: 768px) {
            .form-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .section-upload {
            padding: 1rem;
            border: 2px dashed var(--color-gray-300);
            border-radius: 0.75rem;
            transition: border-color 200ms ease-in-out;
        }
        .section-upload:hover { border-color: #6366f1; }
        .section-results {
            padding: 1rem;
            background-color: var(--color-gray-50);
            border-radius: 0.75rem;
            box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--color-indigo-700);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
        }
        .section-title-results { color: var(--color-gray-800); }
        .section-title-results > svg { color: var(--color-indigo-700); }
        .section-title > svg {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.5rem;
        }

        .upload-label {
            cursor: pointer;
            display: block;
            width: 100%;
            text-align: center;
            padding: 2.5rem 0;
            background-color: var(--color-gray-50);
            border-radius: 0.5rem;
            transition: background-color 200ms ease-in-out;
        }
        .upload-label:hover { background-color: var(--color-gray-100); }
        .upload-text-strong {
            font-weight: 500;
            color: #4b5563;
        }
        .upload-text-file {
            color: var(--color-indigo-600);
            font-weight: 700;
        }
        .upload-text-muted {
            color: #9ca3af;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        .upload-icon {
            width: 2rem;
            height: 2rem;
            margin: 0 auto 0.5rem;
            color: #9ca3af;
        }

        .submit-button {
            width: 100%;
            margin-top: 1rem;
            padding: 0.75rem 0;
            border-radius: 0.75rem;
            font-weight: 700;
            font-size: 1.125rem;
            transition: all 300ms ease-in-out;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-white);
            background-color: var(--color-indigo-600);
            border: none;
            cursor: pointer;
        }
        .submit-button:hover:not(:disabled) {
            background-color: var(--color-indigo-700);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
        }
        .submit-button:disabled {
            background-color: #a5b4fc;
            cursor: not-allowed;
        }
        .submit-button > svg {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.5rem;
        }

        .preview-container { margin-bottom: 1rem; }
        .preview-label {
            font-size: 1rem;
            font-weight: 500;
            color: #4b5563;
            margin-bottom: 0.5rem;
        }
        .preview-box {
            width: 100%;
            height: 12rem;
            background-color: #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--color-gray-300);
        }
        .preview-placeholder { color: #9ca3af; }
        .preview-image {
            object-fit: cover;
            width: 100%;
            height: 100%;
        }

        .status-message {
            padding: 0.75rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            font-weight: 500;
        }
        .status-message > svg {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.5rem;
        }
        .status-error {
            background-color: var(--color-red-100);
            color: var(--color-red-700);
        }
        .status-info {
            background-color: #e0e7ff;
            color: var(--color-indigo-700);
        }

        .result-card {
            margin-top: 2rem;
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transition: all 300ms ease-in-out;
            border-left-width: 8px;
            border-style: solid;
        }
        .result-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
        }
        .result-title-text {
            margin-left: 0.75rem;
            color: var(--color-gray-800);
        }
        .result-details {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .result-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
        }
        .result-row-border { border-bottom: 1px solid var(--color-gray-300); }
        .result-label {
            font-size: 1.125rem;
            font-weight: 600;
            color: #4b5563;
        }
        .result-value {
            font-size: 1.25rem;
            font-weight: 800;
        }
        .result-value-indigo {
            font-weight: 700;
            color: var(--color-indigo-700);
        }

        .confidence-bar-container {
            width: 100%;
            height: 0.75rem;
            margin-top: 1rem;
            border-radius: 9999px;
            background-color: #e5e7eb;
            overflow: hidden;
        }
        .confidence-bar-fill {
            height: 100%;
            transition: width 500ms ease-out;
        }
        
        .loader-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .icon-sm {
            width: 1.25rem;
            height: 1.25rem;
        }
      `}</style>
      
      <div className="main-card">
        <header className="header">
          <div className="header-icon mx-auto mb-3">
            <IconBrain className="header-icon" strokeWidth={2.5} />
          </div>
          <h1 className="header-title">
            NeuroGuard
          </h1>
          <p className="header-subtitle">
            Upload an MRI image for automated Brain tumor detection and classification.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="form-grid">
          <section className="section-upload">
            <h2 className="section-title">
              <IconUpload className="icon-sm mr-2" />
              1. Upload MRI Scan
            </h2>
            
            <label htmlFor="file-upload" className="upload-label">
              {selectedFile ? (
                <p className="upload-text-strong">File Selected: <span className="upload-text-file">{selectedFile.name}</span></p>
              ) : (
                <>
                  <IconUpload className="upload-icon" />
                  <p className="upload-text-strong" style={{ color: '#4b5563' }}>Click to upload or drag & drop</p>
                  <p className="upload-text-muted">PNG, JPG, or JPEG (Max 10MB)</p>
                </>
              )}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <button type="submit" disabled={loading || !selectedFile} className="submit-button">
              {loading ? (
                <>
                  <IconLoader className="icon-sm mr-2 loader-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <IconCpu className="icon-sm mr-2" />
                  Run Diagnosis
                </>
              )}
            </button>
          </section>

          <section className="section-results">
            <h2 className="section-title section-title-results">
              <IconCheckCircle className="icon-sm mr-2" />
              2. Review & Diagnosis
            </h2>

            <div className="preview-container">
              <h3 className="preview-label">Image Preview:</h3>
              <div className="preview-box">
                {previewUrl ? (
                  <img src={previewUrl} alt="MRI Preview" className="preview-image" />
                ) : (
                  <p className="preview-placeholder">Preview Area</p>
                )}
              </div>
            </div>

            {error && (
              <div className="status-message status-error">
                <IconXCircle className="icon-sm mr-2" />
                <span style={{ fontWeight: 700 }}>Error:</span> {error}
              </div>
            )}

            {prediction && <ResultDisplay result={prediction} />}

            {!loading && !prediction && !error && (
                 <div className="status-message status-info">
                    <IconBrain className="icon-sm mr-2" />
                    Upload an image and click "Run Diagnosis" to begin analysis.
                </div>
            )}
          </section>
        </form>
      </div>
    </div>
  );
};

export default App;