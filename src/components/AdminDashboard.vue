<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="admin-header">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-md-6">
            <h1 class="admin-title">
              <i class="fas fa-user-shield me-2"></i>
              Admin Dashboard
            </h1>
            <p class="admin-subtitle">Manage Teacher Accounts</p>
          </div>
          <div class="col-md-6 text-end">
            <button 
              class="btn btn-primary btn-lg"
              @click="showAddTeacherModal = true"
            >
              <i class="fas fa-plus me-2"></i>
              Add New Teacher
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="container-fluid mt-4">
      <div class="row">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalTeachers }}</h3>
              <p>Total Teachers</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.activeTeachers }}</h3>
              <p>Active Teachers</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="fas fa-key"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.pendingPasswordChange }}</h3>
              <p>Pending Setup</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="fas fa-calendar-plus"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.recentlyAdded }}</h3>
              <p>Added This Week</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Teachers Table -->
    <div class="container-fluid mt-4">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fas fa-users me-2"></i>
            Teachers Management
          </h5>
          <div class="d-flex gap-2">
            <select 
              class="form-select form-select-sm"
              v-model="filterStatus"
              @change="filterTeachers"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input 
              type="text" 
              class="form-control form-control-sm"
              placeholder="Search teachers..."
              v-model="searchQuery"
              @input="filterTeachers"
            >
          </div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading teachers...</p>
          </div>
          
          <div v-else-if="filteredTeachers.length === 0" class="text-center py-4">
            <i class="fas fa-users fa-3x text-muted mb-3"></i>
            <h5>No Teachers Found</h5>
            <p class="text-muted">{{ searchQuery ? 'No teachers match your search criteria.' : 'Start by adding your first teacher.' }}</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Institution</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Setup Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in filteredTeachers" :key="teacher.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="teacher-avatar me-2">
                        {{ teacher.name.charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <strong>{{ teacher.name }}</strong>
                        <br>
                        <small class="text-muted">ID: {{ teacher.employeeId || 'N/A' }}</small>
                      </div>
                    </div>
                  </td>
                  <td>{{ teacher.email }}</td>
                  <td>{{ teacher.institution }}</td>
                  <td>{{ teacher.department || 'N/A' }}</td>
                  <td>
                    <span 
                      :class="['badge', teacher.isActive ? 'bg-success' : 'bg-secondary']"
                    >
                      {{ teacher.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <span 
                      :class="['badge', teacher.passwordChanged ? 'bg-success' : 'bg-warning']"
                    >
                      {{ teacher.passwordChanged ? 'Complete' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <small>{{ formatDate(teacher.createdAt) }}</small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary"
                        @click="viewTeacher(teacher)"
                        title="View Details"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                      <button 
                        class="btn btn-outline-warning"
                        @click="editTeacher(teacher)"
                        title="Edit"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        class="btn btn-outline-danger"
                        @click="confirmDeactivate(teacher)"
                        :disabled="!teacher.isActive"
                        title="Deactivate"
                      >
                        <i class="fas fa-user-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Teacher Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showAddTeacherModal }" 
      :style="{ display: showAddTeacherModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-plus me-2"></i>
              Add New Teacher
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="closeAddTeacherModal"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addTeacher">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Full Name *</label>
                    <input 
                      type="text" 
                      class="form-control"
                      v-model="newTeacher.name"
                      required
                      placeholder="Enter teacher's full name"
                    >
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Email Address *</label>
                    <input 
                      type="email" 
                      class="form-control"
                      v-model="newTeacher.email"
                      required
                      placeholder="teacher@institution.edu"
                    >
                  </div>
                </div>
              </div>
              
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Default Settings:</strong>
                <ul class="mb-0 mt-2">
                  <li>Temporary password will be set to: <code>teacher123</code></li>
                  <li>Teacher can update their profile and change password after first login</li>
                  <li>Additional details (institution, department, etc.) can be added later</li>
                </ul>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeAddTeacherModal"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary"
              @click="addTeacher"
              :disabled="addingTeacher"
            >
              <span v-if="addingTeacher" class="spinner-border spinner-border-sm me-2"></span>
              {{ addingTeacher ? 'Adding...' : 'Add Teacher' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div 
      class="modal fade" 
      :class="{ show: showSuccessModal }" 
      :style="{ display: showSuccessModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="fas fa-check-circle me-2"></i>
              Teacher Added Successfully
            </h5>
          </div>
          <div class="modal-body">
            <p><strong>Teacher Details:</strong></p>
            <ul class="list-unstyled">
              <li><strong>Name:</strong> {{ createdTeacher.name }}</li>
              <li><strong>Email:</strong> {{ createdTeacher.email }}</li>
              <li><strong>Institution:</strong> {{ createdTeacher.institution }}</li>
            </ul>
            <div class="alert alert-warning">
              <i class="fas fa-key me-2"></i>
              <strong>Temporary Password:</strong> 
              <code class="ms-2">{{ createdTeacher.tempPassword }}</code>
              <br>
              <small>Please share this with the teacher for initial login. They will be required to change it on first login.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-success" 
              @click="showSuccessModal = false"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div 
      v-if="showAddTeacherModal || showSuccessModal" 
      class="modal-backdrop fade show"
      @click="closeModals"
    ></div>
  </div>
</template>

<script>
import { adminAPI } from '@/services/api';
import sessionService from '../services/sessionService';
import { auth } from '../firebase/init';
import { onAuthStateChanged } from 'firebase/auth';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      // Admin info
      adminId: null, // Will be set from authentication
      currentUser: null,
      currentSession: null,
      
      // UI State
      loading: true,
      addingTeacher: false,
      showAddTeacherModal: false,
      showSuccessModal: false,
      
      // Data
      teachers: [],
      filteredTeachers: [],
      stats: {
        totalTeachers: 0,
        activeTeachers: 0,
        pendingPasswordChange: 0,
        recentlyAdded: 0
      },
      
      // Filters
      searchQuery: '',
      filterStatus: '',
      
      // Forms
      newTeacher: {
        name: '',
        email: ''
      },
      
      createdTeacher: {}
    };
  },
  
  async mounted() {
    // Set up Firebase Auth state listener
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        
        // Get admin session from Firestore
        const adminSession = await sessionService.getAdminSession();
        if (adminSession) {
          this.currentSession = adminSession;
          this.adminId = adminSession.adminData.adminId;
          await this.loadTeachers();
        } else {
          // If no valid session, redirect to login
          console.log("No valid admin session found");
          this.$router.push('/login');
        }
      } else {
        // User not authenticated, redirect to login
        this.$router.push('/login');
      }
    });
  },
  
  methods: {
    async loadTeachers() {
      try {
        this.loading = true;
        const response = await adminAPI.getTeachers(this.adminId);
        
        if (response.success) {
          this.teachers = response.data;
          this.filteredTeachers = [...this.teachers];
          this.calculateStats();
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
        this.$toast?.error?.('Failed to load teachers');
      } finally {
        this.loading = false;
      }
    },
    
    calculateStats() {
      this.stats.totalTeachers = this.teachers.length;
      this.stats.activeTeachers = this.teachers.filter(t => t.isActive).length;
      this.stats.pendingPasswordChange = this.teachers.filter(t => !t.passwordChanged).length;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      this.stats.recentlyAdded = this.teachers.filter(t => 
        new Date(t.createdAt) > oneWeekAgo
      ).length;
    },
    
    filterTeachers() {
      let filtered = [...this.teachers];
      
      // Filter by status
      if (this.filterStatus) {
        filtered = filtered.filter(teacher => 
          this.filterStatus === 'active' ? teacher.isActive : !teacher.isActive
        );
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(teacher =>
          teacher.name.toLowerCase().includes(query) ||
          teacher.email.toLowerCase().includes(query) ||
          teacher.institution.toLowerCase().includes(query) ||
          (teacher.department && teacher.department.toLowerCase().includes(query))
        );
      }
      
      this.filteredTeachers = filtered;
    },
    
    async addTeacher() {
      try {
        this.addingTeacher = true;
        
        const teacherData = {
          ...this.newTeacher,
          adminId: this.adminId
        };
        
        const response = await adminAPI.createTeacher(teacherData);
        
        if (response.success) {
          this.createdTeacher = response.data;
          this.showAddTeacherModal = false;
          this.showSuccessModal = true;
          
          // Reload teachers list
          await this.loadTeachers();
          
          // Reset form
          this.resetNewTeacherForm();
        }
      } catch (error) {
        console.error('Error adding teacher:', error);
        const message = error.message || 'Failed to add teacher';
        this.$toast?.error?.(message);
      } finally {
        this.addingTeacher = false;
      }
    },
    
    resetNewTeacherForm() {
      this.newTeacher = {
        name: '',
        email: ''
      };
    },
    
    closeAddTeacherModal() {
      this.showAddTeacherModal = false;
      this.resetNewTeacherForm();
    },
    
    closeModals() {
      this.showAddTeacherModal = false;
      this.showSuccessModal = false;
    },
    
    viewTeacher(teacher) {
      // Implement view teacher details
      console.log('View teacher:', teacher);
    },
    
    editTeacher(teacher) {
      // Implement edit teacher
      console.log('Edit teacher:', teacher);
    },
    
    confirmDeactivate(teacher) {
      if (confirm(`Are you sure you want to deactivate ${teacher.name}?`)) {
        this.deactivateTeacher(teacher.id);
      }
    },
    
    async deactivateTeacher(teacherId) {
      try {
        const response = await adminAPI.deactivateTeacher(teacherId, this.adminId);
        
        if (response.success) {
          this.$toast?.success?.('Teacher deactivated successfully');
          await this.loadTeachers();
        }
      } catch (error) {
        console.error('Error deactivating teacher:', error);
        const message = error.message || 'Failed to deactivate teacher';
        this.$toast?.error?.(message);
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
}

.admin-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.admin-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 0;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: white;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.stat-content p {
  margin-bottom: 0;
  color: #6c757d;
  font-weight: 500;
}

.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card-header {
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
  border-radius: 12px 12px 0 0 !important;
  padding: 1.25rem;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
  background-color: #f8f9fa;
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

.modal-content {
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modal-header {
  border-bottom: 1px solid #e9ecef;
  border-radius: 12px 12px 0 0;
}

.form-label {
  font-weight: 600;
  color: #495057;
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.alert-warning {
  border-left: 4px solid #ffc107;
}

code {
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>