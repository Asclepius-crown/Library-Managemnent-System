// import React, { useState } from "react";
// import axios from "axios";

// /**
//  * BulkBookUpload - For importing CSV or XLSX files!
//  * Sends file directly to the backend, which does the parsing and validation.
//  */
// const BulkBookUpload = ({ onDone }) => {
//   // File chosen by user
//   const [file, setFile] = useState(null);
//   // Is upload in progress?
//   const [uploading, setUploading] = useState(false);
//   // Backend API response/summary
//   const [result, setResult] = useState(null);
//   // For human error, like "no file selected" etc
//   const [error, setError] = useState("");

//   // When user selects file
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//     setError("");
//     setResult(null);
//   };

//   // Handles upload (triggered by button)
//   const handleUpload = async () => {
//     if (!file) {
//       setError("Please select a CSV or Excel (.xlsx) file first.");
//       return;
//     }

//     // Only allow csv/xlsx files
//     const allowedExt = ["csv", "xlsx"];
//     const ext = file.name.split(".").pop().toLowerCase();
//     if (!allowedExt.includes(ext)) {
//       setError("Only CSV or XLSX files are supported.");
//       return;
//     }

//     setUploading(true);
//     setError("");
//     setResult(null);

//     try {
//       const token = localStorage.getItem("token");
//       const formData = new FormData();
//       formData.append("file", file);

//       // POST file using form-data to the backend
//       const res = await axios.post(
//         "/books/upload",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data"
//           }
//         }
//       );
//       setResult(res.data);
//       if (onDone) onDone(); // Callback to parent can refresh table
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//         "Upload failed. Please check your file format."
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   // Render
//   return (
//     <div className="p-4 w-full max-w-lg mx-auto">
//       <h2 className="text-lg font-semibold mb-4">Bulk Book Upload</h2>

//       {/* File input */}
//       <input
//         type="file"
//         accept=".csv, .xlsx" // Accept both file types
//         onChange={handleFileChange}
//         className="block w-full mb-3 border border-gray-400 rounded p-2"
//       />

//       <button
//         onClick={handleUpload}
//         disabled={uploading}
//         className="bg-cyan-600 text-white px-4 py-2 rounded w-full mb-2 hover:bg-cyan-700 disabled:opacity-50"
//       >
//         {uploading ? "Uploading..." : "Upload"}
//       </button>

//       {/* Show errors */}
//       {error && <div className="text-red-500 mt-2">{error}</div>}

//       {/* Show backend "import summary" */}
//       {result && (
//         <div className="bg-gray-900 mt-4 p-3 rounded text-white">
//           <h3 className="font-semibold mb-2">Upload Summary</h3>
//           <div>Total Submitted: {result.totalSubmitted}</div>
//           <div>Inserted: {result.insertedCount}</div>
//           <div>Duplicates: {result.duplicateCount}</div>
//           <div>Invalid: {result.invalidCount}</div>
//           {result.invalidBooks?.length > 0 && (
//             <details className="mt-2">
//               <summary className="cursor-pointer">Invalid Rows</summary>
//               <pre className="text-xs">
//                 {JSON.stringify(result.invalidBooks, null, 2)}
//               </pre>
//             </details>
//           )}
//         </div>
//       )}

//       {/* Instructions */}
//       <div className="mt-4 text-xs text-gray-400">
//         <b>Supported columns:</b> Title, Author, Publication Count, Genre, Status, Height, Publisher, Location.<br />
//         (Column headers are case-insensitive. Required:&nbsp; Title, Author, Publication Count)
//         <br />You can upload CSV or Excel files.
//       </div>
//     </div>
//   );
// };

// export default BulkBookUpload;

import React, { useState } from "react";
import axios from "axios";

const BulkBookUpload = ({ onDone }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // File change handler
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setResult(null);
  };

  // Upload handler
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV or Excel file first.");
      return;
    }

    // Allow only specific extensions
    const allowedExt = ["csv", "xlsx", "xlsm"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExt.includes(ext)) {
      setError("Only CSV, XLSX, or XLSM files are supported.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in first.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file.name);

      const res = await axios.post(
        "http://localhost:5000/api/books/upload", // Full backend URL
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Upload successful:", res.data);
      setResult(res.data);
      if (onDone) onDone(); // Optional callback to refresh parent table
    } catch (err) {
      console.error("Upload error:", err.response || err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Upload failed. Please check your file format."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 w-full max-w-lg mx-auto border rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Bulk Book Upload</h2>

      {/* File input */}
      <input
        type="file"
        accept=".csv, .xlsx, .xlsm"
        onChange={handleFileChange}
        className="block w-full mb-3 border border-gray-400 rounded p-2"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-cyan-600 text-white px-4 py-2 rounded w-full mb-2 hover:bg-cyan-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {/* Error message */}
      {error && <div className="text-red-500 mt-2">{error}</div>}

      {/* Result summary */}
      {result && (
        <div className="bg-gray-900 mt-4 p-3 rounded text-white">
          <h3 className="font-semibold mb-2">Upload Summary</h3>
          <div>Total Submitted: {result.totalSubmitted}</div>
          <div>Inserted: {result.insertedCount}</div>
          <div>Duplicates: {result.duplicateCount}</div>
          <div>Invalid: {result.invalidCount}</div>
          {result.invalidBooks?.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer">Invalid Rows</summary>
              <pre className="text-xs bg-black p-2 rounded">
                {JSON.stringify(result.invalidBooks, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 text-xs text-gray-500">
        <b>Supported columns:</b> Title, Author, Publication Count, Genre,
        Status, Height, Publisher, Location.
        <br />
        Column headers are case-insensitive. Required: Title, Author,
        Publication Count.
        <br />
        Supports CSV, XLSX, XLSM files.
      </div>
    </div>
  );
};

export default BulkBookUpload;
