import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { MOCK_MATCHES } from '../constants';

interface SquadShareWizardProps {
  onBack: () => void;
}

export const SquadShareWizard: React.FC<SquadShareWizardProps> = ({ onBack }) => {
  const match = MOCK_MATCHES.find(m => m.status === 'upcoming') || MOCK_MATCHES[0];
  
  const defaultTemplate = `⚽ KADROLAR BELLİ OLDU!

📅 Tarih: {tarih}
⏰ Saat: {saat}
📍 Saha: {saha_adi}

---------------------
⚪ *BEYAZ TAKIM*
---------------------
{beyaz_takim}

---------------------
🔵 *MAVİ TAKIM*
---------------------
{mavi_takim}

sahada olalım! 🔥`;

  const [template, setTemplate] = useState(defaultTemplate);

  // Mock data for preview generation
  const previewData = {
    '{tarih}': match.date,
    '{saat}': match.time,
    '{saha_adi}': match.location,
    '{beyaz_takim}': '1. Ahmet (K)\n2. Mehmet (D)\n3. Can (O)\n4. Burak (F)\n5. Sinan (F)\n6. Ege (O)\n7. Mert (D)',
    '{mavi_takim}': '1. Hasan (K)\n2. Hüseyin (D)\n3. Ali (O)\n4. Kerem (F)\n5. Umut (F)\n6. Berk (O)\n7. Arda (D)',
    '{ucret}': `${match.pricePerPerson} TL`
  };

  const getPreviewText = () => {
    let text = template;
    Object.entries(previewData).forEach(([key, value]) => {
      text = text.replace(new RegExp(key, 'g'), value);
    });
    return text;
  };

  const insertTag = (tag: string) => {
    setTemplate(prev => prev + ' ' + tag);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPreviewText());
    alert('Kopyalandı!');
  };

  return (
    <div className="bg-secondary min-h-screen pb-safe-bottom flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-white/5 px-4 pt-4 pb-3 sticky top-0 z-50 safe-top flex justify-between items-center">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-white/5 active:scale-95 transition-transform">
             <Icon name="arrow_back" className="text-white" />
           </button>
           <div>
              <h1 className="font-bold text-white text-lg leading-tight">Kadro Paylaşım</h1>
              <p className="text-[10px] text-slate-400">WhatsApp Şablonu</p>
           </div>
        </div>
        <button 
           onClick={() => setTemplate(defaultTemplate)}
           className="text-primary text-xs font-bold hover:text-green-400 flex items-center gap-1"
        >
           <Icon name="restart_alt" size={14} /> Sıfırla
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
         {/* Editor Section */}
         <div className="space-y-3">
            <div className="flex items-center gap-2">
               <Icon name="edit_note" className="text-alert" size={20} />
               <h3 className="text-sm font-bold text-white">Taslağı Düzenle</h3>
            </div>
            
            {/* Tag Chips */}
            <div className="flex flex-wrap gap-2">
               {Object.keys(previewData).concat(['{ucret}']).map(tag => (
                  <button 
                     key={tag}
                     onClick={() => insertTag(tag)}
                     className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-[10px] font-bold hover:bg-orange-500/20 active:scale-95 transition-all"
                  >
                     {tag}
                  </button>
               ))}
            </div>

            <textarea 
               value={template}
               onChange={(e) => setTemplate(e.target.value)}
               className="w-full h-48 bg-surface border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
            
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-3 flex gap-3">
               <Icon name="info" className="text-orange-500 shrink-0" size={18} />
               <p className="text-[10px] text-slate-400 leading-tight">
                  Bu şablon, seçtiğiniz maçın güncel verilerini otomatik olarak çeker. "Kopyala" dediğinizde etiketler gerçek isimlerle değiştirilecektir.
               </p>
            </div>
         </div>

         {/* Preview Section */}
         <div className="space-y-3">
            <div className="flex items-center gap-2">
               <Icon name="visibility" className="text-green-500" size={20} />
               <h3 className="text-sm font-bold text-white">Canlı Önizleme</h3>
            </div>

            {/* Mobile Phone Frame */}
            <div className="relative mx-auto w-full max-w-[320px] bg-slate-900 rounded-[30px] border-4 border-slate-800 shadow-2xl overflow-hidden">
               {/* Phone Notch/Status Bar */}
               <div className="bg-[#075E54] h-14 flex items-center px-4 gap-3 text-white">
                  <Icon name="arrow_back" size={18} />
                  <div className="flex-1 flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                        <Icon name="sports_soccer" size={16} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">Halı Saha Grubu ⚽</span>
                        <span className="text-[8px] opacity-80 leading-none mt-0.5">çevrimiçi</span>
                     </div>
                  </div>
                  <Icon name="videocam" size={18} />
                  <Icon name="call" size={18} />
               </div>

               {/* Chat Area */}
               <div className="bg-[#e5ddd5] p-3 min-h-[350px] relative">
                   {/* Background Pattern Overlay (Simulated) */}
                   <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />
                   
                   <div className="relative z-10 flex flex-col gap-2">
                      <div className="self-center bg-[#dcf8c6] shadow-sm px-2 py-1 rounded-lg mb-2">
                         <span className="text-[10px] text-slate-600 font-bold">BUGÜN</span>
                      </div>
                      
                      {/* The Message Bubble */}
                      <div className="bg-white rounded-lg p-2 shadow-sm rounded-tr-none self-end max-w-[90%]">
                         <pre className="text-[10px] text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                            {getPreviewText()}
                         </pre>
                         <div className="text-[8px] text-slate-400 text-right mt-1 flex justify-end items-center gap-0.5">
                            14:53 <Icon name="done_all" size={10} className="text-blue-500" />
                         </div>
                      </div>
                   </div>
               </div>

               {/* Bottom Input Area (Visual Only) */}
               <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-2">
                  <div className="bg-white rounded-full flex-1 h-8 flex items-center px-3 gap-2">
                     <Icon name="emoji_emotions" className="text-slate-400" size={16} />
                     <span className="text-[10px] text-slate-400">Mesaj yaz...</span>
                     <div className="flex-1"></div>
                     <Icon name="attach_file" className="text-slate-400" size={16} />
                     <Icon name="camera_alt" className="text-slate-400" size={16} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00897b] flex items-center justify-center text-white shadow-sm">
                     <Icon name="mic" size={16} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="bg-surface border-t border-white/5 p-4 pb-safe safe-bottom z-50">
         <button 
            onClick={copyToClipboard}
            className="w-full bg-[#EA580C] hover:bg-[#c2410c] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
         >
            <Icon name="content_copy" size={20} />
            Kopyala ve WhatsApp'ta Paylaş
         </button>
         <p className="text-[9px] text-center text-slate-500 mt-2">Panoya kopyalanacak ve WhatsApp Web/App açılacaktır.</p>
      </div>
    </div>
  );
};