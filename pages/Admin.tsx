
import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { UserRole, MagazineIssue } from '../types';
import { 
  LayoutDashboard, FileText, Book, Image as ImageIcon, Settings, Users, 
  Plus, Edit, Trash2, FileUp, Loader2, Wand2, EyeOff, Lock, CheckCircle2, 
  Globe, X, FileType, CheckCircle, Info
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Admin: React.FC = () => {
  const { 
    news, magazines, ads, users, currentUser, 
    updateMagazine, addMagazine, deleteNews, deleteMagazine
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'magazines' | 'ads' | 'users' | 'settings'>('dashboard');
  
  // PDF Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'IDLE' | 'UPLOADING' | 'CONVERTING' | 'CONFIGURING'>('IDLE');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Issue Form State
  const [newIssue, setNewIssue] = useState<Partial<MagazineIssue>>({
    title: '',
    issueNumber: '',
    priceDigital: 0,
    pricePhysical: 499,
    gatedPage: 2,
    isFree: false,
    blurPaywall: false
  });

  if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MAGAZINE)) {
    return <Navigate to="/" replace />;
  }

  const isMaster = currentUser.role === UserRole.ADMIN;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      startProcessing(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const startProcessing = (file: File) => {
    setUploadStep('UPLOADING');
    setIsUploading(true);
    setUploadProgress(0);

    // Step 1: Upload Simulation
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setUploadProgress(100);
        
        // Transition to Conversion
        setTimeout(() => {
          setUploadStep('CONVERTING');
          setUploadProgress(0);
          startConversionSimulation();
        }, 800);
      }
      setUploadProgress(Math.floor(progress));
    }, 200);
  };

  const startConversionSimulation = () => {
    let progress = 0;
    const convertInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(convertInterval);
        setUploadProgress(100);
        
        // Transition to Configuration
        setTimeout(() => {
          setUploadStep('CONFIGURING');
          setNewIssue(prev => ({
            ...prev,
            title: selectedFile?.name.replace('.pdf', '') || '',
            issueNumber: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }));
        }, 1000);
      }
      setUploadProgress(Math.floor(progress));
    }, 300);
  };

  const finalizeUpload = () => {
    const mag: MagazineIssue = {
      id: 'm' + Date.now(),
      title: newIssue.title || 'Untitled Issue',
      issueNumber: newIssue.issueNumber || 'Current',
      coverImage: 'https://picsum.photos/400/600?random=' + Math.random(),
      pages: Array(12).fill(0).map((_, i) => `https://picsum.photos/800/1200?random=${200+i}`),
      date: new Date().toISOString().split('T')[0],
      priceDigital: newIssue.priceDigital || 0,
      pricePhysical: newIssue.pricePhysical || 499,
      gatedPage: newIssue.gatedPage || 2,
      isFree: newIssue.isFree || false,
      blurPaywall: newIssue.blurPaywall || false,
    };

    addMagazine(mag);
    resetUpload();
    setActiveTab('magazines');
  };

  const resetUpload = () => {
    setIsUploading(false);
    setUploadStep('IDLE');
    setUploadProgress(0);
    setSelectedFile(null);
  };

  const handleUpdateGatedPage = (id: string, value: string) => {
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum)) updateMagazine(id, { gatedPage: pageNum });
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#001f3f] to-[#800000] p-8 rounded-3xl text-white shadow-xl">
        <h1 className="text-3xl font-black serif mb-2">Welcome back, {currentUser.name}!</h1>
        <p className="text-blue-100">Master admin dashboard - Monitor your digital magazine empire</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Book className="text-[#800000]" size={24} />
            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Active Issues</p>
          <h3 className="text-3xl font-black text-[#001f3f] serif">{magazines.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-[#001f3f]" size={24} />
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">+8%</span>
          </div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Total Subscribers</p>
          <h3 className="text-3xl font-black text-[#001f3f] serif">{users.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <FileText className="text-[#800000]" size={24} />
            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">+5%</span>
          </div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">News Articles</p>
          <h3 className="text-3xl font-black text-[#001f3f] serif">{news.length}</h3>
        </div>
        <div className="bg-[#001f3f] p-6 rounded-3xl text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Settings className="text-blue-300" size={24} />
            <span className="text-xs font-bold text-green-300 bg-green-200/20 px-2 py-1 rounded-full">99.9%</span>
          </div>
          <p className="text-[10px] font-black uppercase text-blue-300 tracking-[0.2em] mb-1">System Health</p>
          <h3 className="text-3xl font-black serif">Online</h3>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-[#001f3f] serif mb-6">Subscription Growth</h3>
          <div className="space-y-4">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
              <div key={month} className="flex items-center space-x-4">
                <span className="w-12 text-sm font-bold text-gray-600">{month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[#800000] to-[#001f3f] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${20 + i * 15}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm font-bold text-[#001f3f]">{20 + i * 5}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-[#001f3f] serif mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('magazines')}
              className="p-4 bg-[#800000] text-white rounded-2xl hover:bg-red-800 transition-all flex flex-col items-center space-y-2"
            >
              <FileUp size={24} />
              <span className="text-xs font-bold uppercase">Upload PDF</span>
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className="p-4 bg-[#001f3f] text-white rounded-2xl hover:bg-blue-800 transition-all flex flex-col items-center space-y-2"
            >
              <Plus size={24} />
              <span className="text-xs font-bold uppercase">Add News</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className="p-4 bg-gray-800 text-white rounded-2xl hover:bg-gray-700 transition-all flex flex-col items-center space-y-2"
            >
              <Users size={24} />
              <span className="text-xs font-bold uppercase">Manage Users</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all flex flex-col items-center space-y-2"
            >
              <Settings size={24} />
              <span className="text-xs font-bold uppercase">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#001f3f] serif">Recent Activity</h3>
          <button className="text-xs font-black uppercase tracking-widest text-[#800000]">View All &rarr;</button>
        </div>
        <div className="space-y-4">
          {[
            { action: 'New magazine uploaded', time: '2 hours ago', type: 'success' },
            { action: 'User subscription renewed', time: '4 hours ago', type: 'info' },
            { action: 'News article published', time: '1 day ago', type: 'success' },
            { action: 'System backup completed', time: '2 days ago', type: 'warning' }
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600' :
                  activity.type === 'info' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <CheckCircle size={16} />
                </div>
                <span className="font-bold text-sm text-[#001f3f]">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-400 font-bold">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMagazines = () => (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#001f3f] serif">Flipbook Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your digital press triggers and premium access rules.</p>
        </div>
        <div className="flex space-x-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#800000] text-white px-8 py-4 rounded-2xl flex items-center space-x-3 hover:bg-red-800 transition-all shadow-xl shadow-red-900/20"
          >
            <FileUp size={20} />
            <span className="font-bold text-sm uppercase tracking-widest">Upload PDF Issue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {magazines.map(m => (
          <div key={m.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 group">
            <div className="w-44 shrink-0 relative overflow-hidden rounded-3xl shadow-xl">
               <img src={m.coverImage} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-2">
              <div>
                <h4 className="text-xl font-bold text-[#001f3f] serif leading-tight">{m.title}</h4>
                <div className="flex items-center space-x-3 mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Globe size={14} />
                  <span>{m.pages.length} Pages</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-6">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <label className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">
                    <Lock size={12} className="mr-2" /> Sub Trigger
                  </label>
                  <input 
                    type="number" 
                    value={m.gatedPage} 
                    onChange={(e) => handleUpdateGatedPage(m.id, e.target.value)}
                    className="w-full bg-white px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#800000] focus:ring-2 focus:ring-[#800000] outline-none"
                  />
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col justify-between">
                  <label className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">
                    <ImageIcon size={12} className="mr-2" /> Access
                  </label>
                  <button 
                    onClick={() => updateMagazine(m.id, { isFree: !m.isFree })}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      m.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {m.isFree ? 'PUBLIC' : 'PREMIUM'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button className="p-3 bg-gray-100 text-[#001f3f] hover:bg-blue-900 hover:text-white rounded-xl transition-all"><Edit size={18} /></button>
                  <button onClick={() => deleteMagazine(m.id)} className="p-3 bg-red-50 text-[#800000] hover:bg-red-800 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                </div>
                <button className="text-[11px] font-black uppercase tracking-widest text-[#800000] hover:underline">View Analytics</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative">
            <button onClick={resetUpload} className="absolute top-8 right-8 text-gray-400 hover:text-red-600 transition-colors">
              <X size={24} />
            </button>

            <div className="p-12">
              {uploadStep === 'UPLOADING' && (
                <div className="text-center space-y-8 animate-in zoom-in">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Loader2 size={48} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#001f3f] serif">Uploading Press Copy</h3>
                    <p className="text-gray-400 mt-2">Transmitting "{selectedFile?.name}" to high-speed storage.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{uploadProgress}% Complete</p>
                  </div>
                </div>
              )}

              {uploadStep === 'CONVERTING' && (
                <div className="text-center space-y-8 animate-in zoom-in">
                  <div className="w-24 h-24 bg-red-50 text-[#800000] rounded-3xl flex items-center justify-center mx-auto shadow-inner relative">
                    <Wand2 size={48} className="animate-bounce" />
                    <div className="absolute inset-0 bg-red-400/20 blur-xl rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#001f3f] serif">Converting PDF to Press Images</h3>
                    <p className="text-gray-400 mt-2">Our AI is extracting high-resolution page assets for the 3D Flipbook.</p>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-center space-x-3">
                        <span className={`w-3 h-3 rounded-full ${uploadProgress > 25 ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <span className={`w-3 h-3 rounded-full ${uploadProgress > 50 ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <span className={`w-3 h-3 rounded-full ${uploadProgress > 75 ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <span className={`w-3 h-3 rounded-full ${uploadProgress === 100 ? 'bg-red-500' : 'bg-gray-200'}`} />
                     </div>
                     <p className="text-xs font-black text-[#800000] uppercase tracking-widest">Rendering Page {Math.floor(uploadProgress / 8)} / 12</p>
                  </div>
                </div>
              )}

              {uploadStep === 'CONFIGURING' && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center space-x-4 mb-10">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#001f3f] serif">Conversion Successful</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">12 Assets Extracted & Linked</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Issue Title</label>
                        <input 
                          type="text" 
                          value={newIssue.title}
                          onChange={e => setNewIssue({...newIssue, title: e.target.value})}
                          className="w-full bg-gray-50 px-5 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-[#800000] outline-none text-sm font-bold"
                          placeholder="e.g. The AI Revolution"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Issue Date/Volume</label>
                        <input 
                          type="text" 
                          value={newIssue.issueNumber}
                          onChange={e => setNewIssue({...newIssue, issueNumber: e.target.value})}
                          className="w-full bg-gray-50 px-5 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-[#800000] outline-none text-sm font-bold"
                          placeholder="e.g. December 2024"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Subscription Rule</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setNewIssue({...newIssue, isFree: true})}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newIssue.isFree ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                          >
                            Public
                          </button>
                          <button 
                            onClick={() => setNewIssue({...newIssue, isFree: false})}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!newIssue.isFree ? 'bg-amber-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
                          >
                            Premium
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Trigger Gated Page</label>
                        <input 
                          type="number" 
                          value={newIssue.gatedPage}
                          onChange={e => setNewIssue({...newIssue, gatedPage: parseInt(e.target.value)})}
                          className="w-full bg-gray-50 px-5 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-[#800000] outline-none text-sm font-bold"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="blurPaywall"
                          checked={newIssue.blurPaywall}
                          onChange={e => setNewIssue({...newIssue, blurPaywall: e.target.checked})}
                          className="w-4 h-4 text-[#800000] bg-gray-100 border-gray-300 rounded focus:ring-[#800000] focus:ring-2"
                        />
                        <label htmlFor="blurPaywall" className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Enable Blur Paywall</label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center space-x-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <Info className="text-blue-600 shrink-0" size={24} />
                    <p className="text-[10px] text-blue-800 font-bold leading-relaxed">
                      Confirming will immediately publish this issue to the live "Magazine" section. 
                      Ensure metadata matches the printed copy for consistency.
                    </p>
                  </div>

                  <button 
                    onClick={finalizeUpload}
                    className="w-full bg-[#800000] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-red-900/40 hover:bg-red-800 transition-all mt-8"
                  >
                    Publish to Digital Press
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 -mx-4 -my-8 md:-my-16 overflow-hidden">
      {/* Admin Sidebar */}
      <nav className="w-full md:w-72 bg-[#001f3f] text-white p-10 flex flex-col shrink-0">
        <div className="flex items-center space-x-4 mb-16">
          <div className="w-12 h-12 bg-[#800000] rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">VS</div>
          <h2 className="font-black text-xl serif">Master Panel</h2>
        </div>

        <div className="flex-1 space-y-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-[#800000]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </button>
          <button onClick={() => setActiveTab('magazines')} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'magazines' ? 'bg-[#800000]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Book size={20} />
            <span>Digital Library</span>
          </button>
          <button onClick={() => setActiveTab('news')} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'news' ? 'bg-[#800000]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <FileText size={20} />
            <span>News Editor</span>
          </button>
          {isMaster && (
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-[#800000]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Users size={20} />
              <span>CRM</span>
            </button>
          )}
        </div>
        
        <div className="pt-8 mt-8 border-t border-white/10">
          <button className="flex items-center space-x-4 px-6 py-4 text-gray-400 hover:text-white font-bold text-sm transition-colors">
            <Settings size={20} />
            <span>System Config</span>
          </button>
        </div>
      </nav>
      
      <main className="flex-1 p-12 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'magazines' && renderMagazines()}
        {['news', 'users', 'ads', 'settings'].includes(activeTab) && (
          <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-6">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <FileType size={40} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-[#001f3f] serif">Coming Soon</h3>
                <p className="text-gray-400 text-sm mt-1">This module is currently being optimized for high-performance press management.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
