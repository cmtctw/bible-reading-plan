import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BIBLE_BOOKS, TOTAL_CHAPTERS } from './constants';
import { ProgressMap, Testament } from './types';
import { BookCard } from './components/BookCard';
import { ProgressBar } from './components/ProgressBar';

const STORAGE_KEY = 'bible_tracker_progress_v1';

export default function App() {
  const [progress, setProgress] = useState<ProgressMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [filter, setFilter] = useState<Testament | 'ALL'>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleChapter = (bookName: string, chapter: number) => {
    const key = `${bookName}-${chapter}`;
    setProgress(prev => {
      const newState = { ...prev };
      if (newState[key]) {
        delete newState[key];
      } else {
        newState[key] = true;
      }
      return newState;
    });
  };

  const toggleBookProgress = (bookName: string, totalChapters: number, completed: boolean) => {
    setProgress(prev => {
      const newState = { ...prev };
      for (let i = 1; i <= totalChapters; i++) {
        const key = `${bookName}-${i}`;
        if (completed) {
          newState[key] = true;
        } else {
          delete newState[key];
        }
      }
      return newState;
    });
  };

  const toggleBookExpansion = (bookName: string) => {
    setExpandedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookName)) {
        newSet.delete(bookName);
      } else {
        newSet.add(bookName);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    setExpandedBooks(new Set(BIBLE_BOOKS.map(b => b.name)));
  };

  const handleCollapseAll = () => {
    setExpandedBooks(new Set());
  };

  const handleClearAll = () => {
    if (window.confirm("確定要全部清除嗎？此操作無法復原。\nAre you sure you want to clear all progress?")) {
      setProgress({});
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bible-progress-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        if (typeof parsedData === 'object' && parsedData !== null) {
          if (window.confirm("確定要載入進度檔嗎？目前的進度將會被覆蓋。\nAre you sure you want to import? Current progress will be overwritten.")) {
             setProgress(parsedData);
             alert("進度載入完成！");
          }
        } else {
          alert("檔案格式錯誤");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("載入失敗：檔案格式錯誤");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const totalCompleted = Object.keys(progress).length;
  
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter(book => {
      const matchesTestament = filter === 'ALL' || book.testament === filter;
      
      if (!matchesTestament) return false;

      if (showUnreadOnly) {
        let completedInBook = 0;
        for(let i=1; i<=book.chapters; i++) {
          if (progress[`${book.name}-${i}`]) completedInBook++;
        }
        return completedInBook < book.chapters;
      }

      return true;
    });
  }, [filter, showUnreadOnly, progress]);

  return (
    <div className="min-h-screen pb-20 bg-[#F7F5F0]">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-red-700 tracking-tight">聖經閱讀進度調查表</h1>
              <p className="text-sm text-stone-500 mt-1 font-light">追蹤您的讀經之旅</p>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={handleImportClick}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                載入進度
              </button>
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                匯出進度
              </button>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4 mb-5 border border-stone-100">
             <ProgressBar 
               current={totalCompleted} 
               total={TOTAL_CHAPTERS} 
               label="總進度" 
             />
             <div className="flex justify-between text-sm text-stone-500 mt-1">
               <span>已讀章節: {totalCompleted}</span>
               <span>剩餘章節: {TOTAL_CHAPTERS - totalCompleted}</span>
             </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'ALL' ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}
              >
                全部
              </button>
              <button 
                onClick={() => setFilter(Testament.OLD)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === Testament.OLD ? 'bg-amber-700 text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}
              >
                舊約
              </button>
              <button 
                onClick={() => setFilter(Testament.NEW)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === Testament.NEW ? 'bg-emerald-700 text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'}`}
              >
                新約
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 select-none">
                <input 
                  type="checkbox" 
                  checked={showUnreadOnly} 
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-gray-300"
                />
                <span className="text-sm text-stone-700">只顯示未讀</span>
              </label>

              <div className="h-5 w-px bg-stone-300 hidden md:block mx-1"></div>

              <button onClick={handleExpandAll} className="text-stone-500 hover:text-stone-800 text-sm font-medium px-2 py-1">展開全部</button>
              <button onClick={handleCollapseAll} className="text-stone-500 hover:text-stone-800 text-sm font-medium px-2 py-1">收合全部</button>
              
              <div className="h-5 w-px bg-stone-300 hidden md:block mx-1"></div>
              
              <button onClick={handleClearAll} className="text-red-400 hover:text-red-600 text-sm font-medium px-2 py-1">全部清除</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard 
                key={book.name} 
                book={book} 
                progress={progress} 
                onToggle={toggleChapter}
                onToggleBook={toggleBookProgress}
                isExpanded={expandedBooks.has(book.name)}
                onToggleExpand={() => toggleBookExpansion(book.name)}
              />
            ))
          ) : (
             <div className="col-span-full text-center py-20 bg-white rounded-xl border border-stone-200 border-dashed">
               <p className="text-base text-stone-400">沒有符合條件的書卷</p>
               <button onClick={() => {setFilter('ALL'); setShowUnreadOnly(false);}} className="mt-2 text-emerald-600 font-medium text-sm hover:underline">顯示全部</button>
             </div>
          )}
        </div>
      </main>
      
      <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-stone-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Bible Journey Tracker. Soli Deo Gloria.</p>
      </footer>
    </div>
  );
}