/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axiosClient";   

const StudentContext = createContext();
export const useStudents = () => useContext(StudentContext);

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch {
      setError("Failed to fetch students");
    }
    setLoading(false);
  };

  const addStudent = async (student) => {
    try {
      const res = await api.post("/students", student);
      setStudents((prev) => [...prev, res.data]);
    } catch {
      setError("Failed to add student");
    }
  };

  const updateStudent = async (rollNo, updatedData) => {
    try {
      const res = await api.put(`/students/${rollNo}`, updatedData);
      setStudents((prev) => prev.map((s) => s.rollNo === rollNo ? res.data : s));
    } catch {
      setError("Failed to update student");
    }
  };

  const deleteStudent = async (rollNo) => {
    if (!window.confirm("Delete student?")) return;
    try {
      await api.delete(`/students/${rollNo}`);
      setStudents((prev) => prev.filter((s) => s.rollNo !== rollNo));
    } catch {
      setError("Failed to delete student");
    }
  };

  const fetchStudentById = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      return res.data;
    } catch {
      setError("Failed to fetch student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <StudentContext.Provider value={{ students, loading, error, addStudent, updateStudent, deleteStudent, fetchStudentById }}>
      {children}
    </StudentContext.Provider>
  );
};
