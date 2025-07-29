import React, { useState, useRef, useCallback } from "react";
import { Upload, Plus, Trash2, Download } from "lucide-react";
import "./App.css";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [signatures, setSignatures] = useState([]);
  const [draggedSignature, setDraggedSignature] = useState(null);
  const [coordinateLog, setCoordinateLog] = useState([]);
  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setSignatures([]);
      setCoordinateLog([]);
    } else {
      alert("Please select a valid PDF file");
    }
  };

  const addSignaturePlaceholder = () => {
    const newSignature = {
      id: Date.now(),
      x: 50,
      y: 50,
      width: 150,
      height: 50,
      label: `Signature ${signatures.length + 1}`,
    };
    setSignatures([...signatures, newSignature]);
    logCoordinates(newSignature, "Added");
  };

  const logCoordinates = (signature, action) => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      id: signature.id,
      label: signature.label,
      x1: Math.round(signature.x),
      y1: Math.round(signature.y),
      x2: Math.round(signature.x + signature.width),
      y2: Math.round(signature.y + signature.height),
      width: signature.width,
      height: signature.height,
    };
    setCoordinateLog((prev) => [...prev, logEntry]);
  };

  const handleMouseDown = (e, signatureId) => {
    e.preventDefault();
    const signature = signatures.find((s) => s.id === signatureId);
    const rect = pdfContainerRef.current.getBoundingClientRect();

    const startX = e.clientX - rect.left - signature.x;
    const startY = e.clientY - rect.top - signature.y;

    setDraggedSignature({ id: signatureId, offsetX: startX, offsetY: startY });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!draggedSignature || !pdfContainerRef.current) return;

      const rect = pdfContainerRef.current.getBoundingClientRect();
      const newX = Math.max(
        0,
        Math.min(
          rect.width - 150,
          e.clientX - rect.left - draggedSignature.offsetX
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          rect.height - 50,
          e.clientY - rect.top - draggedSignature.offsetY
        )
      );

      setSignatures((prev) =>
        prev.map((sig) =>
          sig.id === draggedSignature.id ? { ...sig, x: newX, y: newY } : sig
        )
      );
    },
    [draggedSignature]
  );

  const handleMouseUp = useCallback(() => {
    if (draggedSignature) {
      const signature = signatures.find((s) => s.id === draggedSignature.id);
      if (signature) {
        logCoordinates(signature, "Moved");
      }
    }
    setDraggedSignature(null);
  }, [draggedSignature, signatures]);

  React.useEffect(() => {
    if (draggedSignature) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedSignature, handleMouseMove, handleMouseUp]);

  const removeSignature = (signatureId) => {
    const signature = signatures.find((s) => s.id === signatureId);
    if (signature) {
      logCoordinates(signature, "Removed");
    }
    setSignatures((prev) => prev.filter((sig) => sig.id !== signatureId));
  };

  const clearLog = () => {
    setCoordinateLog([]);
  };

  const exportLog = () => {
    const logData = coordinateLog
      .map(
        (entry) =>
          `${entry.timestamp} - ${entry.action}: ${entry.label} at (${entry.x1}, ${entry.y1}) to (${entry.x2}, ${entry.y2})`
      )
      .join("\n");

    const blob = new Blob([logData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature-coordinates.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            eSign Marker
          </h1>

          {/* Upload Section */}
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={20} />
              Upload PDF
            </button>
            {pdfFile && (
              <p className="mt-2 text-sm text-gray-600">
                Loaded: {pdfFile.name}
              </p>
            )}
          </div>

          {pdfUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={addSignaturePlaceholder}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Signature
                  </button>
                  <span className="text-sm text-gray-600">
                    {signatures.length} signature(s) placed
                  </span>
                </div>

                <div
                  ref={pdfContainerRef}
                  className="relative border-2 border-gray-300 rounded-lg bg-white overflow-hidden"
                  style={{ minHeight: "600px" }}
                >
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full absolute inset-0"
                    style={{ minHeight: "600px" }}
                    title="PDF Viewer"
                  />

                  {/* Signature Placeholders */}
                  {signatures.map((signature) => (
                    <div
                      key={signature.id}
                      className="absolute bg-yellow-200 border-2 border-yellow-400 rounded cursor-move flex items-center justify-between px-2 py-1 text-xs font-medium select-none"
                      style={{
                        left: signature.x,
                        top: signature.y,
                        width: signature.width,
                        height: signature.height,
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, signature.id)}
                    >
                      <span className="truncate">{signature.label}</span>
                      <button
                        onClick={() => removeSignature(signature.id)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coordinate Log */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Coordinate Log
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={exportLog}
                        disabled={coordinateLog.length === 0}
                        className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        <Download size={12} />
                        Export
                      </button>
                      <button
                        onClick={clearLog}
                        disabled={coordinateLog.length === 0}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {coordinateLog.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No actions logged yet
                      </p>
                    ) : (
                      coordinateLog.map((entry, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border text-xs"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-800">
                              {entry.label}
                            </span>
                            <span className="text-gray-500">
                              {entry.timestamp}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            <div className="font-medium text-blue-600 mb-1">
                              {entry.action}
                            </div>
                            <div>
                              Position: ({entry.x1}, {entry.y1})
                            </div>
                            <div>
                              Size: {entry.width} × {entry.height}
                            </div>
                            <div>
                              Bounds: ({entry.x1}, {entry.y1}) to ({entry.x2},{" "}
                              {entry.y2})
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {signatures.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Current Signatures
                      </h4>
                      {signatures.map((sig) => (
                        <div
                          key={sig.id}
                          className="text-xs text-blue-700 mb-1"
                        >
                          {sig.label}: ({Math.round(sig.x)}, {Math.round(sig.y)}
                          ) to ({Math.round(sig.x + sig.width)},{" "}
                          {Math.round(sig.y + sig.height)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!pdfUrl && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Upload a PDF file to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
