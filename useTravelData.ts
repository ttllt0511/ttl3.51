import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RoomData, SubRoom, ItineraryItem, NoteItem, Expense } from '../types';
import { INITIAL_ITINERARY, INITIAL_EXPENSES } from '../constants';

// Key prefix for individual room storage
const ROOM_KEY_PREFIX = 'tm_room_';

export const useTravelData = () => {
  const [roomId, setRoomId] = useState<string | null>(() => localStorage.getItem('tm_current_room_id'));
  const [subRoomId, setSubRoomId] = useState<string | null>(() => localStorage.getItem('tm_current_sub_room_id'));
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  const getStorageKey = useCallback((id: string) => `${ROOM_KEY_PREFIX}${id}`, []);

  // 1. Data Loading
  const loadRoomData = useCallback((id: string) => {
    try {
      const dataStr = localStorage.getItem(getStorageKey(id));
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        // Ensure all required fields exist to prevent crashes
        const sanitized: RoomData = {
          ...parsed,
          mainItinerary: Array.isArray(parsed.mainItinerary) ? parsed.mainItinerary : [],
          mainNotes: Array.isArray(parsed.mainNotes) ? parsed.mainNotes : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          subRooms: parsed.subRooms || {},
          members: Array.isArray(parsed.members) ? parsed.members : ['我'],
          password: parsed.password
        };
        setRoomData(sanitized);
      } else {
        // Handle case where room doesn't exist in storage but ID is set
        console.warn(`Room ${id} not found.`);
        setRoomData(null);
      }
    } catch (e) {
      console.error("Failed to load room data", e);
      setRoomData(null);
    }
  }, [getStorageKey]);

  useEffect(() => {
    if (roomId) {
      loadRoomData(roomId);
    }
  }, [roomId, loadRoomData]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (roomId && e.key === getStorageKey(roomId)) {
         loadRoomData(roomId);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [roomId, loadRoomData, getStorageKey]);

  // 2. Auto Save
  useEffect(() => {
    if (roomId && roomData && roomData.id === roomId) {
      try {
        localStorage.setItem(getStorageKey(roomId), JSON.stringify(roomData));
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }
  }, [roomData, roomId, getStorageKey]);

  // --- ACTIONS ---

  const login = useCallback((id: string, password?: string) => {
    const key = getStorageKey(id);
    const storedData = localStorage.getItem(key);
    
    // Check for legacy data migration (optional, simple check)
    if (!storedData && localStorage.getItem('tm_rooms')) {
       // Legacy migration logic omitted for brevity in this fix, 
       // assuming legacy migration is handled or unnecessary for this specific error.
       // Focusing on core login.
    }

    if (storedData) {
       try {
         const room = JSON.parse(storedData);
         if (room.password && room.password !== password) {
           alert("密碼錯誤");
           return;
         }
         setRoomId(id);
         localStorage.setItem('tm_current_room_id', id);
         loadRoomData(id);
       } catch (e) {
         console.error("Corrupt room data");
       }
    } else {
      alert("找不到此房間，請確認房號或建立新房間。");
    }
  }, [getStorageKey, loadRoomData]);

  const createRoom = useCallback((id: string, password?: string) => {
    const key = getStorageKey(id);
    if (localStorage.getItem(key)) {
      alert("此房號已被使用");
      return;
    }

    const newRoom: RoomData = {
      id,
      password,
      mainItinerary: INITIAL_ITINERARY,
      expenses: INITIAL_EXPENSES,
      subRooms: {},
      mainNotes: [],
      members: ['我']
    };

    try {
      localStorage.setItem(key, JSON.stringify(newRoom));
      setRoomId(id);
      localStorage.setItem('tm_current_room_id', id);
      setRoomData(newRoom);
    } catch (e) {
      alert("創建失敗：儲存空間不足");
    }
  }, [getStorageKey]);

  const logout = useCallback(() => {
    setRoomId(null);
    setSubRoomId(null);
    setRoomData(null);
    localStorage.removeItem('tm_current_room_id');
    localStorage.removeItem('tm_current_sub_room_id');
  }, []);

  const switchSubRoom = useCallback((id: string | null) => {
    setSubRoomId(id);
    if (id) localStorage.setItem('tm_current_sub_room_id', id);
    else localStorage.removeItem('tm_current_sub_room_id');
  }, []);

  const createSubRoom = useCallback((name: string) => {
    const newId = Date.now().toString();
    const newSub: SubRoom = {
      id: newId,
      name,
      itinerary: [],
      notes: []
    };
    
    setRoomData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        subRooms: {
          ...prev.subRooms || {},
          [newId]: newSub
        }
      };
    });
    setSubRoomId(newId);
    localStorage.setItem('tm_current_sub_room_id', newId);
  }, []);

  const deleteSubRoom = useCallback((id: string) => {
    const subName = roomData?.subRooms?.[id]?.name || "此房間";
    if (!window.confirm(`確定要刪除 "${subName}" 嗎？`)) return;

    setRoomData(prev => {
      if (!prev) return null;
      const newSubRooms = { ...(prev.subRooms || {}) };
      delete newSubRooms[id];
      return { ...prev, subRooms: newSubRooms };
    });

    if (subRoomId === id) {
      setSubRoomId(null);
      localStorage.removeItem('tm_current_sub_room_id');
    }
  }, [roomData, subRoomId]);

  const updateItinerary = useCallback((action: React.SetStateAction<ItineraryItem[]>) => {
    setRoomData(prev => {
      if (!prev) return null;
      const currentList = subRoomId && prev.subRooms?.[subRoomId] 
        ? (prev.subRooms[subRoomId].itinerary || [])
        : (prev.mainItinerary || []);

      const newItems = typeof action === 'function' ? (action as any)(currentList) : action;

      if (subRoomId && prev.subRooms?.[subRoomId]) {
        return {
          ...prev,
          subRooms: {
            ...prev.subRooms,
            [subRoomId]: {
              ...prev.subRooms[subRoomId],
              itinerary: newItems
            }
          }
        };
      } else {
        return { ...prev, mainItinerary: newItems };
      }
    });
  }, [subRoomId]);

  const updateNotes = useCallback((action: React.SetStateAction<NoteItem[]>) => {
    setRoomData(prev => {
      if (!prev) return null;
      const currentList = subRoomId && prev.subRooms?.[subRoomId] 
        ? (prev.subRooms[subRoomId].notes || []) 
        : (prev.mainNotes || []);

      const newItems = typeof action === 'function' ? (action as any)(currentList) : action;

      if (subRoomId && prev.subRooms?.[subRoomId]) {
        return {
          ...prev,
          subRooms: {
            ...prev.subRooms,
            [subRoomId]: {
              ...prev.subRooms[subRoomId],
              notes: newItems
            }
          }
        };
      } else {
        return { ...prev, mainNotes: newItems };
      }
    });
  }, [subRoomId]);

  const updateExpenses = useCallback((action: React.SetStateAction<Expense[]>) => {
    setRoomData(prev => {
      if (!prev) return null;
      const currentList = prev.expenses || [];
      const newExpenses = typeof action === 'function' ? (action as any)(currentList) : action;
      return { ...prev, expenses: newExpenses };
    });
  }, []);

  const updateMembers = useCallback((newMembers: string[], oldName?: string, newName?: string) => {
    setRoomData(prev => {
      if (!prev) return null;
      let updatedExpenses = prev.expenses;
      if (oldName && newName && oldName !== newName) {
        updatedExpenses = prev.expenses.map(exp => ({
          ...exp,
          payer: exp.payer === oldName ? newName : exp.payer,
          splitWith: exp.splitWith.map(p => p === oldName ? newName : p)
        }));
      }
      return { ...prev, members: newMembers, expenses: updatedExpenses };
    });
  }, []);

  // --- DERIVED VALUES ---
  const currentItinerary = useMemo(() => {
    if (!roomData) return [];
    if (subRoomId && roomData.subRooms?.[subRoomId]) {
      return roomData.subRooms[subRoomId].itinerary || [];
    }
    return roomData.mainItinerary || [];
  }, [roomData, subRoomId]);

  const currentNotes = useMemo(() => {
    if (!roomData) return [];
    if (subRoomId && roomData.subRooms?.[subRoomId]) {
      return roomData.subRooms[subRoomId].notes || [];
    }
    return roomData.mainNotes || [];
  }, [roomData, subRoomId]);

  const currentExpenses = useMemo(() => roomData?.expenses || [], [roomData]);
  const currentMembers = useMemo(() => roomData?.members || ['我'], [roomData]);
  
  const subRoomNames = useMemo(() => {
     if (!roomData?.subRooms) return {};
     return Object.fromEntries(
       Object.values(roomData.subRooms).map((s: SubRoom) => [s.id, s.name])
     );
  }, [roomData]);

  const sharedItineraryItems = useMemo(() => {
    if (!roomData) return [];
    if (subRoomId) {
       return (roomData.mainItinerary || []).map(i => ({...i, ownerName: '母房間'}));
    } else {
       const items: ItineraryItem[] = [];
       if (roomData.subRooms) {
         Object.values(roomData.subRooms).forEach((sub: SubRoom) => {
            if (sub && sub.itinerary) {
               items.push(...sub.itinerary.map(i => ({...i, ownerName: sub.name, ownerId: sub.id})));
            }
         });
       }
       return items;
    }
  }, [roomData, subRoomId]);

  return {
    roomId,
    subRoomId,
    roomData,
    subRoomNames,
    currentItinerary,
    currentNotes,
    currentExpenses,
    currentMembers,
    sharedItineraryItems,
    actions: {
      login,
      createRoom,
      logout,
      createSubRoom,
      deleteSubRoom,
      switchSubRoom,
      updateItinerary,
      updateNotes,
      updateExpenses,
      updateMembers
    }
  };
};