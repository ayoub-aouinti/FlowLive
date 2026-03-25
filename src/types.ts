export interface User {
  _id: string;
  name: string;
  role?: string;
  email?: string;
}

export interface Project {
  _id: string;
  name: string;
  initiatorName: string;
  description: string;
  type: 'Marketing' | 'Développement' | 'Design' | 'Interne';
  product: string;
  status: 'Nouveau' | 'En cours' | 'En révision' | 'Terminé';
  priority: 'Basse' | 'Moyenne' | 'Haute';
  urgent: boolean;
  deadline: string;
  assignedTo?: string | User;
  createdAt: string;
}

export type ViewType = 
  | 'table' 
  | 'kanban' 
  | 'timeline' 
  | 'calendrier' 
  | 'reporting' 
  | 'urgences' 
  | 'demarrer' 
  | 'stats';

export interface NavigationContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
}
