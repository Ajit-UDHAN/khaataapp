import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  User, 
  Bell, 
  Shield, 
  Download, 
  Upload,
  Trash2,
  Save,
  Edit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BusinessProfileSetup from './BusinessProfileSetup';

const Settings: React.FC = () => {
  const { user, businessProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'notifications' | 'data'>('business');
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  const tabs = [
    { id: 'business', name: 'Business Profile', icon: Store },
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'data', name: 'Data Management', icon: Shield }
  ];

  const exportData = () => {
    if (!user) return;
    
    const data = {
      products: JSON.parse(localStorage.getItem(`${user.id}_products`) || '[]'),
      customers: JSON.parse(localStorage.getItem(`${user.id}_customers`) || '[]'),
      invoices: JSON.parse(localStorage.getItem(`${user.id}_invoices`) || '[]'),
      expenses: JSON.parse(localStorage.getItem(`${user.id}_expenses`) || '[]'),
      businessProfile: businessProfile,
      userId: user.id,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopmanager-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Verify the data belongs to the current user or ask for confirmation
        if (data.userId && data.userId !== user.id) {
          if (!confirm('This backup is from a different user account. Import anyway?')) {
            return;
          }
        }
        
        if (confirm('This will replace all your current data. Are you sure?')) {
          if (data.products) localStorage.setItem(`${user.id}_products`, JSON.stringify(data.products));
          if (data.customers) localStorage.setItem(`${user.id}_customers`, JSON.stringify(data.customers));
          if (data.invoices) localStorage.setItem(`${user.id}_invoices`, JSON.stringify(data.invoices));
          if (data.expenses) localStorage.setItem(`${user.id}_expenses`, JSON.stringify(data.expenses));
          
          alert('Data imported successfully! Please refresh the page.');
          window.location.reload();
        }
      } catch (error) {
        alert('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (!user) return;
    
    if (confirm('This will permanently delete all your data. This action cannot be undone. Are you sure?')) {
      if (confirm('Are you absolutely sure? This will delete all products, customers, invoices, and expenses.')) {
        // Clear only current user's data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${user.id}_`)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        alert('All your data has been cleared. Please refresh the page.');
        window.location.reload();
      }
    }
  };

  if (showBusinessForm) {
    return <BusinessProfileSetup />;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <img src="/KHA.jpg" alt="KHAATA" className="w-8 h-8 rounded mr-3" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                <button
                  onClick={() => setShowBusinessForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              {businessProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                    <p className="text-gray-900 font-semibold">{businessProfile.shopName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <p className="text-gray-900">{businessProfile.contactNumber}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <p className="text-gray-900">{businessProfile.businessAddress}</p>
                  </div>
                  {businessProfile.gstNumber && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <p className="text-gray-900">{businessProfile.gstNumber}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Profile</h3>
                  <p className="text-gray-600 mb-4">Set up your business profile to get started</p>
                  <button
                    onClick={() => setShowBusinessForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    Setup Business Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 font-semibold">{user?.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                {user?.phone && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <p className="text-gray-900">{new Date(user?.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Low Stock Alerts</h4>
                    <p className="text-sm text-gray-600">Get notified when products are running low</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Daily Sales Summary</h4>
                    <p className="text-sm text-gray-600">Receive daily sales reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Credit Reminders</h4>
                    <p className="text-sm text-gray-600">Remind about pending customer credits</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Data */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Download className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">Export Data</h4>
                      <p className="text-sm text-gray-600">Download a backup of all your data</p>
                    </div>
                  </div>
                  <button
                    onClick={exportData}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors duration-200"
                  >
                    Export Backup
                  </button>
                </div>

                {/* Import Data */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">Import Data</h4>
                      <p className="text-sm text-gray-600">Restore data from a backup file</p>
                    </div>
                  </div>
                  <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center">
                    Import Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Clear Data */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">Clear All Data</h4>
                    <p className="text-sm text-gray-600">Permanently delete all your data. This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  onClick={clearAllData}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;