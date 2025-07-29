import React, { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Plus, Trash2, Download } from "lucide-react";
import "./App.css";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [signatures, setSignatures] = useState([]);
  const [draggedSignature, setDraggedSignature] = useState(null);
  const [coordinateLog, setCoordinateLog] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

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
      y: 100,
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

  const getContainerBounds = () => {
    if (!pdfContainerRef.current) return { width: 0, height: 0 };
    const rect = pdfContainerRef.current.getBoundingClientRect();
    return {
      width: pdfContainerRef.current.scrollWidth,
      height: pdfContainerRef.current.scrollHeight,
      rect,
    };
  };

  const handleMouseDown = (e, signatureId) => {
    e.preventDefault();
    e.stopPropagation();

    const signature = signatures.find((s) => s.id === signatureId);
    if (!signature) return;

    const containerBounds = getContainerBounds();
    const rect = containerBounds.rect;

    // Calculate offset from signature's top-left corner
    const offsetX =
      e.clientX - rect.left - signature.x + pdfContainerRef.current.scrollLeft;
    const offsetY =
      e.clientY - rect.top - signature.y + pdfContainerRef.current.scrollTop;

    dragOffset.current = { x: offsetX, y: offsetY };
    dragStartPos.current = { x: signature.x, y: signature.y };

    setDraggedSignature({
      id: signatureId,
      startX: signature.x,
      startY: signature.y,
    });
    setIsDragging(true);

    // Add global event listeners
    document.addEventListener("mousemove", handleMouseMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp, { passive: false });

    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!draggedSignature || !pdfContainerRef.current) return;

      e.preventDefault();

      const containerBounds = getContainerBounds();
      const rect = containerBounds.rect;

      // Calculate new position accounting for scroll
      const newX =
        e.clientX -
        rect.left -
        dragOffset.current.x +
        pdfContainerRef.current.scrollLeft;
      const newY =
        e.clientY -
        rect.top -
        dragOffset.current.y +
        pdfContainerRef.current.scrollTop;

      // Constrain within container bounds
      const constrainedX = Math.max(
        0,
        Math.min(containerBounds.width - 150, newX)
      );
      const constrainedY = Math.max(
        0,
        Math.min(containerBounds.height - 50, newY)
      );

      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        setSignatures((prev) =>
          prev.map((sig) =>
            sig.id === draggedSignature.id
              ? { ...sig, x: constrainedX, y: constrainedY }
              : sig
          )
        );
      });
    },
    [draggedSignature]
  );

  const handleMouseUp = useCallback(() => {
    if (draggedSignature) {
      const signature = signatures.find((s) => s.id === draggedSignature.id);
      if (signature) {
        // Only log if position actually changed
        const moved =
          signature.x !== dragStartPos.current.x ||
          signature.y !== dragStartPos.current.y;
        if (moved) {
          logCoordinates(signature, "Moved");
        }
      }
    }

    // Clean up
    setDraggedSignature(null);
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    // Remove global event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [draggedSignature, signatures, handleMouseMove]);

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const removeSignature = (signatureId, e) => {
    e.stopPropagation();
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
                  className="relative border-2 border-gray-300 rounded-lg bg-white overflow-auto"
                  style={{
                    height: "700px",
                    cursor: isDragging ? "grabbing" : "default",
                  }}
                  onScroll={() => {
                    // Force re-render to update signature positions on scroll
                    if (signatures.length > 0) {
                      setSignatures((prev) => [...prev]);
                    }
                  }}
                >
                  <iframe
                    src={pdfUrl}
                    className="w-full min-h-full block"
                    style={{
                      minHeight: "800px",
                      width: "100%",
                      border: "none",
                    }}
                    title="PDF Viewer"
                  />

                  {/* Signature Placeholders */}
                  {signatures.map((signature) => (
                    <div
                      key={signature.id}
                      className={`absolute bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-between px-2 py-1 text-xs font-medium select-none transition-all duration-75 ${
                        draggedSignature?.id === signature.id
                          ? "cursor-grabbing shadow-lg scale-105 z-50"
                          : "cursor-grab hover:shadow-md z-40"
                      }`}
                      style={{
                        left:
                          signature.x - pdfContainerRef.current?.scrollLeft ||
                          0,
                        top:
                          signature.y - pdfContainerRef.current?.scrollTop || 0,
                        width: signature.width,
                        height: signature.height,
                        transform:
                          draggedSignature?.id === signature.id
                            ? "rotate(2deg)"
                            : "rotate(0deg)",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, signature.id)}
                    >
                      <span className="truncate pointer-events-none">
                        {signature.label}
                      </span>
                      <button
                        onClick={(e) => removeSignature(signature.id, e)}
                        className="ml-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded p-1 transition-colors"
                        style={{ pointerEvents: "auto" }}
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
