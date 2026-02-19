import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, FileText, ArrowLeft, Save, Target, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatLine } from '../utils/formatUtils';
import StoryInsights from './StoryInsights';
import SourceMaterialDrawer from './SourceMaterialDrawer';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const generateId = () => Math.random().toString(36).substr(2, 9);

const ScriptEditor = ({ universeId, projectId }) => {
  const navigate = useNavigate();
  const initialBlocks = [
    { id: generateId(), type: 'Scene Heading', text: 'INT. STARTING POINT - DAY' },
    { id: generateId(), type: 'Action', text: '' }
  ];
  const [blocks, setBlocks] = useState(initialBlocks);
  const [focusedBlockId, setFocusedBlockId] = useState(initialBlocks[0].id);
  const [aiFeedbackMessages, setAiFeedbackMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logicScore, setLogicScore] = useState(null);
  const [sceneDynamics, setSceneDynamics] = useState(null);
  const [hookScanResult, setHookScanResult] = useState(null); 
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

  // Autocomplete State
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [universeCharacters, setUniverseCharacters] = useState([]);

  const getDocumentRef = useCallback(() => {
    return doc(db, 'universes', universeId, 'projects', projectId, 'script', 'content');
  }, [universeId, projectId]);

  const getProjectRef = useCallback(() => {
    return doc(db, 'universes', universeId, 'projects', projectId);
  }, [universeId, projectId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectRef = getProjectRef();
        const docSnap = await getDoc(projectRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // User requested: Prioritize CLEAN source_material (Beats + Cast)
          // Removing Project Bible fallback from top priority to ensure clean view
          const cleanContent = data.source_material || data.bible_content || "No source material available.";
          setSourceContent(cleanContent);
          setUniverseCharacters(data.characters || []);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
      }
    };
    fetchData();
  }, [getProjectRef]);

  const saveScriptToFirestore = useCallback(async (currentBlocks) => {
    setIsSaving(true);
    setIsSaved(false);
    try {
      const sanitizedBlocks = currentBlocks.map(block => ({
        id: block.id || generateId(),
        type: block.type || "Action",
        text: block.text || ""
      }));
      const scriptRef = getDocumentRef();
      await setDoc(scriptRef, { blocks: sanitizedBlocks });
      lastSavedBlocksRef.current = sanitizedBlocks;
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
          setFocusedBlockId(loadedBlocks[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading script:", error);
    }
  }, [getDocumentRef]);

  useEffect(() => {
    loadScriptFromFirestore();
  }, [loadScriptFromFirestore]);

  // Robust Auto-Resize Logic
  const resizeBlock = useCallback((id) => {
    const el = blockRefs.current[id];
    if (el) {
      el.style.height = '0px'; // Reset to get accurate scrollHeight
      const newHeight = Math.max(24, el.scrollHeight);
      el.style.height = newHeight + 'px';
    }
  }, []);

  const resizeAllBlocks = useCallback(() => {
    Object.keys(blockRefs.current).forEach(id => resizeBlock(id));
  }, [resizeBlock]);

  // Resize on blocks change
  useEffect(() => {
    // Small delay to ensure styles and fonts are applied
    const timer = setTimeout(resizeAllBlocks, 50);
    return () => clearTimeout(timer);
  }, [blocks, resizeAllBlocks]);

  // Resize on window resize
  useEffect(() => {
    window.addEventListener('resize', resizeAllBlocks);
    return () => window.removeEventListener('resize', resizeAllBlocks);
  }, [resizeAllBlocks]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && !isNaN(e.key)) {
        const num = parseInt(e.key);
        const formats = ['Scene Heading', 'Action', 'Character', 'Dialogue', 'Parenthetical'];
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          handleFormatChange(formats[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [focusedBlockId, blocks]);

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
    
    // Immediate resize
    resizeBlock(id);

    // Autocomplete Logic
    if (type === 'Character' || type === 'Scene Heading') {
      const query = text.toUpperCase();
      let matches = [];
      
      if (type === 'Character') {
        matches = universeCharacters
          .map(c => c.name.toUpperCase())
          .filter(name => name.startsWith(query) && query.length > 0);
      } else {
        matches = Array.from(new Set(blocks
          .filter(b => b.type === 'Scene Heading' && b.id !== id)
          .map(b => b.text.toUpperCase())))
          .filter(loc => loc.startsWith(query) && query.length > 0);
      }

      setAutocompleteSuggestions(matches.slice(0, 5));
      setShowAutocomplete(matches.length > 0);
      setAutocompleteIndex(0);
    } else {
      setShowAutocomplete(false);
    }
  };

  const applyAutocomplete = (suggestion) => {
    if (focusedBlockId) {
      updateBlock(focusedBlockId, { text: suggestion });
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e, index) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex(prev => (prev + 1) % autocompleteSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex(prev => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyAutocomplete(autocompleteSuggestions[autocompleteIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        return;
      }
    }

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
      const prevBlockId = blocks[index - 1]?.id;
      const newBlocks = blocks.filter(b => b.id !== blocks[index].id);
      setBlocks(newBlocks);
      setIsSaved(false);
      setTimeout(() => {
        if (prevBlockId && blockRefs.current[prevBlockId]) {
          blockRefs.current[prevBlockId].focus();
          // Move cursor to end of previous block
          const length = blockRefs.current[prevBlockId].value.length;
          blockRefs.current[prevBlockId].setSelectionRange(length, length);
        }
      }, 0);
    }
  };

  const handleFormatChange = (newFormat) => {
    if (focusedBlockId) {
      setBlocks(prev => prev.map(b => {
        if (b.id === focusedBlockId) {
          const { text: formattedText } = formatLine(newFormat, b.text);
          return { ...b, type: newFormat, text: formattedText };
        }
        return b;
      }));
      setIsSaved(false);
      // Small delay to let React apply the new class before measuring
      setTimeout(() => resizeBlock(focusedBlockId), 0);
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
      const projectRef = getProjectRef();
      const projectSnap = await getDoc(projectRef);
      const projectData = projectSnap.exists() ? projectSnap.data() : {};
      const beatSheet = projectData.beat_sheet || {};
      const characterNames = (projectData.characters || []).map(char => char.name || 'Unknown');

      const context = blocks.slice(-15).map(b => b.text).join('\n').slice(-2000);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/suggest_dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          context_lines: context,
          genre: projectData.genre || "Drama",
          style: projectData.vibe || "Modern",
          beat_context: JSON.stringify(beatSheet),
          characters: characterNames
        })
      });
      if (!response.ok) throw new Error('Failed to get suggestion');
      const data = await response.json();
      const newSuggestions = Array.isArray(data) ? data : data.suggestions || [];

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
      const characterNames = (projectData.characters || []).map(char => char.name || 'Unknown');
      const existingScriptContext = blocks.map(b => b.text).join('\n').slice(-2000);

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/generate_scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          beat_context: JSON.stringify(beatSheet),
          characters: characterNames,
          game_theory_type: "Prisoner's Dilemma",
          existing_script: existingScriptContext
        })
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      const generatedBlocks = (data.blocks || []).map(block => ({
        id: generateId(),
        type: block.type || 'Action',
        text: block.text || ""
      }));

      if (generatedBlocks.length > 0) {
        setBlocks(generatedBlocks);
        setIsSaved(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Draft Assist failed: ${error.message}`);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleHookScan = async () => {
    setIsAnalyzing(true);
    setHookScanResult(null);
    const scriptText = blocks.map(block => block.text).join('\n');
    try {
      const projectRef = getProjectRef();
      const projectSnap = await getDoc(projectRef);
      const genre = projectSnap.exists() ? projectSnap.data().genre : "Drama";

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/hook_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ script_text: scriptText, genre }),
      });
      if (!response.ok) throw new Error('Hook Scan Failed');
      const data = await response.json();
      setHookScanResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Gatekeeper Audit failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
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
      if (data.tension_curve) setSceneDynamics(data);
    } catch (error) {
      console.error("Error:", error);
      setAiFeedbackMessages((prev) => [...prev, `[ERROR] Analysis failed.`]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [blocks, isSaved, saveScriptToFirestore, universeId, projectId]);

  const renderPages = () => {
    const LINES_PER_PAGE = 52; // Standard 11" page minus 1" margins @ 6 lines/inch
    const pages = [];
    let currentPage = [];
    let currentLines = 0;

    blocks.forEach((block, index) => {
      const text = block.text || "";
      
      // Recalibrated for 6.0" printable area (8.5" total - 1.5" Left - 1.0" Right)
      // Action/Slug: ~60 chars wide | Dialogue: ~35 chars wide | Parenthetical: ~20 chars wide
      let charsPerLine = 60;
      if (block.type === 'Dialogue') charsPerLine = 35;
      if (block.type === 'Parenthetical') charsPerLine = 20;
      if (block.type === 'Character') charsPerLine = 35;

      const estimatedLines = Math.max(1, Math.ceil(text.length / charsPerLine));
      
      // Add extra line for margins (slugs, actions, and dialogue have margin-bottom: 1em)
      const spacing = (block.type === 'Character' || block.type === 'Parenthetical') ? 0 : 1;

      if (currentLines + estimatedLines + spacing > LINES_PER_PAGE) {
        pages.push(currentPage);
        currentPage = [];
        currentLines = 0;
      }

      currentPage.push({ ...block, index });
      currentLines += estimatedLines + spacing;
    });
    if (currentPage.length > 0) pages.push(currentPage);

    return pages.map((pageBlocks, pageIndex) => (
      <div key={pageIndex} className="script-page relative mb-8 shadow-2xl">
        <div className="absolute top-4 right-8 text-gray-400 text-xs font-mono select-none">{pageIndex + 1}.</div>
        {pageBlocks.map((block) => {
          const { className } = formatLine(block.type, block.text);
          return (
            <div key={block.id} className="relative group/block">
              <textarea
                ref={el => blockRefs.current[block.id] = el}
                value={block.text}
                onChange={(e) => handleTextChange(block.id, e.target.value, block.type)}
                onKeyDown={(e) => handleKeyDown(e, block.index)}
                onFocus={() => {
                  setFocusedBlockId(block.id);
                  setShowAutocomplete(false);
                  resizeBlock(block.id); // Ensure resize on focus
                }}
                className={`${className} script-block resize-none overflow-hidden bg-transparent focus:outline-none focus:bg-blue-50/50 transition-colors`}
                placeholder={block.type === 'Scene Heading' ? 'INT. LOCATION - TIME' : ''}
              />
              
              {/* Autocomplete Menu */}
              {showAutocomplete && focusedBlockId === block.id && (
                <div className="absolute left-0 top-full z-[100] w-64 bg-gray-900 border border-arc-teal rounded-lg shadow-2xl overflow-hidden animate-fade-in">
                  {autocompleteSuggestions.map((s, idx) => (
                    <button
                      key={s}
                      onClick={() => applyAutocomplete(s)}
                      onMouseEnter={() => setAutocompleteIndex(idx)}
                      className={`w-full text-left p-3 text-xs font-bold uppercase tracking-widest transition-colors ${idx === autocompleteIndex ? 'bg-arc-teal text-black' : 'text-white hover:bg-gray-800'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  const activeFormat = blocks.find(b => b.id === focusedBlockId)?.type || 'Action';

  return (
    <div className="flex h-screen bg-black overflow-hidden selection:bg-arc-teal/30">
      <SourceMaterialDrawer isOpen={isSourceDrawerOpen} onToggle={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)} content={sourceContent} onInsert={handleInsertSourceMaterial} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors" title="Exit to Dashboard"><ArrowLeft className="w-5 h-5" /></button>
            <div className="h-4 w-px bg-gray-700"></div>
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-arc-teal uppercase tracking-widest cursor-default">Script Editor</span>
              <button 
                onClick={() => navigate(`/project/${projectId}/beat-sheet`, { state: { project_id: projectId, universe_id: universeId } })}
                className="text-xs font-bold text-gray-500 hover:text-arc-orange uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Target className="w-3.5 h-3.5" />
                Project Blueprint
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-[10px] uppercase tracking-tighter ${isSaved ? 'text-gray-600' : 'text-arc-orange animate-pulse'}`}>{isSaving ? 'Saving...' : isSaved ? 'All changes saved' : 'Unsaved Changes'}</span>
            <button onClick={() => saveScriptToFirestore(blocks)} className="p-2 hover:bg-gray-800 rounded-lg text-arc-teal transition-colors"><Save className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-gray-900 flex flex-col items-center custom-scrollbar">{renderPages()}<div className="h-64"></div></div>
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4 px-6 z-50 shadow-lg">
          <FormatButton label="Slug" shortcut="1" isActive={activeFormat === 'Scene Heading'} onClick={() => handleFormatChange('Scene Heading')} />
          <FormatButton label="Action" shortcut="2" isActive={activeFormat === 'Action'} onClick={() => handleFormatChange('Action')} />
          <FormatButton label="Char" shortcut="3" isActive={activeFormat === 'Character'} onClick={() => handleFormatChange('Character')} />
          <FormatButton label="Dial" shortcut="4" isActive={activeFormat === 'Dialogue'} onClick={() => handleFormatChange('Dialogue')} />
          <FormatButton label="Par" shortcut="5" isActive={activeFormat === 'Parenthetical'} onClick={() => handleFormatChange('Parenthetical')} />
          <div className="w-px h-8 bg-gray-800 mx-2"></div>
          <div className="relative">
            <button onClick={() => setIsMagicMenuOpen(!isMagicMenuOpen)} disabled={isGeneratingScene} className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2">{isGeneratingScene ? 'Thinking...' : 'Draft Assist'}<ChevronRight className={`w-4 h-4 transition-transform ${isMagicMenuOpen ? 'rotate-90' : ''}`} /></button>
            {isMagicMenuOpen && (
              <div className="absolute bottom-full mb-4 right-0 w-64 bg-gray-900 border border-arc-teal rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
                <button onClick={handleMagicWand} className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest border-b border-gray-800 transition-colors">Auto-Draft Scene</button>
                <button onClick={handleSuggestDialogue} className="w-full text-left p-4 hover:bg-purple-600/20 text-white text-xs font-bold uppercase tracking-widest border-b border-gray-800 transition-colors">Suggest Dialogue</button>
              </div>
            )}
            {isSuggestionModalOpen && (
               <div className="absolute bottom-full mb-4 right-0 w-96 bg-gray-900 border-2 border-arc-teal rounded-2xl shadow-[0_0_50px_rgba(0,206,201,0.2)] overflow-hidden z-[60] p-4 flex flex-col gap-3">
                  <div className="text-arc-teal text-xs font-black uppercase tracking-widest mb-2">Select Dialogue Option</div>
                  {suggestions.map((option, idx) => (<button key={idx} onClick={() => handleInsertSuggestion(option)} className="text-left p-3 rounded-lg bg-gray-800 hover:bg-arc-teal/20 hover:border-arc-teal border border-transparent transition-all text-sm text-gray-200">"{option}"</button>))}
                  <button onClick={() => setIsSuggestionModalOpen(false)} className="mt-2 text-xs text-gray-500 hover:text-white uppercase tracking-widest">Cancel</button>
               </div>
            )}
          </div>
        </div>
      </div>
      <StoryInsights onAnalyzeScene={handleAnalyzeSceneRequest} onHookScan={handleHookScan} messages={aiFeedbackMessages} isAnalyzing={isAnalyzing} hookScanResult={hookScanResult} score={logicScore} dynamics={sceneDynamics} totalLines={blocks.length} isSaving={isSaving} isSaved={isSaved} />
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