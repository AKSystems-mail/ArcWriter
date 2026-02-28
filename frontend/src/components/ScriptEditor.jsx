import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, FileText, ArrowLeft, Save, Target, BrainCircuit, RefreshCw, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatLine } from '../utils/formatUtils';
import StoryInsights from './StoryInsights';
import SourceMaterialDrawer from './SourceMaterialDrawer';
import HistorySidebar from './HistorySidebar';
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
  const [macroAuditResult, setMacroAuditResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const lastSavedBlocksRef = useRef(blocks);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState(false);
  const [isInsightsDrawerOpen, setIsInsightsDrawerOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [sourceContent, setSourceContent] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
# ... (rest of states)
  useEffect(() => {
    fetchData();
    fetchSnapshots();
  }, [getProjectRef]);

  const fetchSnapshots = async () => {
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/script/list_snapshots/${universeId}/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setSnapshots(data);
        }
    } catch (err) {
        console.error("Failed to fetch history:", err);
    }
  };

  const saveSnapshot = async (name = "Auto-save") => {
    try {
        const token = await auth.currentUser?.getIdToken();
        await fetch('/api/script/save_snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                universe_id: universeId,
                project_id: projectId,
                blocks: blocks,
                name: name
            })
        });
        fetchSnapshots(); // Refresh list
    } catch (err) {
        console.error("Snapshot failed:", err);
    }
  };

  const handleSaveMilestone = () => {
    const name = window.prompt("Name this milestone (e.g. 'First Draft', 'The Pivot'):");
    if (name) saveSnapshot(name);
  };

  const handleRestoreSnapshot = async (snapId) => {
    if (!window.confirm("CRITICAL: This will overwrite your current script. Continue?")) return;
    
    setIsSaving(true);
    try {
        const token = await auth.currentUser?.getIdToken();
        await fetch('/api/script/restore_snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                universe_id: universeId,
                project_id: projectId,
                snapshot_id: snapId
            })
        });
        // Reload
        window.location.reload(); 
    } catch (err) {
        alert("Restore failed.");
    } finally {
        setIsSaving(false);
    }
  };

  const saveScriptToFirestore = useCallback(async (currentBlocks) => {
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
        // APPEND blocks instead of replacing
        setBlocks(prev => [...prev, ...generatedBlocks]);
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
    
    // OPTIMIZATION: Only send the first ~15 pages (approx 600 blocks) for the audit
    const scriptText = blocks.slice(0, 600).map(block => block.text).join('\n');
    
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

  const handleMacroAudit = async () => {
    setIsAnalyzing(true);
    setMacroAuditResult(null);
    const fullScriptText = blocks.map(block => block.text).join('\n');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/script/macro_audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ full_script: fullScriptText, universe_id: universeId, project_id: projectId }),
      });
      if (!response.ok) throw new Error('Macro Audit Failed');
      const data = await response.json();
      setMacroAuditResult(data);
    } catch (error) {
      console.error("Error:", error);
      alert("Structural Audit failed. Ensure script is long enough.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeSceneRequest = useCallback(async (persona) => {
    setIsAnalyzing(true);
    setLogicScore(null);
    if (!isSaved) await saveScriptToFirestore(blocks);

    // OPTIMIZATION: Only send the current scene context to avoid 502/OOM on large scripts
    let relevantBlocks = [];
    const focusedIndex = blocks.findIndex(b => b.id === focusedBlockId);
    
    if (focusedIndex !== -1) {
      // Find start of current scene (nearest heading above)
      let start = focusedIndex;
      while (start > 0 && blocks[start].type !== 'Scene Heading') {
        start--;
      }
      // Find end of current scene (next heading below)
      let end = focusedIndex + 1;
      while (end < blocks.length && blocks[end].type !== 'Scene Heading') {
        end++;
      }
      relevantBlocks = blocks.slice(start, end);
    } else {
      // Fallback: Last 50 blocks if no focus
      relevantBlocks = blocks.slice(-50);
    }

    const sceneText = relevantBlocks.map(block => block.text).join('\n');
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ persona, scene_text: sceneText, universe_name: universeId, project_id: projectId }),
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
  }, [blocks, focusedBlockId, isSaved, saveScriptToFirestore, universeId, projectId]);

  const renderPages = () => {
    // Recalibrated: 9" printable height / ~0.22" per line (12pt @ 1.4 line-height) = ~40 lines max
    const LINES_PER_PAGE = 40; 
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
      <div key={pageIndex} className="script-page relative mb-8 shadow-2xl border-b-2 border-dashed border-gray-200">
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
                className={`${className} script-block resize-none overflow-hidden bg-transparent focus:outline-none focus:bg-arc-teal/[0.03] transition-colors`}
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
    <div className="flex h-screen bg-black overflow-hidden selection:bg-arc-teal/30 font-sans">
      <SourceMaterialDrawer isOpen={isSourceDrawerOpen} onToggle={() => setIsSourceDrawerOpen(!isSourceDrawerOpen)} content={sourceContent} onInsert={handleInsertSourceMaterial} />
      
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
        {/* Workspace Top Toolbar */}
        <div className="h-16 bg-[#050505] border-b border-white/5 flex items-center justify-between px-8 z-50 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                <img src="/ArcWriter_logo.png" alt="ArcWriter" className="h-6 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="h-4 w-px bg-gray-800"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 group-hover:text-arc-teal transition-colors">Studio</span>
            </div>
            <div className="h-4 w-px bg-gray-800"></div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/project/${projectId}/beat-sheet`, { state: { project_id: projectId, universe_id: universeId } })}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all group"
              >
                <Target className="w-3.5 h-3.5 text-arc-orange group-hover:scale-110 transition-transform" />
                <span>Blueprint</span>
              </button>
              <div className="h-4 w-px bg-gray-800"></div>
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all group ${isHistoryOpen ? 'text-arc-teal' : 'text-gray-500 hover:text-white'}`}
              >
                <History className="w-3.5 h-3.5 group-hover:rotate-[-45deg] transition-transform" />
                <span>Time Machine</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isSaved ? 'text-gray-700' : 'text-arc-orange animate-pulse'}`}>
                    {isSaving ? 'Synchronizing...' : isSaved ? 'Asset Integrity: Verified' : 'Unsaved Changes'}
                </span>
            </div>
            <button onClick={() => saveScriptToFirestore(blocks)} className="p-2.5 bg-white/5 border border-white/10 hover:bg-arc-teal hover:text-white rounded-sm text-arc-teal transition-all shadow-xl">
                <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Content Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-[#0a0a0a] flex flex-col items-center custom-scrollbar relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent pointer-events-none"></div>
            {renderPages()}
            <div className="h-64"></div>
        </div>

        {/* Workspace Bottom Toolbar (Instrumentation) */}
        <div className="h-24 bg-[#050505] border-t border-white/5 flex items-center justify-between px-10 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            <FormatButton label="Slugline" shortcut="1" isActive={activeFormat === 'Scene Heading'} onClick={() => handleFormatChange('Scene Heading')} />
            <FormatButton label="Action" shortcut="2" isActive={activeFormat === 'Action'} onClick={() => handleFormatChange('Action')} />
            <FormatButton label="Character" shortcut="3" isActive={activeFormat === 'Character'} onClick={() => handleFormatChange('Character')} />
            <FormatButton label="Dialogue" shortcut="4" isActive={activeFormat === 'Dialogue'} onClick={() => handleFormatChange('Dialogue')} />
            <FormatButton label="Parenthetical" shortcut="5" isActive={activeFormat === 'Parenthetical'} onClick={() => handleFormatChange('Parenthetical')} />
          </div>

          <div className="relative">
            <button 
                onClick={() => setIsMagicMenuOpen(!isMagicMenuOpen)} 
                disabled={isGeneratingScene} 
                className="group px-10 py-4 bg-white hover:bg-purple-600 text-black hover:text-white font-black text-[10px] uppercase tracking-[0.4em] transition-all duration-500 rounded-sm flex items-center gap-4 shadow-2xl shadow-white/5 disabled:opacity-50"
            >
                {isGeneratingScene ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                {isGeneratingScene ? 'Analyzing...' : 'Draft Assist'}
                <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${isMagicMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {isMagicMenuOpen && (
              <div className="absolute bottom-full mb-6 right-0 w-72 bg-black border border-white/10 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in z-50">
                <button onClick={handleMagicWand} className="w-full text-left p-6 hover:bg-purple-600/10 text-white text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5 transition-all flex items-center justify-between group">
                    Auto-Draft Scene <ChevronRight className="w-3 h-3 text-gray-700 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={handleSuggestDialogue} className="w-full text-left p-6 hover:bg-purple-600/10 text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-between group">
                    Suggest Dialogue <ChevronRight className="w-3 h-3 text-gray-700 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {isSuggestionModalOpen && (
               <div className="absolute bottom-full mb-6 right-0 w-[400px] bg-black border border-arc-teal/30 rounded-sm shadow-[0_0_60px_rgba(45,212,191,0.1)] overflow-hidden z-[60] p-8 flex flex-col gap-4">
                  <div className="text-arc-teal text-[10px] font-black uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-4">Dialogue Variants</div>
                  {suggestions.map((option, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => handleInsertSuggestion(option)} 
                        className="text-left p-5 bg-[#080808] hover:bg-arc-teal/5 border border-white/5 hover:border-arc-teal/30 rounded-sm transition-all text-sm text-gray-300 font-light italic leading-relaxed group"
                    >
                        "{option}"
                    </button>
                  ))}
                  <button onClick={() => setIsSuggestionModalOpen(false)} className="mt-4 text-[9px] text-gray-600 hover:text-white uppercase font-black tracking-widest transition-colors">Discard Suggestions</button>
               </div>
            )}
          </div>
        </div>
      </div>

      <StoryInsights 
        onAnalyzeScene={handleAnalyzeSceneRequest} 
        onHookScan={handleHookScan} 
        onMacroAudit={handleMacroAudit}
        messages={aiFeedbackMessages} 
        isAnalyzing={isAnalyzing} 
        hookScanResult={hookScanResult} 
        macroAuditResult={macroAuditResult}
        score={logicScore} 
        dynamics={sceneDynamics} 
        totalLines={blocks.length} 
        isSaving={isSaving} 
        isSaved={isSaved}
        isOpen={isInsightsDrawerOpen}
        onToggle={() => setIsInsightsDrawerOpen(!isInsightsDrawerOpen)}
      />

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onToggle={() => setIsHistoryOpen(false)} 
        snapshots={snapshots} 
        onRestore={handleRestoreSnapshot}
        onSaveMilestone={handleSaveMilestone}
        isSaving={isSaving}
      />
    </div>
  );
};

const FormatButton = ({ label, shortcut, isActive, onClick }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`relative px-6 py-3 rounded-sm font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border group ${isActive ? 'bg-arc-teal border-arc-teal text-black shadow-glow' : 'bg-transparent border-white/5 text-gray-600 hover:text-white hover:border-white/20'}`}
  >
    <span className={`absolute top-1 left-1.5 text-[7px] font-black transition-opacity ${isActive ? 'opacity-50' : 'opacity-20 group-hover:opacity-100'}`}>{shortcut}</span>
    {label}
  </button>
);

export default ScriptEditor;