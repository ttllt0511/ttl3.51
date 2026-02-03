
import React, { createContext, useContext, ReactNode } from 'react';
import { useTravelData } from '../hooks/useTravelData';
import { RoomData, ItineraryItem, NoteItem, Expense } from '../types';

// Return type of the useTravelData hook
type TravelContextType = ReturnType<typeof useTravelData>;

const TravelContext = createContext<TravelContextType | null>(null);

export const useTravel = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
};

interface TravelProviderProps {
  children: ReactNode;
}

export const TravelProvider: React.FC<TravelProviderProps> = ({ children }) => {
  const travelData = useTravelData();

  return (
    <TravelContext.Provider value={travelData}>
      {children}
    </TravelContext.Provider>
  );
};
