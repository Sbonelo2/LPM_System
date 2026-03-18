import React from "react";
import Documents from "./Documents";
import "./MyDocuments.css";

const MyDocuments: React.FC = () => {
  return (
    <div className="documents-container">
      <h1>Documents</h1>
      <Documents />
    </div>
  );
};

export default MyDocuments;
