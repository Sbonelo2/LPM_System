
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import PdfViewer from './PdfViewer'

interface Document {
  id: string
  file_name: string
  file_url: string
  created_at: string
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error: unknown) {
      console.error('Error fetching documents:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem 0'
      }}>
        Loading documents...
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>
        Uploaded Documents
      </h2>

      {documents.length === 0 ? (
        <p style={{
          color: '#6b7280',
          textAlign: 'center',
          padding: '2rem 0'
        }}>
          No documents uploaded yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {documents.map((doc) => (
            <div key={doc.id} style={{
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {doc.file_name}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocument(doc)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  View PDF
                </button>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    fontSize: '0.875rem',
                    textDecoration: 'underline'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#1d4ed8'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#2563eb'}
                >
                  Open in new tab
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <PdfViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}
