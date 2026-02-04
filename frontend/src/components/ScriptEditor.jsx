import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, FileText } from 'lucide-react';
import { formatLine } from '../utils/formatUtils';
import StoryInsights from './StoryInsights';
import SourceMaterialDrawer from './SourceMaterialDrawer';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

console.log("ScriptEditor loaded.");

const generateId = () => Math.random().toString(36).substr(2, 9);

const ScriptEditor = ({ universeId, projectId }) => {
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'Scene Heading', text: 'INT. STARTING POINT - DAY' },
    { id: generateId(), type: 'Action', text: '' }
  ]);

  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [aiFeedbackMessages, setAiFeedbackMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logicScore, setLogicScore] = useState(null);
  const [sceneDynamics, setSceneDynamics] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const lastSavedBlocksRef = useRef(blocks);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [sourceContent, setSourceContent] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isMagicMenuOpen, setIsMagicMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const blockRefs = useRef({});

  const getDocumentRef = useCallback(() => {
    return doc(db, 'universes', universeId, 'projects', projectId, 'script', 'content');
  }, [universeId, projectId]);

  const getProjectRef = useCallback(() => {
    return doc(db, 'universes', universeId, 'projects', projectId);
  }, [universeId, projectId]);

  useEffect(() => {
    const fetchSourceMaterial = async () => {
      try {
        const projectRef = getProjectRef();
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSourceContent(data.source_material || data.bible_content || "No source material available.");
        }
      } catch (error) {
        console.error("Error loading source material:", error);
      }
    };
    fetchSourceMaterial();
  }, [getProjectRef]);

  const saveScriptToFirestore = useCallback(async (currentBlocks) => {
    setIsSaving(true);
    setIsSaved(false);
    try {
      const scriptRef = getDocumentRef();
      await setDoc(scriptRef, { blocks: currentBlocks });
      lastSavedBlocksRef.current = currentBlocks;
      setIsSaved(true);
    } catch (error) {
      console.error("Error saving script:", error);
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }, [getDocumentRef]);

  const loadScriptFromFirestore = useCallback(async () => {
    try {
      const scriptRef = getDocumentRef();
      const docSnap = await getDoc(scriptRef);
      if (docSnap.exists()) {
        const loadedBlocks = docSnap.data().blocks;
        if (loadedBlocks && Array.isArray(loadedBlocks) && loadedBlocks.length > 0) {
          setBlocks(loadedBlocks);
          lastSavedBlocksRef.current = loadedBlocks;
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error("Error loading script:", error);
    }
  }, [getDocumentRef]);

  useEffect(() => {
    loadScriptFromFirestore();
  }, [loadScriptFromFirestore]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (JSON.stringify(blocks) !== JSON.stringify(lastSavedBlocksRef.current)) {
        saveScriptToFirestore(blocks);
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [blocks, saveScriptToFirestore]);

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    setIsSaved(false);
  };

  const handleTextChange = (id, text, type) => {
    const { text: formattedText } = formatLine(type, text);
    updateBlock(id, { text: formattedText });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentBlock = blocks[index];
      let nextType = 'Action';
      if (currentBlock.type === 'Scene Heading') nextType = 'Action';
      if (currentBlock.type === 'Character') nextType = 'Dialogue';
      if (currentBlock.type === 'Dialogue') nextType = 'Character';
      if (currentBlock.type === 'Parenthetical') nextType = 'Dialogue';

      const newBlock = { id: generateId(), type: nextType, text: '' };
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
      setIsSaved(false);
      setTimeout(() => {
        if (blockRefs.current[newBlock.id]) blockRefs.current[newBlock.id].focus();
      }, 0);
    }
    if (e.key === 'Backspace' && blocks[index].text === '' && blocks.length > 1) {
      e.preventDefault();
      const newBlocks = blocks.filter(b => b.id !== blocks[index].id);
      setBlocks(newBlocks);
      setIsSaved(false);
      setTimeout(() => {
        const prevBlock = blocks[index - 1];
        if (prevBlock && blockRefs.current[prevBlock.id]) blockRefs.current[prevBlock.id].focus();
      }, 0);
    }
  };

  const handleFormatChange = (newFormat) => {
    if (focusedBlockId) {
      const block = blocks.find(b => b.id === focusedBlockId);
      if (block) {
        const { text: formattedText } = formatLine(newFormat, block.text);
        updateBlock(focusedBlockId, { type: newFormat, text: formattedText });
      }
    }
  };

  const handleInsertSourceMaterial = (text) => {
    const newBlock = { id: generateId(), type: 'Action', text: text };
    const newBlocks = [...blocks];
    let insertIndex = blocks.length;
    if (focusedBlockId) {
      const index = blocks.findIndex(b => b.id === focusedBlockId);
      if (index !== -1) insertIndex = index + 1;
    }
    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);
    setIsSaved(false);
  };

  const handleSuggestDialogue = async () => {
    setIsMagicMenuOpen(false);
    setIsGeneratingScene(true);
    try {
      const context = blocks.slice(-10).map(b => b.text).join('\n').slice(-1000);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/suggest_dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          context_lines: context,
          genre: "Drama",
          style: "Modern" 
        })
      });
      if (!response.ok) throw new Error('Failed to get suggestion');
      const data = await response.json();
      
      let newSuggestions = [];
      if (Array.isArray(data)) {
        newSuggestions = data;
      } else if (data.suggestions) {
        newSuggestions = data.suggestions;
      }

      if (newSuggestions.length > 0) {
        setSuggestions(newSuggestions);
        setIsSuggestionModalOpen(true);
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Dialogue suggestion failed.');
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleInsertSuggestion = (text) => {
    const newBlock = { id: generateId(), type: 'Dialogue', text: text };
    const newBlocks = [...blocks];
    
    let insertIndex = blocks.length;
    if (focusedBlockId) {
      const index = blocks.findIndex(b => b.id === focusedBlockId);
      if (index !== -1) insertIndex = index + 1;
    }
    
    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);
    setIsSaved(false);
    setIsSuggestionModalOpen(false);
    setSuggestions([]);
  };

  const handleMagicWand = async () => {
    setIsMagicMenuOpen(false);
    setIsGeneratingScene(true);
    try {
      const projectRef = getProjectRef();
      const projectSnap = await getDoc(projectRef);
      if (!projectSnap.exists()) throw new Error('Project not found');
      const projectData = projectSnap.data();
      const beatSheet = projectData.beat_sheet || {};
      const characters = projectData.characters || [];
      const characterNames = characters.map(char => char.name || 'Unknown');
      
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/generate_scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          beat_context: "Next Scene",
          characters: characterNames,
          game_theory_type: "Prisoner's Dilemma"
        })
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      const generatedBlocks = (data.blocks || []).map(block => ({ ...block, id: generateId() }));
      if (generatedBlocks.length > 0) {
        setBlocks(generatedBlocks);
        setIsSaved(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed: ${error.message}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleAnalyzeSceneRequest = useCallback(async (persona) => {
    setIsAnalyzing(true);
    setLogicScore(null);
    if (!isSaved) await saveScriptToFirestore(blocks);
    const scriptText = blocks.map(block => block.text).join('\n');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ persona, scene_text: scriptText, universe_name: universeId, project_id: projectId }),
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setAiFeedbackMessages((prev) => [...prev, `[AI] ${data.critique}`]);
      setLogicScore(data.score);
      if (data.tension_curve) {
        setSceneDynamics(data);
      }
    } catch (error) {
      console.error("Error:", error);
      setAiFeedbackMessages((prev) => [...prev, `[ERROR] Analysis failed.`]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, isSaved, saveScriptToFirestore, universeId, projectId]);

  // --- PAGINATION LOGIC ---
  const renderPages = () => {
    const LINES_PER_PAGE = 55; // Approx lines per page
    const pages = [];
    let currentPage = [];
    let currentLines = 0;

    blocks.forEach((block, index) => {
      // Estimate lines this block takes up (wrapping text)
      // Assuming avg 60 chars per line for Courier 12pt
      const estimatedLines = Math.max(1, Math.ceil(block.text.length / 60));
      
      // Add extra spacing for Scene Headings
      const spacing = block.type === 'Scene Heading' ? 2 : 1;

      if (currentLines + estimatedLines + spacing > LINES_PER_PAGE) {
        pages.push(currentPage);
        currentPage = [];
        currentLines = 0;
      }

      currentPage.push({ ...block, index }); // Store original index
      currentLines += estimatedLines + spacing;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.map((pageBlocks, pageIndex) => (
      <div key={pageIndex} className="script-page relative mb-8 shadow-2xl">
        {/* Page Number */}
        <div className="absolute top-4 right-8 text-gray-400 text-xs font-mono select-none">
          {pageIndex + 1}.
        </div>
        
        {pageBlocks.map((block) => {
          const { className } = formatLine(block.type, block.text);
          return (
            <textarea
              key={block.id}
              ref={el => blockRefs.current[block.id] = el}
              value={block.text}
              onChange={(e) => handleTextChange(block.id, e.target.value, block.type)}
              onKeyDown={(e) => handleKeyDown(e, block.index)}
              onFocus={() => setFocusedBlockId(block.id)}
              className={`${className} resize-none overflow-hidden bg-transparent focus:outline-none focus:bg-blue-50/50`}
              placeholder={block.type === 'Scene Heading' ? 'INT. LOCATION - TIME' : ''}
              rows={1}
              style={{ height: 'auto', minHeight: '1.5em' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          );
        })}
      </div>
    ));
  };

  const activeFormat = blocks.find(b => b.id === focusedBlockId)?.type || 'Action';

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-arc-teal/30">
      <SourceMaterialDrawer
        isOpen={isSourceDrawerOpen}
        onToggle={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)}
        content={sourceContent}
        onInsert={handleInsertSourceMaterial}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Area with Pagination */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-900 flex flex-col items-center custom-scrollbar">
          {renderPages()}
          
          {/* Bottom padding to scroll past last page */}
          <div className="h-32"></div>
        </div>

        {/* Format Bar */}
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4 px-6 z-50 shadow-lg">
          <FormatButton label="Slug" shortcut="1" isActive={activeFormat === 'Scene Heading'} onClick={() => handleFormatChange('Scene Heading')} />
          <FormatButton label="Action" shortcut="2" isActive={activeFormat === 'Action'} onClick={() => handleFormatChange('Action')} />
          <FormatButton label="Char" shortcut="3" isActive={activeFormat === 'Character'} onClick={() => handleFormatChange('Character')} />
          <FormatButton label="Dial" shortcut="4" isActive={activeFormat === 'Dialogue'} onClick={() => handleFormatChange('Dialogue')} />
          <FormatButton label="Par" shortcut="5" isActive={activeFormat === 'Parenthetical'} onClick={() => handleFormatChange('Parenthetical')} />
          
          <div className="w-px h-8 bg-gray-800 mx-2"></div>
          
          <div className="relative">
            <button
              onClick={() => setIsMagicMenuOpen(!isMagicMenuOpen)}
              disabled={isGeneratingScene}
              className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2"
            >
              {isGeneratingScene ? 'Thinking...' : 'Draft Assist'}
              <ChevronRight className={`w-4 h-4 transition-transform ${isMagicMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {isMagicMenuOpen && (
              <div className="absolute bottom-full mb-4 right-0 w-64 bg-gray-900 border border-arc-teal rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                <button onClick={handleMagicWand} className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest border-b border-gray-800 transition-colors">
                  Auto-Draft Scene
                </button>
                <button onClick={handleSuggestDialogue} className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest border-b border-gray-800 transition-colors">
                  Suggest Dialogue
                </button>
                <button disabled className="w-full text-left p-4 opacity-50 cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest transition-colors">
                  Rewrite Selection
                </button>
              </div>
            )}

            {isSuggestionModalOpen && (
               <div className="absolute bottom-full mb-4 right-0 w-96 bg-gray-900 border-2 border-arc-teal rounded-2xl shadow-[0_0_50px_rgba(0,206,201,0.2)] overflow-hidden z-[60] p-4 flex flex-col gap-3">
                  <div className="text-arc-teal text-xs font-black uppercase tracking-widest mb-2">Select Dialogue Option</div>
                  {suggestions.map((option, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleInsertSuggestion(option)}
                      className="text-left p-3 rounded-lg bg-gray-800 hover:bg-arc-teal/20 hover:border-arc-teal border border-transparent transition-all text-sm text-gray-200"
                    >
                      "{option}"
                    </button>
                  ))}
                  <button 
                    onClick={() => setIsSuggestionModalOpen(false)}
                    className="mt-2 text-xs text-gray-500 hover:text-white uppercase tracking-widest"
                  >
                    Cancel
                  </button>
               </div>
            )}
          </div>
        </div>
      </div>

      <StoryInsights
        onAnalyzeScene={handleAnalyzeSceneRequest}
        messages={aiFeedbackMessages}
        isAnalyzing={isAnalyzing}
        score={logicScore}
        dynamics={sceneDynamics}
        totalLines={blocks.length}
        isSaving={isSaving}
        isSaved={isSaved}
      />
    </div>
  );
};

const FormatButton = ({ label, shortcut, isActive, onClick }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`relative px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${isActive ? 'bg-arc-teal text-black shadow-[0_0_10px_rgba(0,206,201,0.4)]' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
  >
    {label}
  </button>
);

export default ScriptEditor;