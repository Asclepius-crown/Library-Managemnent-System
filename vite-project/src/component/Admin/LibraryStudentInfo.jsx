import React, { useState } from "react";
import { useStudents } from "../../context/StudentContext";

function LibraryStudentInfo() {
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents();

  const [newStudent, setNewStudent] = useState({
    rollNo: "",
    name: "",
    department: "",
    yearOfStudy: "",
    admissionYear: "",
    email: "",
  });

  const [editingRollNo, setEditingRollNo] = useState(null);
  const [editData, setEditData] = useState({});

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (Object.values(newStudent).some((v) => !v.trim())) {
      alert("Fill all fields");
      return;
    }
    addStudent(newStudent);
    setNewStudent({ rollNo: "", name: "", department: "", yearOfStudy: "", admissionYear: "", email: "" });
  };

  const handleSaveEdit = () => {
    updateStudent(editingRollNo, editData);
    setEditingRollNo(null);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="bg-blue-600 text-white p-4 rounded text-center mb-6">
        <h1 className="text-3xl font-bold">Student Information</h1>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {["rollNo", "name", "department", "yearOfStudy", "admissionYear", "email"].map((field) => (
          <input
            key={field}
            type={field.includes("Year") ? "number" : field === "email" ? "email" : "text"}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={newStudent[field]}
            onChange={(e) => setNewStudent({ ...newStudent, [field]: e.target.value })}
            className="border p-2 rounded"
          />
        ))}
        <button type="submit" className="md:col-span-6 bg-green-600 hover:bg-green-700 text-white py-2 rounded">
          Add Student
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Year</th>
              <th>Admission</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4">No students</td>
              </tr>
            ) : students.map((s) =>
              editingRollNo === s.rollNo ? (
                <tr key={s.rollNo} className="bg-yellow-100">
                  {["rollNo", "name", "department", "yearOfStudy", "admissionYear", "email"].map((field) => (
                    <td key={field}>
                      <input
                        type={field.includes("Year") ? "number" : field === "email" ? "email" : "text"}
                        value={editData[field]}
                        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={handleSaveEdit} className="bg-green-600 text-white px-2 py-1 rounded mr-1">Save</button>
                    <button onClick={() => setEditingRollNo(null)} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.rollNo} className="hover:bg-gray-100">
                  <td>{s.rollNo}</td>
                  <td>{s.name}</td>
                  <td>{s.department}</td>
                  <td>{s.yearOfStudy}</td>
                  <td>{s.admissionYear}</td>
                  <td>{s.email}</td>
                  <td>
                    <button onClick={() => { setEditingRollNo(s.rollNo); setEditData(s); }} className="bg-blue-500 text-white px-2 py-1 rounded mr-1">Edit</button>
                    <button onClick={() => deleteStudent(s.rollNo)} className="bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LibraryStudentInfo;
