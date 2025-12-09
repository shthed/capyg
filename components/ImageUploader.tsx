import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  onImageSelected: (file: File) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<Props> = ({ onImageSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    onImageSelected(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full bg-slate-700/50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-500/20`}>
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isProcessing ? 'Processing Image...' : 'Upload your photo'}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              Drag and drop your image here, or click to browse. We'll turn it into a paint-by-numbers masterpiece.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        {[
          { icon: ImageIcon, title: "Any Photo", desc: "Portraits, pets, or landscapes" },
          { icon: Upload, title: "Instant", desc: "Client-side processing" },
          { icon: Loader2, title: "AI Powered", desc: "Smart analysis & fun facts" }
        ].map((item, i) => (
          <div key={i} className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
            <item.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <h4 className="text-white font-medium text-sm">{item.title}</h4>
            <p className="text-slate-500 text-xs">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUploader;
