import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import Button from "./Button";
import Card from "./Card";
import "./DocumentChecklist.css";

interface RequiredDocument {
  id: string;
  title: string;
  description: string;
  document_type: string;
  is_required: boolean;
  category: string;
}

interface DocumentChecklistItem extends RequiredDocument {
  is_uploaded: boolean;
  uploaded_document_id?: string;
  upload_date?: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
}

const DocumentChecklist: React.FC = () => {
  const { user } = useAuth();
  const [checklistItems, setChecklistItems] = useState<DocumentChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Define required documents for learners
  const requiredDocuments: RequiredDocument[] = [
    {
      id: '1',
      title: 'ID Copy',
      description: 'Clear copy of your South African ID document or passport',
      document_type: 'ID_COPY',
      is_required: true,
      category: 'Identification'
    },
    {
      id: '2',
      title: 'Matric Certificate',
      description: 'Your National Senior Certificate or equivalent qualification',
      document_type: 'MATRIC_CERTIFICATE',
      is_required: true,
      category: 'Education'
    },
    {
      id: '3',
      title: 'Tertiary Qualification',
      description: 'Degree, diploma or certificate from tertiary institution',
      document_type: 'TERTIARY_QUALIFICATION',
      is_required: true,
      category: 'Education'
    },
    {
      id: '4',
      title: 'Proof of Address',
      description: 'Recent utility bill or bank statement (not older than 3 months)',
      document_type: 'PROOF_OF_ADDRESS',
      is_required: true,
      category: 'Verification'
    },
    {
      id: '5',
      title: 'Timesheet Template',
      description: 'Completed timesheet showing work experience hours',
      document_type: 'TIMESHEET',
      is_required: false,
      category: 'Workplace'
    },
    {
      id: '6',
      title: 'Evidence of Work',
      description: 'Portfolio or evidence of completed work/projects',
      document_type: 'EVIDENCE',
      is_required: false,
      category: 'Workplace'
    }
  ];

  useEffect(() => {
    if (user) {
      loadDocumentChecklist();
    }
  }, [user]);

  // Listen for refresh events from Documents component
  useEffect(() => {
    const handleRefreshChecklist = () => {
      console.log('Received refresh checklist event');
      loadDocumentChecklist();
    };

    window.addEventListener('refreshChecklist', handleRefreshChecklist);
    
    return () => {
      window.removeEventListener('refreshChecklist', handleRefreshChecklist);
    };
  }, [user]);

  const loadDocumentChecklist = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's uploaded documents (only their personal documents)
      const { data: uploadedDocs, error: docsError } = await supabase
        .from('documents')
        .select('id, document_type, file_name, created_at, review_status, document_scope, uploaded_by, file_url')
        .eq('user_id', user.id)
        .not('file_url', 'is', null) // Ensure file_url is not null
        .not('file_url', 'eq', ''); // Ensure file_url is not empty string

      if (docsError) throw docsError;

      // Create checklist with upload status
      const checklist: DocumentChecklistItem[] = requiredDocuments.map(requiredDoc => {
        // Find uploaded document that matches the required type
        const uploadedDoc = uploadedDocs?.find(doc => 
          doc.document_type === requiredDoc.document_type &&
          doc.file_url && // Ensure file_url exists
          doc.file_url.trim() !== '' // Ensure file_url is not empty
        );

        return {
          ...requiredDoc,
          is_uploaded: !!uploadedDoc && !!uploadedDoc.file_url && uploadedDoc.file_url.trim() !== '',
          uploaded_document_id: uploadedDoc?.id,
          upload_date: uploadedDoc?.created_at,
          status: uploadedDoc?.review_status || 'pending'
        };
      });

      setChecklistItems(checklist);
    } catch (error) {
      console.error('Failed to load document checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = (documentType: string) => {
    console.log('Upload button clicked for:', documentType);
    
    // Navigate to upload section or open upload modal
    const uploadPanel = document.querySelector('.upload-panel');
    if (uploadPanel) {
      uploadPanel.scrollIntoView({ behavior: 'smooth' });
      
      // Set the document type in the upload form
      const selectElement = document.getElementById('document-type-select') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = documentType;
        selectElement.dispatchEvent(new Event('change'));
        console.log('Document type set to:', documentType);
      }
    } else {
      console.log('Upload panel not found');
    }
  };

  const handleViewDocument = async (documentId: string, documentType: string) => {
    console.log('View document clicked:', documentId, documentType);
    
    try {
      // Get the document details from the database
      const { data: document, error } = await supabase
        .from('documents')
        .select('id, file_name, file_url, created_at, document_type')
        .eq('id', documentId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      console.log('Found document:', document);
      
      // Create a custom event to trigger the PDF viewer
      const viewEvent = new CustomEvent('viewDocument', {
        detail: {
          id: document.id,
          file_name: document.file_name,
          file_url: document.file_url,
          created_at: document.created_at
        }
      });
      
      // Dispatch the event to be caught by the Documents component
      window.dispatchEvent(viewEvent);
      
      console.log('Dispatched view event for:', document.file_name);
      
    } catch (error) {
      console.error('Error viewing document:', error);
      alert(`Failed to view document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    setRefreshing(true);
    await loadDocumentChecklist();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'uploaded':
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'uploaded':
      case 'pending':
        return 'Under Review';
      default:
        return 'Pending';
    }
  };

  const getCompletionPercentage = () => {
    if (checklistItems.length === 0) return 0;
    const uploadedCount = checklistItems.filter(item => item.is_uploaded).length;
    return Math.round((uploadedCount / checklistItems.length) * 100);
  };

  const getRequiredCount = () => {
    return checklistItems.filter(item => item.is_required && !item.is_uploaded).length;
  };

  if (loading) {
    return (
      <Card className="document-checklist">
        <div className="checklist-loading">
          <p>Loading document checklist...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="document-checklist">
      <div className="checklist-header">
        <h3>Required Documents</h3>
        <div className="header-actions">
          <div className="completion-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            <span className="progress-text">
              {getCompletionPercentage()}% Complete
            </span>
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh document list"
          >
            {refreshing ? '⟳' : '↻'}
          </button>
        </div>
      </div>

      {getRequiredCount() > 0 && (
        <div className="required-notice">
          <span className="warning-icon">⚠️</span>
          <span>
            You have {getRequiredCount()} required document{getRequiredCount() !== 1 ? 's' : ''} to upload
          </span>
        </div>
      )}

      <div className="checklist-items">
        {checklistItems.map((item) => (
          <div key={item.id} className={`checklist-item ${item.is_uploaded ? 'uploaded' : 'pending'}`}>
            <div className="item-info">
              <div className="item-header">
                <div className="item-title">
                  <span className={`checkbox ${item.is_uploaded ? 'checked' : ''}`}>
                    {item.is_uploaded ? '✓' : ''}
                  </span>
                  <h4>{item.title}</h4>
                  {item.is_required && <span className="required-badge">Required</span>}
                </div>
                {item.is_uploaded && (
                  <div className="status-indicator">
                    <span 
                      className="status-dot" 
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    />
                    <span className="status-text">{getStatusText(item.status)}</span>
                  </div>
                )}
              </div>
              <p className="item-description">{item.description}</p>
              
              {/* Real Data Info */}
              <div className="item-data-info" style={{ 
                background: '#f0f9ff', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '8px',
                fontSize: '11px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📋 Data Details:</div>
                <div>Document Type: {item.document_type}</div>
                <div>Uploaded: {item.is_uploaded ? 'Yes' : 'No'}</div>
                {item.is_uploaded && (
                  <>
                    <div>Document ID: {item.uploaded_document_id}</div>
                    <div>Status: {item.status}</div>
                    {item.upload_date && <div>Upload Date: {new Date(item.upload_date).toLocaleString()}</div>}
                  </>
                )}
              </div>
              
              {item.is_uploaded && item.upload_date && (
                <p className="upload-date">
                  Uploaded on {new Date(item.upload_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="item-actions">
              {!item.is_uploaded ? (
                <Button
                  text="Upload Now"
                  className="upload-btn"
                  onClick={() => handleUploadDocument(item.document_type)}
                  disabled={uploadingDoc === item.id}
                />
              ) : (
                <Button
                  text="View Document"
                  className="view-btn"
                  onClick={() => handleViewDocument(item.uploaded_document_id!, item.document_type)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DocumentChecklist;
