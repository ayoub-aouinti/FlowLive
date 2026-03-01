import React, { useState } from 'react';
import { socket } from '../services/socket';
import { Send } from 'lucide-react';

const ProjectForm: React.FC = () => {
  const [formData, setFormData] = useState({
    initiatorName: '',
    name: '',
    description: '',
    type: 'Marketing',
    product: 'Catalog Item A',
    deadline: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.initiatorName && formData.name && formData.description && formData.deadline) {
      socket.emit('new_project', formData);
      setFormData({
        initiatorName: '',
        name: '',
        description: '',
        type: 'Marketing',
        product: 'Catalog Item A',
        deadline: ''
      });
      alert('Project submitted successfully! Notifications sent.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">New Project Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initiator Name*</label>
          <input
            type="text"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Your name"
            value={formData.initiatorName}
            onChange={(e) => setFormData({ ...formData, initiatorName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
          <input
            type="text"
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. Q1 Campaign"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
          <textarea
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Describe the workflow requirements..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
            <select
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Marketing">Marketing</option>
              <option value="Développement">Développement</option>
              <option value="Design">Design</option>
              <option value="Interne">Interne</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product*</label>
            <select
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            >
              <option value="Catalog Item A">Catalog Item A</option>
              <option value="Catalog Item B">Catalog Item B</option>
              <option value="Custom Solution">Custom Solution</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline*</label>
          <input
            type="date"
            min={today}
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-blue-200"
        >
          <Send size={20} />
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;
