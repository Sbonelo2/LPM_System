import { supabase } from './supabaseClient';

export interface LearnerProfile {
  id: string;
  user_id: string;
  learner_name: string;
  learner_identifier?: string;
  email: string;
  learner_address?: string;
  learner_address_city?: string;
  learner_address_province?: string;
  learner_address_postal_code?: string;
  learner_phone?: string;
  programme: string;
  specialization?: string;
  profile_image_url?: string;
  status: 'active' | 'inactive' | 'suspended' | 'graduated' | 'on_leave';
  enrollment_date: string;
  gpa?: number;
  academic_year?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnerPlacement {
  id: string;
  learner_id: string;
  host_id: string;
  mentor_id?: string;
  facilitator_id?: string;
  program: string;
  specialization?: string;
  status: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled' | 'terminated';
  start_date?: string;
  end_date?: string;
  host_name?: string;
  mentor_name?: string;
}

export interface LearnerDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  document_type: string;
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  created_at: string;
}

export interface LearnerStats {
  totalPlacements: number;
  activePlacements: number;
  pendingPlacements: number;
  completedPlacements: number;
  documentsUploaded: number;
  documentsPending: number;
  profileComplete: boolean;
}

class LearnerService {
  
  // ========================================
  // PROFILE OPERATIONS
  // ========================================

  async getProfile(userId: string): Promise<LearnerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching learner profile:', error);
      return null;
    }
  }

  async updateProfile(profile: Partial<LearnerProfile> & { user_id: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('learner_profiles')
        .upsert({
          ...profile,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating learner profile:', error);
      return false;
    }
  }

  // ========================================
  // PLACEMENT OPERATIONS
  // ========================================

  async getPlacements(learnerId: string): Promise<LearnerPlacement[]> {
    try {
      const { data, error } = await supabase
        .from('learner_placements')
        .select(`
          id,
          learner_id,
          host_id,
          mentor_id,
          facilitator_id,
          program,
          specialization,
          status,
          start_date,
          end_date,
          hosts(name),
          mentor_profiles(mentor_name)
        `)
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        host_name: p.hosts?.name,
        mentor_name: p.mentor_profiles?.mentor_name
      }));
    } catch (error) {
      console.error('Error fetching placements:', error);
      return [];
    }
  }

  async getPlacementById(placementId: string): Promise<LearnerPlacement | null> {
    try {
      const { data, error } = await supabase
        .from('learner_placements')
        .select('*')
        .eq('id', placementId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching placement:', error);
      return null;
    }
  }

  // ========================================
  // DOCUMENT OPERATIONS
  // ========================================

  async getDocuments(userId: string): Promise<LearnerDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async uploadDocument(
    userId: string,
    file: File,
    documentType: string
  ): Promise<{ success: boolean; document?: LearnerDocument; error?: string }> {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          user_id: userId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: fileExt,
          document_type: documentType,
          review_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, document: data };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteDocument(documentId: string, filePath: string): Promise<boolean> {
    try {
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([filePath]);

      // Delete record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================

  async getDashboardStats(userId: string): Promise<LearnerStats> {
    try {
      // Get learner profile
      const { data: profile } = await supabase
        .from('learner_profiles')
        .select('id, learner_name, programme')
        .eq('user_id', userId)
        .single();

      // Get placements
      const { data: placements, count: totalPlacements } = await supabase
        .from('learner_placements')
        .select('*', { count: 'exact' })
        .eq('learner_id', profile?.id);

      const activePlacements = placements?.filter(p => p.status === 'active').length || 0;
      const pendingPlacements = placements?.filter(p => p.status === 'pending').length || 0;
      const completedPlacements = placements?.filter(p => p.status === 'completed').length || 0;

      // Get documents
      const { data: documents, count: documentsUploaded } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      const documentsPending = documents?.filter(d => d.review_status === 'pending').length || 0;

      // Check profile completion
      const profileComplete = !!(
        profile?.learner_name && 
        profile?.programme
      );

      return {
        totalPlacements: totalPlacements || 0,
        activePlacements,
        pendingPlacements,
        completedPlacements,
        documentsUploaded: documentsUploaded || 0,
        documentsPending,
        profileComplete
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalPlacements: 0,
        activePlacements: 0,
        pendingPlacements: 0,
        completedPlacements: 0,
        documentsUploaded: 0,
        documentsPending: 0,
        profileComplete: false
      };
    }
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  async getNotifications(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // ========================================
  // UTILITY
  // ========================================

  async getMentorshipSessions(learnerId: string) {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select(`
          *,
          mentor_profiles(mentor_name)
        `)
        .eq('learner_id', learnerId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  async getFacilitatorActivities(learnerId: string) {
    try {
      // Get learner's facilitator from placements
      const { data: placements } = await supabase
        .from('learner_placements')
        .select('facilitator_id')
        .eq('learner_id', learnerId)
        .eq('status', 'active');

      const facilitatorIds = placements?.map(p => p.facilitator_id).filter(Boolean);

      if (!facilitatorIds?.length) return [];

      const { data, error } = await supabase
        .from('facilitator_activities')
        .select(`
          *,
          facilitator_profiles(facilitator_name)
        `)
        .in('facilitator_id', facilitatorIds)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }
}

export const learnerService = new LearnerService();
export default learnerService;
