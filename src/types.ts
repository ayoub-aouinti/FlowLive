export interface User {
  _id: string;
  id?: string;
  name: string;
  role?: string;
  email?: string;
  departmentId?: string | null;
  isVerified?: boolean;
}

export interface Department {
  id: string;
  name: string;
  adminId: string;
  products: string[];
  types: string[];
  activePages?: string[];
  coverUrl?: string | null;
  logoUrl?: string | null;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'checkbox' | 'user' | 'product' | 'projectType';
  required: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  initiatorName: string;
  description: string;
  type: string;
  product: string;
  status: 'Nouveau' | 'En cours' | 'En révision' | 'Terminé';
  priority: 'Basse' | 'Moyenne' | 'Haute';
  urgent: boolean;
  deadline: string;
  assignedTo?: string | User;
  createdAt: string;
  departmentId?: string;
  _customFields?: Record<string, unknown>;
}

export type ViewType = 
  | 'table' 
  | 'kanban' 
  | 'timeline' 
  | 'calendrier' 
  | 'reporting' 
  | 'urgences' 
  | 'demarrer' 
  | 'stats'
  | 'cockpit'
  | 'dept_cockpit';

export interface NavigationContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
  selectedDepartmentId: string | null;
  setSelectedDepartmentId: (id: string | null) => void;
}
