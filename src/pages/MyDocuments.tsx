import React from "react";
import "./MyDocuments.css";
import Documents from "./Documents";

const MyDocuments: React.FC = () => {
  return (
    <div className="documents-container">
      <h1>Documents</h1>
      <Documents />
    </div>
  );
};

export default MyDocuments;
