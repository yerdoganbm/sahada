import React from 'react';
import { Icon } from '../components/Icon';

interface CustomerManagementProps {
  onBack: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ onBack }) => {
  return (
    <div className="pb-8 bg-secondary min-h-screen">
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 px-4 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Icon name="arrow_back" className="text-white" />
          </button>
          <h1 className="text-xl font-black text-white">Müşteri Yönetimi</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="text-center py-12">
          <Icon name="groups" size={64} className="text-primary mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Müşteri Listesi</h3>
          <p className="text-slate-400 text-sm">Sadık müşteri programı yakında eklenecek</p>
        </div>
      </div>
    </div>
  );
};
