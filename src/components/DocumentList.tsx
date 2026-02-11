
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import PdfViewer from './PdfViewer'
import { useAuth } from '../hooks/useAuth'

interface Document {
  id: string
  file_name: string
  file_url: string
  created_at: string
  user_id: string
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    console.log('DocumentList: User changed:', user?.id)
    if (user) {
      fetchDocuments()
    } else {
      // Clear documents when user logs out
      setDocuments([])
      setLoading(false)
    }
  }, [user])

  const fetchDocuments = async () => {
    if (!user) {
      console.log('DocumentList: No user, skipping fetch')
      return
    }
    
    console.log('DocumentList: Fetching documents for user:', user.id)
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('DocumentList: Supabase error:', error)
        throw error
      }
      
      console.log('DocumentList: Fetched documents:', data?.length || 0)
      setDocuments(data || [])
    } catch (error: unknown) {
      console.error('DocumentList: Error fetching documents:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false)
    }
  }

  // Expose refreshDocuments for parent components
  useEffect(() => {
    // Make refreshDocuments available globally for UploadDocument component
    (window as any).refreshDocuments = fetchDocuments
    return () => {
      delete (window as any).refreshDocuments
    }
  }, [user])

  const handleDeleteDocument = async (document: Document) => {
    if (!user) return
    
    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete "${document.file_name}"? This action cannot be undone.`)
    if (!confirmDelete) return
    
    try {
      console.log('Deleting document:', document.file_name, 'ID:', document.id)
      console.log('Current user ID:', user.id)
      console.log('Document user_id:', document.user_id)
      console.log('Full file URL:', document.file_url)
      
      // Check if user owns this document
      if (document.user_id !== user.id) {
        throw new Error('You can only delete your own documents')
      }
      
      // First, let's verify the document actually exists before deleting
      const { data: existingDoc, error: checkError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', document.id)
        .eq('user_id', user.id) // Ensure we're checking user's own document
        .single()
      
      if (checkError) {
        console.log('Document check error:', checkError)
        throw new Error(`Cannot find document: ${checkError.message}`)
      } else {
        console.log('Document exists before deletion:', existingDoc)
      }
      
      // Delete from database with explicit user_id filter
      const { error: dbError, data: dbData } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)
        .eq('user_id', user.id) // Critical: ensure we're deleting user's own document
        .select()
      
      if (dbError) {
        console.error('Error deleting from database:', dbError)
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }
      
      console.log('Delete operation result:', dbData)
      
      // Verify the document is actually gone
      const { data: verifyDoc, error: verifyError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', document.id)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (verifyError) {
        console.log('Verification error:', verifyError)
      } else {
        console.log('Document after deletion check:', verifyDoc)
        if (verifyDoc) {
          console.error('DOCUMENT STILL EXISTS IN DATABASE!')
          console.error('This is likely an RLS (Row Level Security) policy issue')
          throw new Error('Document deletion verification failed - document still exists. Check Supabase RLS policies.')
        } else {
          console.log('✓ Document successfully removed from database')
        }
      }
      
      // Try to delete from storage (but don't worry if it fails)
      try {
        const urlParts = document.file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `${user.id}/${fileName}`
        
        console.log('Attempting storage deletion:', filePath)
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath])
        
        if (storageError) {
          console.log('Storage deletion failed (but database deletion worked):', storageError.message)
        } else {
          console.log('✓ Storage deletion succeeded')
        }
      } catch (storageErr) {
        console.log('Storage deletion error (ignoring):', storageErr)
      }
      
      // Remove from local state immediately
      setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== document.id))
      
      alert('Document deleted successfully!')
      
      // Force a refresh after a short delay to ensure everything is synced
      setTimeout(() => {
        console.log('Forcing document list refresh...')
        fetchDocuments()
      }, 1000)
      
    } catch (error: unknown) {
      console.error('Error deleting document:', error instanceof Error ? error.message : 'Unknown error')
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Refresh the list if deletion failed
      fetchDocuments()
    }
  }
  useEffect(() => {
    // Make refreshDocuments available globally for UploadDocument component
    (window as any).refreshDocuments = fetchDocuments
    return () => {
      delete (window as any).refreshDocuments
    }
  }, [user])

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

  if (!user) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem 0',
        color: '#6b7280'
      }}>
        Please log in to view documents.
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
                <div style={{ display: 'flex', gap: '10px' }}>
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
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                  >
                    Delete
                  </button>
                </div>
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
